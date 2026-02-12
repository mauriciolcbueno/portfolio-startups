// supabase/functions/analyze-startup-health/index.ts
//
// Disparada por Database Webhook toda vez que um registro é inserido/atualizado em `metrics`.
// Busca os 3 últimos meses + notas de reuniões recentes, chama a API da Anthropic
// e atualiza o status e a justificativa da startup.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
)

const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY')!

// ── Tipos ────────────────────────────────────────────────────────────────────

interface MetricsRow {
  startup_id: string
  month: number
  year: number
  revenue: number
  cash_balance: number
  ebitda_or_burn: number
  headcount: number
  highlights: string | null
  next_steps: string | null
}

interface MeetingRow {
  date: string
  notes: string | null
}

interface AnalysisResult {
  status: 'healthy' | 'attention' | 'critical'
  justification: string
}

// ── Handler principal ─────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  try {
    // O webhook do Supabase envia o payload da linha inserida/atualizada
    const payload = await req.json()
    const startupId: string = payload.record?.startup_id ?? payload.startup_id

    if (!startupId) {
      return new Response(JSON.stringify({ error: 'startup_id não encontrado no payload' }), { status: 400 })
    }

    // ── 1. Buscar os 3 últimos meses de métricas ──────────────────────────────
    const { data: metricsRows, error: metricsError } = await supabase
      .from('metrics')
      .select('startup_id, month, year, revenue, cash_balance, ebitda_or_burn, headcount, highlights, next_steps')
      .eq('startup_id', startupId)
      .order('year', { ascending: false })
      .order('month', { ascending: false })
      .limit(3)

    if (metricsError) throw metricsError
    if (!metricsRows || metricsRows.length === 0) {
      return new Response(JSON.stringify({ skipped: 'sem métricas disponíveis' }), { status: 200 })
    }

    // ── 2. Buscar notas das reuniões dos últimos 90 dias ──────────────────────
    const ninetyDaysAgo = new Date()
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)

    const { data: meetingRows } = await supabase
      .from('meetings')
      .select('date, notes')
      .eq('startup_id', startupId)
      .gte('date', ninetyDaysAgo.toISOString().split('T')[0])
      .order('date', { ascending: false })

    // ── 3. Buscar nome da startup ─────────────────────────────────────────────
    const { data: startupRow } = await supabase
      .from('startups')
      .select('name, sector')
      .eq('id', startupId)
      .single()

    // ── 4. Montar contexto para a IA ──────────────────────────────────────────
    const metricsContext = buildMetricsContext(metricsRows as MetricsRow[])
    const meetingsContext = buildMeetingsContext(meetingRows as MeetingRow[] ?? [])

    // ── 5. Chamar a API da Anthropic ──────────────────────────────────────────
    const analysis = await callClaude(
      startupRow?.name ?? 'Startup',
      startupRow?.sector ?? '',
      metricsContext,
      meetingsContext,
    )

    // ── 6. Atualizar status e justificativa na tabela startups ────────────────
    const { error: updateError } = await supabase
      .from('startups')
      .update({
        status: analysis.status,
        health_justification: analysis.justification,
        health_updated_at: new Date().toISOString(),
      })
      .eq('id', startupId)

    if (updateError) throw updateError

    return new Response(JSON.stringify({ success: true, startupId, analysis }), {
      headers: { 'Content-Type': 'application/json' },
    })

  } catch (err) {
    console.error('Erro na função analyze-startup-health:', err)
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 })
  }
})

// ── Helpers ───────────────────────────────────────────────────────────────────

function monthLabel(month: number, year: number): string {
  return new Date(year, month - 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
}

function buildMetricsContext(rows: MetricsRow[]): string {
  return rows.map((m, i) => {
    const label = i === 0 ? `Mês mais recente (${monthLabel(m.month, m.year)})` : monthLabel(m.month, m.year)
    const burnLabel = m.ebitda_or_burn < 0
      ? `Burn: R$ ${Math.abs(m.ebitda_or_burn).toLocaleString('pt-BR')}`
      : `EBITDA: R$ ${m.ebitda_or_burn.toLocaleString('pt-BR')}`
    return [
      `### ${label}`,
      `- Receita: R$ ${m.revenue.toLocaleString('pt-BR')}`,
      `- Saldo em caixa: R$ ${m.cash_balance.toLocaleString('pt-BR')}`,
      `- ${burnLabel}`,
      `- Headcount: ${m.headcount}`,
      m.highlights ? `- Destaques: ${m.highlights}` : null,
      m.next_steps ? `- Próximos passos: ${m.next_steps}` : null,
    ].filter(Boolean).join('\n')
  }).join('\n\n')
}

function buildMeetingsContext(rows: MeetingRow[]): string {
  if (rows.length === 0) return 'Nenhuma reunião de conselho registrada nos últimos 90 dias.'
  return rows.map(m => {
    const date = new Date(m.date + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
    return `- ${date}: ${m.notes ?? '(sem notas registradas)'}`
  }).join('\n')
}

async function callClaude(
  name: string,
  sector: string,
  metricsContext: string,
  meetingsContext: string,
): Promise<AnalysisResult> {
  const systemPrompt = `Você é um analista especializado em venture capital brasileiro. 
Sua função é avaliar a saúde de startups do portfólio com base em dados financeiros e 
observações de reuniões de conselho.

Você deve retornar APENAS um JSON válido, sem markdown, sem explicação extra. O formato é:
{
  "status": "healthy" | "attention" | "critical",
  "justification": "string em português, máximo 3 frases, objetiva e direta"
}

Critérios para status:
- "healthy": crescimento de receita, caixa saudável (>6 meses de runway), EBITDA positivo ou burn controlado, time estável
- "attention": sinais mistos — receita estagnada ou leve queda, caixa entre 3-6 meses de runway, burn acima do planejado, ou alertas nas notas de reunião
- "critical": queda acentuada de receita, caixa < 3 meses de runway, burn elevado e crescente, ou problemas graves relatados em reuniões`

  const userPrompt = `Analise a saúde da startup abaixo e retorne o JSON de avaliação.

## Startup
Nome: ${name}
Setor: ${sector}

## Métricas dos últimos 3 meses
${metricsContext}

## Notas das reuniões de conselho (últimos 90 dias)
${meetingsContext}

Retorne apenas o JSON, sem nenhum texto adicional.`

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001', // rápido e barato para análise automatizada
      max_tokens: 300,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    }),
  })

  if (!response.ok) {
    const err = await response.text()
    throw new Error(`Anthropic API error: ${err}`)
  }

  const data = await response.json()
  const text = data.content?.[0]?.text ?? ''

  try {
    const parsed = JSON.parse(text.trim())
    if (!['healthy', 'attention', 'critical'].includes(parsed.status)) {
      throw new Error('status inválido retornado pela IA')
    }
    return parsed as AnalysisResult
  } catch {
    throw new Error(`JSON inválido retornado pela IA: ${text}`)
  }
}
