-- ============================================================
-- MIGRATION: adicionar campos de saúde com IA
-- Rode no SQL Editor do Supabase APÓS o schema.sql inicial
-- ============================================================

-- 1. Novos campos na tabela startups
alter table startups
  add column if not exists health_justification text,
  add column if not exists health_updated_at timestamptz;

-- 2. Permitir que a Edge Function (service role) atualize via webhook
-- (já coberto pelo service role key — nenhuma policy extra necessária)

-- ============================================================
-- WEBHOOK: configurar no painel do Supabase
-- Database → Webhooks → Create a new hook
--
-- Name:        on-metrics-insert
-- Table:       metrics
-- Events:      INSERT, UPDATE
-- Type:        Supabase Edge Functions
-- Function:    analyze-startup-health
-- ============================================================
