-- Vues KPI produit, pour Metabase (ou tout outil BI connecté en lecture
-- seule). Chaque vue recalcule sa fenêtre glissante (30 jours / 3 semaines)
-- au moment de la requête : pas de valeur figée, le dashboard reste à jour
-- tout seul. Rien ici n'est utilisé par l'application.
--
-- KPI 4 (taux d'utilisation du pack actif) est volontairement absente : elle
-- suppose une table `subscriptions` (company_id, candidates_included,
-- status, started_at, expires_at) qui n'existe pas dans le schéma actuel
-- (pas de gestion de pack/abonnement dans noa aujourd'hui). À ajouter quand
-- cette table existera - dis-moi si tu veux que je la modélise.
--
-- Les vues sont créées dans le schéma `reporting`, jamais dans `public` : tout
-- objet du schéma `public` est exposé publiquement par l'API REST de Supabase,
-- et une vue contourne les policies RLS de ses tables (cf. 008_secure_reporting_views.sql).
--
-- Run this once in Supabase Dashboard -> SQL Editor -> New query -> Run.

create schema if not exists reporting;

-- ─── KPI 1 : candidats importés (30 derniers jours) ─────────────────────────
create or replace view reporting.vw_kpi_candidates_imported_30d as
select count(*) as candidats_importes
from candidates
where created_at >= now() - interval '30 days';

-- ─── KPI 2 : taux de complétion du parcours de décision (30 derniers jours) ─
-- "Décision atteinte" = decision_status = 'done', c'est-à-dire recruté ou non
-- retenu (cf. STATUS_FIELDS dans lib/noa/labels.ts) : un candidat encore en
-- attente de la décision finale ('current') n'est pas compté comme abouti.
create or replace view reporting.vw_kpi_decision_completion_30d as
with imported as (
  select decision_status from candidates
  where created_at >= now() - interval '30 days'
)
select
  count(*) as candidats_importes,
  count(*) filter (where decision_status = 'done') as decisions_atteintes,
  round(100.0 * count(*) filter (where decision_status = 'done')
    / nullif(count(*), 0), 1) as taux_completion_pct
from imported;

-- ─── KPI 3 : nouveaux comptes créés (30 derniers jours) ─────────────────────
create or replace view reporting.vw_kpi_new_accounts_30d as
select count(*) as nouveaux_comptes
from companies
where created_at >= now() - interval '30 days';

-- ─── KPI 5 : taux de campagnes stagnantes (aucune activité depuis 3 semaines) ─
-- "Activité" = la date la plus récente entre la mise à jour de la mission, la
-- mise à jour d'un candidat rattaché, ou la création d'un entretien. Restreint
-- aux missions ouvertes (brouillon / en_cours) : une mission pourvue ou
-- annulée n'a pas vocation à bouger.
create or replace view reporting.vw_kpi_stagnant_campaigns as
with open_missions as (
  select id, updated_at from missions
  where status in ('brouillon', 'en_cours')
),
activity as (
  select
    m.id,
    greatest(
      m.updated_at,
      coalesce(max(c.updated_at), m.updated_at),
      coalesce(max(i.created_at), m.updated_at)
    ) as last_activity
  from open_missions m
  left join candidates c on c.mission_id = m.id
  left join interviews i on i.candidate_id = c.id
  group by m.id, m.updated_at
)
select
  count(*) filter (where last_activity < now() - interval '3 weeks') as missions_stagnantes,
  count(*) as missions_ouvertes,
  round(100.0 * count(*) filter (where last_activity < now() - interval '3 weeks')
    / nullif(count(*), 0), 1) as taux_stagnation_pct
from activity;
