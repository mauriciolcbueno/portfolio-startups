-- ============================================
-- SCHEMA COMPLETO - Portfolio VC
-- Rode no SQL Editor do Supabase
-- ============================================

-- Tabela de startups
create table if not exists startups (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  name text not null,
  sector text not null default '',
  status text not null default 'healthy' check (status in ('healthy','attention','critical')),
  logo_url text,
  contact_email text not null default '',
  equity_percentage numeric default 0,
  investment_thesis text default '',
  created_at timestamptz not null default now()
);

-- Tabela de métricas mensais
create table if not exists metrics (
  id uuid primary key default gen_random_uuid(),
  startup_id uuid references startups(id) on delete cascade not null,
  month int not null check (month between 1 and 12),
  year int not null,
  revenue numeric not null default 0,
  cash_balance numeric not null default 0,
  ebitda_or_burn numeric not null default 0,
  headcount int not null default 0,
  highlights text,
  next_steps text,
  created_at timestamptz not null default now(),
  unique (startup_id, month, year)
);

-- Tabela de reuniões
create table if not exists meetings (
  id uuid primary key default gen_random_uuid(),
  startup_id uuid references startups(id) on delete cascade not null,
  date date not null,
  notes text,
  created_at timestamptz not null default now()
);

-- ============================================
-- Row Level Security
-- ============================================
alter table startups enable row level security;
alter table metrics enable row level security;
alter table meetings enable row level security;

-- Startups: VC só vê as suas
create policy "vc_own_startups" on startups
  for all using (auth.uid() = user_id);

-- Metrics: acesso pelo VC (via startup) e acesso público por startup_id (para o forms)
create policy "vc_own_metrics" on metrics
  for select using (
    startup_id in (select id from startups where user_id = auth.uid())
  );

create policy "vc_insert_metrics" on metrics
  for insert with check (
    startup_id in (select id from startups where user_id = auth.uid())
  );

create policy "vc_update_metrics" on metrics
  for update using (
    startup_id in (select id from startups where user_id = auth.uid())
  );

create policy "vc_delete_metrics" on metrics
  for delete using (
    startup_id in (select id from startups where user_id = auth.uid())
  );

-- Permite que startups enviem métricas via forms (sem autenticação)
create policy "public_upsert_metrics" on metrics
  for insert with check (true);

create policy "public_update_metrics" on metrics
  for update using (true);

-- Permite que startups vejam as próprias info via forms
create policy "public_read_startups" on startups
  for select using (true);

-- Meetings: só o VC
create policy "vc_own_meetings" on meetings
  for all using (
    startup_id in (select id from startups where user_id = auth.uid())
  );
