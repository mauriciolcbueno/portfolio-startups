// supabase/functions/send-monthly-forms/index.ts
// Disparada automaticamente no dia 10 de cada mês via pg_cron
// Configura: Dashboard → Database → Extensions → pg_cron (habilitar)
// Depois rode o SQL de agendamento abaixo

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const resendApiKey = Deno.env.get('RESEND_API_KEY')!
const appUrl = Deno.env.get('APP_URL')! // ex: https://seu-dominio.vercel.app

const supabase = createClient(supabaseUrl, supabaseServiceKey)

Deno.serve(async (req) => {
  // Segurança: só aceita chamadas internas do Supabase ou com Bearer token
  const authHeader = req.headers.get('Authorization')
  const cronSecret = Deno.env.get('CRON_SECRET')
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return new Response('Unauthorized', { status: 401 })
  }

  const now = new Date()
  const monthName = now.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })

  // Busca todas as startups com e-mail cadastrado
  const { data: startups, error } = await supabase
    .from('startups')
    .select('id, name, contact_email')
    .not('contact_email', 'is', null)
    .neq('contact_email', '')

  if (error || !startups) {
    return new Response(JSON.stringify({ error }), { status: 500 })
  }

  const results = []

  for (const startup of startups) {
    const formUrl = `${appUrl}/forms/${startup.id}`

    const emailBody = {
      from: 'Portfolio VC <no-reply@seudominio.com>', // Troque pelo seu domínio verificado no Resend
      to: [startup.contact_email],
      subject: `📊 Report Mensal – ${monthName}`,
      html: `
        <!DOCTYPE html>
        <html lang="pt-BR">
        <head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /></head>
        <body style="margin:0;padding:0;background:#f5f5f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
          <div style="max-width:560px;margin:40px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,.1);">
            
            <div style="background:#5b21b6;padding:32px 32px 28px;">
              <p style="margin:0;font-size:13px;color:rgba(255,255,255,.7);font-weight:500;text-transform:uppercase;letter-spacing:.08em;">Portfolio VC</p>
              <h1 style="margin:8px 0 0;font-size:22px;font-weight:700;color:#fff;">Report Mensal</h1>
              <p style="margin:6px 0 0;font-size:14px;color:rgba(255,255,255,.8);">
                Olá, <strong>${startup.name}</strong>! Já é hora do report de <strong style="text-transform:capitalize;">${monthName}</strong>.
              </p>
            </div>

            <div style="padding:32px;">
              <p style="margin:0 0 16px;font-size:14px;color:#374151;line-height:1.6;">
                O preenchimento leva menos de 3 minutos e nos ajuda a acompanhar de perto a evolução da sua empresa e a oferecer o melhor suporte possível.
              </p>

              <p style="margin:0 0 8px;font-size:13px;color:#6b7280;font-weight:500;">O forms inclui:</p>
              <ul style="margin:0 0 24px;padding-left:20px;color:#374151;font-size:13px;line-height:2;">
                <li>Receita do mês</li>
                <li>Saldo em caixa</li>
                <li>Burn / EBITDA</li>
                <li>Headcount</li>
                <li>Destaques e próximos passos</li>
              </ul>

              <a href="${formUrl}" style="display:inline-block;background:#5b21b6;color:#fff;text-decoration:none;padding:12px 28px;border-radius:8px;font-size:14px;font-weight:600;">
                Preencher Report →
              </a>

              <p style="margin:24px 0 0;font-size:12px;color:#9ca3af;line-height:1.5;">
                Ou acesse diretamente: <a href="${formUrl}" style="color:#5b21b6;">${formUrl}</a>
              </p>
            </div>

            <div style="padding:20px 32px;border-top:1px solid #f3f4f6;">
              <p style="margin:0;font-size:11px;color:#9ca3af;">
                Este e-mail foi enviado automaticamente pelo sistema de Portfolio VC.
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
    }

    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${resendApiKey}`,
        },
        body: JSON.stringify(emailBody),
      })
      const data = await res.json()
      results.push({ startup: startup.name, email: startup.contact_email, status: res.status, data })
    } catch (err) {
      results.push({ startup: startup.name, error: String(err) })
    }
  }

  return new Response(JSON.stringify({ sent: results.length, results }), {
    headers: { 'Content-Type': 'application/json' },
  })
})

/*
  AGENDAMENTO via pg_cron (rode no SQL Editor do Supabase):

  select cron.schedule(
    'send-monthly-forms',
    '0 9 10 * *',   -- todo dia 10 às 9h UTC (6h BRT)
    $$
      select net.http_post(
        url := current_setting('app.supabase_url') || '/functions/v1/send-monthly-forms',
        headers := '{"Content-Type":"application/json","Authorization":"Bearer SEU_CRON_SECRET"}'::jsonb,
        body := '{}'::jsonb
      ) as request_id;
    $$
  );
*/
