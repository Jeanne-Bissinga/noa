-- Table subscriptions : gestion des packs de recrutement vendus par
-- entreprise (quota de candidats inclus, fenêtre de validité). Elle
-- n'existait pas dans le schéma : ajoutée ici uniquement pour porter la KPI 4
-- (taux d'utilisation du pack actif). Aucune UI ne la gère encore côté
-- app - les lignes se créent pour l'instant à la main (Supabase SQL Editor /
-- Table Editor) tant qu'un flux de vente/billing n'existe pas.
--
-- Les vues sont créées dans le schéma `reporting`, jamais dans `public` : tout
-- objet du schéma `public` est exposé publiquement par l'API REST de Supabase,
-- et une vue contourne les policies RLS de ses tables (cf. 008_secure_reporting_views.sql).
--
-- Run this once in Supabase Dashboard -> SQL Editor -> New query -> Run.

create schema if not exists reporting;

create table if not exists subscriptions (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  candidates_included int not null check (candidates_included >= 0),
  -- 'active' : pack en cours. 'expired' : arrivé à expires_at sans renouvellement.
  -- 'replaced' : remplacé par un pack plus récent avant son terme (upsell, changement d'offre).
  status text not null default 'active' check (status in ('active', 'expired', 'replaced')),
  started_at timestamptz not null default now(),
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists subscriptions_company_id_idx on subscriptions(company_id);
create index if not exists subscriptions_status_idx on subscriptions(status);

-- Au plus un pack "active" par entreprise à la fois : évite un chevauchement
-- qui rendrait la KPI 4 ambiguë (quel pack rattacher à un candidat importé ?).
create unique index if not exists subscriptions_one_active_per_company
  on subscriptions(company_id)
  where status = 'active';

alter table subscriptions enable row level security;

create policy "recruiters can read their own company subscriptions" on subscriptions
  for select using (company_id = current_company_id());

-- ─── KPI 4 : taux d'utilisation du pack actif ───────────────────────────────
-- Un candidat est rattaché au pack actif de son entreprise s'il a été créé
-- pendant la fenêtre de validité de ce pack (started_at -> expires_at, ou
-- indéfiniment si expires_at est nul). Seuls les packs 'active' sont retenus.
create or replace view reporting.vw_kpi_pack_utilization as
select
  s.company_id,
  co.name as company_name,
  s.id as subscription_id,
  s.candidates_included,
  s.started_at,
  s.expires_at,
  count(c.id) as candidats_consommes,
  round(100.0 * count(c.id)
    / nullif(s.candidates_included, 0), 1) as taux_utilisation_pct
from subscriptions s
join companies co on co.id = s.company_id
left join candidates c
  on c.company_id = s.company_id
  and c.created_at >= s.started_at
  and c.created_at < coalesce(s.expires_at, now())
where s.status = 'active'
group by s.company_id, co.name, s.id, s.candidates_included, s.started_at, s.expires_at;
