import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input, Label, Textarea } from '@/components/ui/index'
import { TrendingUp, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react'

interface StartupInfo {
  id: string
  name: string
  sector: string
}

export default function MonthlyForm() {
  const { startupId } = useParams<{ startupId: string }>()
  const [startup, setStartup] = useState<StartupInfo | null>(null)
  const [loadingStartup, setLoadingStartup] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const now = new Date()
  const currentMonth = now.getMonth() + 1
  const currentYear = now.getFullYear()
  const monthName = now.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })

  const [form, setForm] = useState({
    revenue: '',
    cashBalance: '',
    ebitdaOrBurn: '',
    headcount: '',
    highlights: '',
    nextSteps: '',
  })

  useEffect(() => {
    async function fetchStartup() {
      if (!startupId) return
      const { data, error } = await supabase
        .from('startups')
        .select('id, name, sector')
        .eq('id', startupId)
        .single()

      if (error || !data) {
        setNotFound(true)
      } else {
        setStartup(data as StartupInfo)
      }
      setLoadingStartup(false)
    }
    fetchStartup()
  }, [startupId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error } = await supabase.from('metrics').upsert({
      startup_id: startupId,
      month: currentMonth,
      year: currentYear,
      revenue: parseFloat(form.revenue) || 0,
      cash_balance: parseFloat(form.cashBalance) || 0,
      ebitda_or_burn: parseFloat(form.ebitdaOrBurn) || 0,
      headcount: parseInt(form.headcount) || 0,
      highlights: form.highlights,
      next_steps: form.nextSteps,
    }, { onConflict: 'startup_id,month,year' })

    if (error) {
      setError('Erro ao enviar. Tente novamente.')
    } else {
      setSubmitted(true)
    }
    setLoading(false)
  }

  if (loadingStartup) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (notFound) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <AlertCircle className="h-10 w-10 text-destructive mx-auto mb-3" />
          <h2 className="font-display font-bold text-lg">Link inválido</h2>
          <p className="text-sm text-muted-foreground mt-1">Este link de formulário não existe.</p>
        </div>
      </div>
    )
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-background">
        <div className="text-center max-w-sm">
          <div className="rounded-full bg-[hsl(var(--status-healthy))]/10 p-4 w-fit mx-auto mb-4">
            <CheckCircle2 className="h-8 w-8 text-[hsl(var(--status-healthy))]" />
          </div>
          <h2 className="font-display font-bold text-xl mb-2">Enviado com sucesso!</h2>
          <p className="text-sm text-muted-foreground">
            Obrigado, <strong>{startup?.name}</strong>! Seus dados de <strong>{monthName}</strong> foram registrados.
          </p>
          <p className="text-xs text-muted-foreground mt-3">
            Você pode fechar esta aba.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background py-10 px-4">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="flex items-center gap-2.5 mb-8">
          <div className="rounded-lg bg-primary/10 p-1.5">
            <TrendingUp className="h-4 w-4 text-primary" />
          </div>
          <span className="font-display font-bold text-sm tracking-tight">Portfolio VC</span>
        </div>

        <div className="mb-6">
          <h1 className="font-display font-bold text-2xl tracking-tight">Report Mensal</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {startup?.name} · <span className="capitalize">{monthName}</span>
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Financeiros */}
          <div className="bg-card border rounded-xl p-5 space-y-4">
            <h2 className="font-display font-semibold text-sm text-muted-foreground uppercase tracking-wider">Indicadores Financeiros</h2>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="revenue">Receita do mês (R$) *</Label>
                <Input
                  id="revenue"
                  type="number"
                  placeholder="0,00"
                  value={form.revenue}
                  onChange={e => setForm(f => ({ ...f, revenue: e.target.value }))}
                  required
                  min="0"
                  step="0.01"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="cash">Saldo em caixa (R$) *</Label>
                <Input
                  id="cash"
                  type="number"
                  placeholder="0,00"
                  value={form.cashBalance}
                  onChange={e => setForm(f => ({ ...f, cashBalance: e.target.value }))}
                  required
                  min="0"
                  step="0.01"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="burn">Burn / EBITDA (R$) *</Label>
                <Input
                  id="burn"
                  type="number"
                  placeholder="0,00 (negativo = burn)"
                  value={form.ebitdaOrBurn}
                  onChange={e => setForm(f => ({ ...f, ebitdaOrBurn: e.target.value }))}
                  required
                  step="0.01"
                />
                <p className="text-[10px] text-muted-foreground">Negativo para burn, positivo para EBITDA</p>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="headcount">Headcount *</Label>
                <Input
                  id="headcount"
                  type="number"
                  placeholder="Nº de pessoas"
                  value={form.headcount}
                  onChange={e => setForm(f => ({ ...f, headcount: e.target.value }))}
                  required
                  min="0"
                />
              </div>
            </div>
          </div>

          {/* Qualitativo */}
          <div className="bg-card border rounded-xl p-5 space-y-4">
            <h2 className="font-display font-semibold text-sm text-muted-foreground uppercase tracking-wider">Comentários</h2>

            <div className="space-y-1.5">
              <Label htmlFor="highlights">Destaques do mês</Label>
              <Textarea
                id="highlights"
                placeholder="Principais conquistas, marcos atingidos, resultados relevantes..."
                value={form.highlights}
                onChange={e => setForm(f => ({ ...f, highlights: e.target.value }))}
                className="min-h-[90px]"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="nextSteps">Próximos passos e necessidades</Label>
              <Textarea
                id="nextSteps"
                placeholder="Planos para o próximo mês, desafios, apoio necessário do fundo..."
                value={form.nextSteps}
                onChange={e => setForm(f => ({ ...f, nextSteps: e.target.value }))}
                className="min-h-[90px]"
              />
            </div>
          </div>

          {error && (
            <p className="text-xs text-destructive bg-destructive/10 px-3 py-2 rounded-md">{error}</p>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Enviando...</>
            ) : (
              'Enviar Report'
            )}
          </Button>
        </form>
      </div>
    </div>
  )
}
