-- Vues de reporting pour Metabase (ou tout autre outil BI connecté en lecture
-- seule à la base Postgres derrière Supabase). Rien ici n'est utilisé par
-- l'application elle-même : ce sont des vues dédiées, plus lisibles que les
-- tables brutes pour construire des dashboards (jointures déjà faites, noms
-- lisibles plutôt que des UUID).
--
-- Run this once in Supabase Dashboard -> SQL Editor -> New query -> Run.

-- ─── Vue 1 : une ligne par mission ──────────────────────────────────────────
create or replace view vw_missions_summary as
select
  m.id as mission_id,
  m.company_id,
  co.name as company_name,
  m.title as mission_title,
  m.reason,
  m.status as mission_status,
  m.process_step,
  trim(coalesce(r.first_name, '') || ' ' || coalesce(r.last_name, '')) as created_by_name,
  m.created_at,
  m.updated_at,
  extract(day from now() - m.created_at)::int as days_open,
  (select count(*) from mission_objectives mo where mo.mission_id = m.id) as objectives_count,
  (select count(*) from mission_skills ms where ms.mission_id = m.id) as skills_count,
  (select count(*) from candidates c where c.mission_id = m.id) as candidates_count
from missions m
join companies co on co.id = m.company_id
left join recruiters r on r.id = m.created_by;

-- ─── Vue 2 : une ligne par candidat, avec sa mission ────────────────────────
create or replace view vw_candidates_pipeline as
select
  c.id as candidate_id,
  c.company_id,
  co.name as company_name,
  c.mission_id,
  m.title as mission_title,
  trim(c.first_name || ' ' || c.last_name) as candidate_name,
  c.title as candidate_title,
  c.location,
  c.status as candidate_status,
  c.screening_status,
  c.topgrading_status,
  c.decision_status,
  c.score,
  c.source,
  c.created_at,
  c.updated_at,
  extract(day from now() - c.created_at)::int as days_in_pipeline
from candidates c
join companies co on co.id = c.company_id
left join missions m on m.id = c.mission_id;

-- ─── Vue 3 : effectifs par mission x statut, pour un graphique d'entonnoir ──
create or replace view vw_candidate_funnel as
select
  m.id as mission_id,
  m.company_id,
  m.title as mission_title,
  c.status as candidate_status,
  count(*) as candidate_count
from candidates c
join missions m on m.id = c.mission_id
group by m.id, m.company_id, m.title, c.status;

-- ─── Vue 4 : une ligne par décision (screening / topgrading / final) ────────
create or replace view vw_decisions_detail as
select
  d.id as decision_id,
  c.id as candidate_id,
  c.company_id,
  trim(c.first_name || ' ' || c.last_name) as candidate_name,
  m.id as mission_id,
  m.title as mission_title,
  d.stage,
  d.status as decision_status,
  d.reason,
  trim(coalesce(r.first_name, '') || ' ' || coalesce(r.last_name, '')) as decided_by_name,
  d.decided_at
from decisions d
join candidates c on c.id = d.candidate_id
left join missions m on m.id = c.mission_id
left join recruiters r on r.id = d.decided_by;

-- ─── Vue 5 : une ligne par entretien (screening / topgrading) ───────────────
create or replace view vw_interviews_summary as
select
  i.id as interview_id,
  c.id as candidate_id,
  c.company_id,
  trim(c.first_name || ' ' || c.last_name) as candidate_name,
  m.id as mission_id,
  m.title as mission_title,
  i.type as interview_type,
  i.status as interview_status,
  i.format,
  i.duration_minutes,
  (i.transcript is not null and length(trim(i.transcript)) > 0) as has_transcript,
  i.scheduled_at,
  i.completed_at,
  case when i.completed_at is not null
    then extract(epoch from (i.completed_at - i.created_at)) / 86400
  end as days_to_complete,
  i.created_at
from interviews i
join candidates c on c.id = i.candidate_id
left join missions m on m.id = c.mission_id;

-- ─── Vue 6 : délai jusqu'à la décision finale, pour les candidats clôturés ──
create or replace view vw_time_to_hire as
select
  c.id as candidate_id,
  c.company_id,
  trim(c.first_name || ' ' || c.last_name) as candidate_name,
  m.id as mission_id,
  m.title as mission_title,
  c.created_at as candidate_created_at,
  fd.decided_at as final_decision_at,
  extract(day from fd.decided_at - c.created_at)::int as days_to_decision,
  c.status as final_status
from candidates c
join missions m on m.id = c.mission_id
join lateral (
  select decided_at
  from decisions d
  where d.candidate_id = c.id and d.stage = 'final' and d.status <> 'reporte'
  order by decided_at desc
  limit 1
) fd on true
where c.status in ('Recrute', 'Non retenu');

-- ─── Accès Metabase ──────────────────────────────────────────────────────────
-- Les vues héritent de la RLS des tables sous-jacentes : avec le rôle
-- "authenticated" normal, Metabase ne verrait que les données d'un recruiter
-- connecté (pas pratique pour un dashboard cross-company). Recommandé : un
-- rôle Postgres dédié, en lecture seule, qui contourne la RLS - à activer
-- volontairement (décommenter et exécuter séparément, ce n'est PAS fait par
-- défaut par ce script) :
--
-- create role metabase_reader login password 'change-moi' bypassrls;
-- grant usage on schema public to metabase_reader;
-- grant select on
--   vw_missions_summary, vw_candidates_pipeline, vw_candidate_funnel,
--   vw_decisions_detail, vw_interviews_summary, vw_time_to_hire
-- to metabase_reader;
--
-- Dans Supabase, ce rôle se crée et se gère via Database -> Roles (ou SQL
-- Editor avec les droits superuser du projet). Ne jamais utiliser la clé
-- service_role de l'app pour Metabase : bypassrls sans scope, trop large.
