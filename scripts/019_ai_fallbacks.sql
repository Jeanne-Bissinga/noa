-- ─── ai_fallbacks ───────────────────────────────────────────────────────────
-- Compteur des passages en mode dégradé de noa : chaque fois qu'une génération
-- IA échoue et que l'appelant retombe sur son repli statique, une ligne est
-- écrite ici.
--
-- Pourquoi cette table existe. L'incident `maxItems` (a773cfd → 3e557aa) a
-- rendu la génération des compétences inopérante pendant deux mois. Chaque
-- échec écrivait pourtant une ligne `[noa]` dans les journaux du serveur : le
-- problème n'était pas l'absence de trace, c'était l'absence d'AGRÉGATION.
-- Personne ne pouvait répondre à « combien de fois cette semaine ? ».
--
-- Journalisation et monitoring restent deux choses distinctes, et le restent
-- ici : les `console.error` existants ne sont pas remplacés. Ils gardent le
-- détail technique pour diagnostiquer ; cette table ne garde que de quoi
-- compter.
--
-- Run this once in Supabase Dashboard -> SQL Editor -> New query -> Run,
-- sur CHAQUE projet : la prod ET le projet de test.

create table if not exists ai_fallbacks (
  id uuid primary key default gen_random_uuid(),

  -- Identifiant d'opération, volontairement CONTRAINT par énumération : un
  -- compteur ne sert à rien si la même panne s'écrit sous trois libellés. Une
  -- nouvelle opération instrumentée demande donc une migration d'une ligne,
  -- et c'est le prix voulu. La liste est reprise à l'identique dans
  -- AI_FALLBACK_OPERATIONS (lib/noa/ai-fallbacks.ts), et un test unitaire
  -- vérifie que les deux ne divergent pas.
  operation text not null check (operation in (
    'mission_text',
    'objective_suggestions',
    'skill_suggestions',
    'screening_grid',
    'topgrading_grid',
    'topgrading_skill_checks'
  )),

  -- Catégorie de cause, et NON le message d'erreur brut.
  --
  -- Choix délibéré : un message de fournisseur peut contenir un extrait de la
  -- requête, une URL signée ou un identifiant interne. Le stocker en base
  -- reviendrait à recopier des données dont on ne maîtrise pas le contenu, pour
  -- un bénéfice nul côté comptage. Le message complet reste dans les journaux
  -- serveur, où il est utile et éphémère.
  reason text not null check (reason in (
    'empty_response',  -- appel abouti, mais rien d'exploitable en retour
    'bad_request',     -- 400 : schéma refusé, paramètre invalide (le cas `maxItems`)
    'rate_limit',      -- 429
    'auth',            -- 401 / 403 : clé absente, invalide ou sans droit
    'server_error',    -- 5xx, modèle surchargé
    'timeout',         -- délai dépassé côté appelant
    'other'            -- non classé : à regarder dans les journaux
  )),

  -- Utile pour distinguer « un client a un souci » de « tout le monde est
  -- touché ». `set null` et non `cascade` : la suppression d'une entreprise ne
  -- doit pas réécrire l'historique de disponibilité du service.
  company_id uuid references companies(id) on delete set null,

  created_at timestamptz not null default now()
);

-- La vue ci-dessous filtre sur une fenêtre glissante de 7 jours : c'est cet
-- index qui la rend immédiate, et il sert aussi à toute lecture par période.
create index if not exists ai_fallbacks_created_at_idx on ai_fallbacks(created_at desc);
create index if not exists ai_fallbacks_operation_idx on ai_fallbacks(operation);

-- ─── Accès ──────────────────────────────────────────────────────────────────
-- Table de diagnostic interne : aucun écran de noa ne la lit, aucun navigateur
-- n'a de raison d'y toucher.
--
-- RLS activée SANS aucune policy : c'est volontaire et suffisant. Une requête
-- venue du navigateur (clé `anon` ou `authenticated`) ne verra rien et n'écrira
-- rien. Seul le client admin (service_role, cf. lib/supabase/admin.ts) écrit,
-- comme pour skills_signals.
alter table ai_fallbacks enable row level security;

-- Ceinture et bretelles, dans l'esprit de 008_secure_reporting_views.sql : le
-- schéma `public` accorde automatiquement des privilèges à anon et
-- authenticated via ses default privileges. On les retire explicitement plutôt
-- que de compter sur la seule RLS.
revoke all on ai_fallbacks from anon, authenticated;

-- ─── Vue de lecture, hors de portée de l'API REST ───────────────────────────
-- Dans `reporting`, jamais dans `public` (cf. 008_secure_reporting_views.sql).
-- Une vue s'exécutant avec les droits de son créateur, elle lit la table malgré
-- la RLS — c'est ici l'effet voulu, et il est sans risque parce que `reporting`
-- n'est pas un schéma exposé.
create schema if not exists reporting;

-- ─── Replis IA des 7 derniers jours, par opération ──────────────────────────
-- La question à laquelle cette vue répond :
--   « Combien de fois noa est-il passé en mode dégradé cette semaine, et où ? »
--
--   select * from reporting.vw_kpi_ai_fallbacks_7d;
--
-- Les opérations sans aucun repli sur la période apparaissent à 0 plutôt que
-- d'être absentes : une ligne manquante ne se remarque pas, un zéro se lit.
create or replace view reporting.vw_kpi_ai_fallbacks_7d as
with operations(operation) as (
  values
    ('mission_text'),
    ('objective_suggestions'),
    ('skill_suggestions'),
    ('screening_grid'),
    ('topgrading_grid'),
    ('topgrading_skill_checks')
),
recent as (
  select operation, reason, company_id
  from ai_fallbacks
  where created_at >= now() - interval '7 days'
)
select
  o.operation,
  count(r.operation) as fallback_count_7d,
  count(distinct r.company_id) as companies_touchees,
  -- Les causes rencontrées, triées, pour savoir où regarder sans ouvrir les
  -- journaux : 'bad_request' pointe un schéma refusé, 'server_error' le
  -- fournisseur, 'empty_response' le modèle lui-même.
  coalesce(
    (select string_agg(distinct r2.reason, ', ' order by r2.reason)
     from recent r2 where r2.operation = o.operation),
    ''
  ) as causes
from operations o
left join recent r on r.operation = o.operation
group by o.operation
order by fallback_count_7d desc, o.operation;
