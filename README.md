# Portfolio VC

Sistema de gestão de portfólio para fundos de venture capital.

## Stack
- **Frontend**: React + Vite + TypeScript + Tailwind CSS
- **Backend/DB**: Supabase (PostgreSQL + Auth + Edge Functions)
- **E-mail**: Resend
- **Deploy**: Vercel

---

## Passo a Passo para Colocar Online

### 1. Pré-requisitos

- Node.js 18+
- Conta no [Supabase](https://supabase.com) (gratuito)
- Conta no [Vercel](https://vercel.com) (gratuito)
- Conta no [Resend](https://resend.com) (gratuito — 3.000 e-mails/mês)

---

### 2. Instalar dependências locais

```bash
npm install
```

---

### 3. Configurar o Supabase

1. Acesse [supabase.com](https://supabase.com) e crie um projeto
2. Vá em **SQL Editor** e cole o conteúdo de `supabase/schema.sql`
3. Clique em **Run**
4. Vá em **Project Settings → API** e copie:
   - `Project URL`
   - `anon / public` key

---

### 4. Configurar variáveis de ambiente

```bash
cp .env.example .env
```

Edite `.env` com os valores do Supabase:
```
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

---

### 5. Rodar localmente

```bash
npm run dev
```

Acesse `http://localhost:5173`

---

### 6. Deploy na Vercel

```bash
npm install -g vercel
vercel login
vercel --prod
```

Quando solicitado, adicione as variáveis de ambiente (`VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`).

Ou configure pelo painel: **vercel.com → seu projeto → Settings → Environment Variables**

---

### 7. Configurar e-mail automático (dia 10 de cada mês)

#### 7a. Criar conta no Resend
1. Acesse [resend.com](https://resend.com) e crie uma conta
2. Vá em **API Keys** e crie uma nova key
3. Opcionalmente, adicione e verifique seu domínio em **Domains**

#### 7b. Fazer deploy da Edge Function

Instale o Supabase CLI:
```bash
npm install -g supabase
supabase login
supabase link --project-ref SEU_PROJECT_REF
```

Configure os segredos da função:
```bash
supabase secrets set RESEND_API_KEY=re_xxxx
supabase secrets set APP_URL=https://seu-app.vercel.app
supabase secrets set CRON_SECRET=uma-senha-aleatoria-segura
```

Edite o arquivo `supabase/functions/send-monthly-forms/index.ts` e troque o e-mail remetente:
```
from: 'Portfolio VC <no-reply@seudominio.com>'
```

Faça deploy da função:
```bash
supabase functions deploy send-monthly-forms
```

#### 7c. Ativar pg_cron e agendar o disparo

No **Supabase SQL Editor**, rode:

```sql
-- 1. Habilitar extensão pg_cron (só precisa fazer uma vez)
-- Vá em Database → Extensions → procure "pg_cron" → Enable

-- 2. Agendar disparo no dia 10 às 9h UTC (6h horário de Brasília)
select cron.schedule(
  'send-monthly-forms',
  '0 9 10 * *',
  $$
    select net.http_post(
      url := 'https://SEU_PROJECT_REF.supabase.co/functions/v1/send-monthly-forms',
      headers := '{"Content-Type":"application/json","Authorization":"Bearer SUA_CRON_SECRET"}'::jsonb,
      body := '{}'::jsonb
    ) as request_id;
  $$
);
```

Substitua:
- `SEU_PROJECT_REF` → ref do seu projeto Supabase
- `SUA_CRON_SECRET` → o mesmo valor que você colocou em `CRON_SECRET`

#### 7d. Testar o envio manualmente

```bash
curl -X POST https://SEU_PROJECT_REF.supabase.co/functions/v1/send-monthly-forms \
  -H "Authorization: Bearer SUA_CRON_SECRET" \
  -H "Content-Type: application/json"
```

---

## Como usar o sistema

1. **Criar conta**: acesse seu app e clique em "Cadastre-se"
2. **Adicionar startup**: clique em "Nova Startup" e preencha com nome, setor, status e **e-mail de contato**
3. **Link do forms**: na página de cada startup, há um link único para o forms mensal
4. **Envio automático**: todo dia 10, o sistema envia automaticamente o link por e-mail para cada startup
5. **Registro de reuniões**: na página da startup, clique em "Registrar" para adicionar reuniões de conselho

---

## Estrutura do projeto

```
src/
├── App.tsx                    # Roteamento + auth guard
├── contexts/
│   ├── AuthContext.tsx        # Login/logout/sessão
│   └── DataContext.tsx        # Dados (startups, métricas, reuniões)
├── pages/
│   ├── Login.tsx              # Página de autenticação
│   ├── Dashboard.tsx          # Visão geral do portfólio
│   ├── StartupDetail.tsx      # Detalhe de uma startup
│   └── MonthlyForm.tsx        # Forms público para startups
├── components/
│   ├── Layout.tsx             # Sidebar + estrutura
│   ├── StatusBadge.tsx        # Badge de status
│   ├── StartupFormDialog.tsx  # Modal de criar/editar startup
│   └── ui/                    # Componentes base (Button, Card, etc.)
├── types/index.ts             # Tipos TypeScript
└── lib/
    ├── supabase.ts            # Cliente Supabase
    └── utils.ts               # Funções utilitárias

supabase/
├── schema.sql                 # Schema do banco de dados
└── functions/
    └── send-monthly-forms/
        └── index.ts           # Edge Function de e-mail
```
