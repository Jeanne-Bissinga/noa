-- Les quatre moments de l'intégration deviennent des entretiens.
--
-- Le suivi passait par des questionnaires envoyés à la personne recrutée :
-- quatre points hebdomadaires puis trois bilans, chacun par un lien public.
-- Il passe désormais par quatre entretiens entre le manager et elle — J1, J30,
-- J60, J90 — menés avec le même outillage que les entretiens de recrutement :
-- guide de questions, enregistrement, transcription, notes, synthèse.
--
-- Aucun second moteur n'est construit : ces entretiens sont des lignes de la
-- table `interviews`, qui porte déjà tout cela.
--
-- Run this once in Supabase Dashboard -> SQL Editor -> New query -> Run,
-- sur CHAQUE projet : la prod ET le projet de test.

-- ─── 0. Contrôles à lancer AVANT, un par un ────────────────────────────────
-- Cette migration est rejouable : un échec partiel n'empêche pas de la
-- relancer. Ces requêtes disent où en est votre base.
--
-- a) Les quatre types sont-ils acceptés par la contrainte ?
--    select conname, pg_get_constraintdef(oid) as definition
--    from pg_constraint
--    where conrelid = 'public.interviews'::regclass and contype = 'c';
--    → attendu avant : un CHECK limité à ('screening','topgrading')
--
-- b) Les deux nouvelles tables existent-elles ?
--    select to_regclass('public.onboarding_actions')                as actions,
--           to_regclass('public.onboarding_interview_conclusions')  as conclusions;
--    → attendu avant : null, null
--
-- c) Les entretiens d'intégration ont-ils été créés ?
--    select type, count(*) from interviews group by type order by type;
--    → attendu avant : screening et topgrading uniquement
--
-- d) Les tables de questionnaires sont-elles encore là ?
--    select to_regclass('public.onboarding_check_ins')    as check_ins,
--           to_regclass('public.onboarding_responses')    as responses,
--           to_regclass('public.onboarding_conclusions')  as conclusions;
--    → attendu avant : les trois non nulles
--
-- e) Définition actuelle des deux vues de reporting :
--    select viewname, definition from pg_views
--    where schemaname = 'reporting'
--      and viewname in ('vw_interviews_summary', 'vw_kpi_stagnant_campaigns');
--
-- f) Aucune vue ne doit dépendre de celles-ci — vérifié, mais à reconfirmer
--    si votre base a divergé :
--    select dependent.relname
--    from pg_depend d
--    join pg_rewrite r on r.oid = d.objid
--    join pg_class dependent on dependent.oid = r.ev_class
--    join pg_class source on source.oid = d.refobjid
--    where source.relname = 'vw_interviews_summary' and dependent.relname <> 'vw_interviews_summary';
--    → attendu : aucune ligne

-- ─── 1. Le moteur d'entretien accueille l'intégration ───────────────────────
-- L'index unique porte sur (candidate_id, type) : quatre types de plus, donc
-- quatre entretiens de plus par personne, sans conflit. Aucune policy RLS ne
-- discrimine sur le type — elles passent toutes par le candidat — il n'y a
-- donc rien à y changer.
-- La contrainte est retrouvée par sa DÉFINITION et non par son nom : un CHECK
-- déclaré en ligne est nommé automatiquement par PostgreSQL, et se fier au nom
-- attendu laisserait passer le cas le plus dangereux — une contrainte
-- autrement nommée qui survivrait et continuerait de rejeter les nouveaux
-- types, sans que rien ne le signale.
--
-- Rejouable : au second passage, la boucle retrouve la contrainte élargie
-- (elle mentionne aussi « screening »), la supprime et la recrée à l'identique.
do $$
declare
  c record;
begin
  for c in
    select conname
    from pg_constraint
    where conrelid = 'public.interviews'::regclass
      and contype = 'c'
      and pg_get_constraintdef(oid) like '%screening%'
  loop
    execute format('alter table interviews drop constraint %I', c.conname);
  end loop;
end $$;

alter table interviews add constraint interviews_type_check check (type in (
  'screening',
  'topgrading',
  'integration_j1',
  'integration_j30',
  'integration_j60',
  'integration_j90'
));

-- `scheduled_at` existait sans jamais être écrite. Elle porte désormais la date
-- de chaque entretien d'intégration, calculée depuis la date d'arrivée.
create index if not exists interviews_scheduled_at_idx
  on interviews(scheduled_at)
  where scheduled_at is not null;

-- ─── 2. Les actions décidées pendant un entretien ───────────────────────────
-- Troisième niveau d'objectif, distinct des deux autres : un outcome J90 vient
-- de la Scorecard, un jalon J30/J60 est une étape vers lui (tous deux dans
-- onboarding_goals), une action est un engagement concret pris pendant un
-- entretien. Les mélanger dans une même liste rendrait les trois illisibles.
create table if not exists onboarding_actions (
  id uuid primary key default gen_random_uuid(),
  onboarding_id uuid not null references onboardings(id) on delete cascade,

  -- Entretien qui a décidé cette action. set null plutôt que cascade : perdre
  -- l'entretien ne doit pas effacer l'engagement qui en est sorti.
  source_interview_id uuid references interviews(id) on delete set null,

  label text not null,
  due_date date,
  -- Texte libre : le porteur peut être le manager, la recrue, ou un tiers qui
  -- n'a pas de compte Noa. Une clé étrangère vers recruiters exclurait les deux
  -- derniers cas.
  owner text,

  status text not null default 'todo' check (status in ('todo', 'done', 'cancelled')),

  position int not null default 0,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create index if not exists onboarding_actions_onboarding_id_idx on onboarding_actions(onboarding_id);
create index if not exists onboarding_actions_source_interview_idx on onboarding_actions(source_interview_id);

-- ─── 3. La conclusion du manager sur un entretien ───────────────────────────
-- Remplace onboarding_conclusions, qui pendait à un point de suivi. Trois
-- issues et une note, volontairement. Aucune ne porte sur la poursuite du
-- contrat : Noa réunit les faits, la décision RH reste hors de l'outil.
create table if not exists onboarding_interview_conclusions (
  id uuid primary key default gen_random_uuid(),
  interview_id uuid not null unique references interviews(id) on delete cascade,
  conclusion text not null check (conclusion in ('conforme', 'ajustements', 'attention')),
  note text,
  decided_by uuid references recruiters(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ─── 4. Row Level Security ──────────────────────────────────────────────────
-- Même modèle que le reste : tout est rattaché à l'entreprise du recruteur.
alter table onboarding_actions enable row level security;
alter table onboarding_interview_conclusions enable row level security;

drop policy if exists "onboarding scoped all" on onboarding_actions;
create policy "onboarding scoped all" on onboarding_actions
  for all using (
    exists (select 1 from onboardings o where o.id = onboarding_actions.onboarding_id and o.company_id = current_company_id())
  ) with check (
    exists (select 1 from onboardings o where o.id = onboarding_actions.onboarding_id and o.company_id = current_company_id())
  );

drop policy if exists "interview scoped all" on onboarding_interview_conclusions;
create policy "interview scoped all" on onboarding_interview_conclusions
  for all using (
    exists (
      select 1 from interviews i
      join candidates c on c.id = i.candidate_id
      where i.id = onboarding_interview_conclusions.interview_id and c.company_id = current_company_id()
    )
  ) with check (
    exists (
      select 1 from interviews i
      join candidates c on c.id = i.candidate_id
      where i.id = onboarding_interview_conclusions.interview_id and c.company_id = current_company_id()
    )
  );

-- ─── 5. Les intégrations en cours reçoivent leurs quatre entretiens ─────────
-- Sans ce rattrapage, une intégration déjà active resterait sans entretien et
-- s'afficherait à tort comme n'ayant rien à faire. Les dates suivent la date
-- d'arrivée ; une intégration sans date n'est pas traitée, son calendrier
-- naîtra quand le manager la fixera.
insert into interviews (candidate_id, type, scheduled_at)
select o.candidate_id, t.type, (o.start_date + t.offset_days)::timestamptz
from onboardings o
cross join (values
  ('integration_j1', 0),
  ('integration_j30', 30),
  ('integration_j60', 60),
  ('integration_j90', 90)
) as t(type, offset_days)
where o.start_date is not null
  and o.status <> 'brouillon'
on conflict do nothing;

-- ─── 6. Les indicateurs de recrutement ignorent l'intégration ───────────────
-- Ces vues comptaient TOUS les entretiens sans filtre : sans cette correction,
-- le délai moyen de recrutement inclurait les entretiens d'intégration, qui
-- s'étalent sur 90 jours.
--
-- IMPORTANT : la liste des colonnes est reprise à l'identique de
-- scripts/005_metabase_reporting_views.sql — mêmes noms, mêmes types, même
-- ordre. `create or replace view` n'autorise QUE l'ajout de colonnes en fin de
-- liste : en retirer ou en renommer une échoue avec « cannot drop columns from
-- view ». Seules les LIGNES changent ici, jamais le schéma, ce qui évite d'avoir
-- à supprimer et recréer la vue.
create or replace view reporting.vw_interviews_summary as
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
left join missions m on m.id = c.mission_id
where i.type in ('screening', 'topgrading');

-- Même raison pour la KPI des campagnes stagnantes : un entretien
-- d'intégration ne fait pas avancer une campagne de recrutement, et le compter
-- comme activité rendrait « active » une campagne à l'arrêt. Ici encore, la
-- liste des colonnes de scripts/006_kpi_views.sql est reprise mot pour mot,
-- seule la condition de jointure est ajoutée.
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
  left join interviews i on i.candidate_id = c.id and i.type in ('screening', 'topgrading')
  group by m.id, m.updated_at
)
select
  count(*) filter (where last_activity < now() - interval '3 weeks') as missions_stagnantes,
  count(*) as missions_ouvertes,
  round(100.0 * count(*) filter (where last_activity < now() - interval '3 weeks')
    / nullif(count(*), 0), 1) as taux_stagnation_pct
from activity;

-- ─── 7. Fin des questionnaires ──────────────────────────────────────────────
-- Vérifié avant suppression : aucune réponse n'a jamais été enregistrée, et
-- tous les points de suivi étaient restés à l'état « planifié ». Rien de réel
-- n'est perdu.
--
-- Le contrôle est fait ici plutôt qu'en commentaire : si une réponse existait
-- malgré tout, la suppression s'interrompt et la transaction est annulée. Mieux
-- vaut une migration qui refuse de s'exécuter qu'une donnée perdue en silence.
do $$
declare
  answered int;
begin
  if to_regclass('public.onboarding_responses') is not null then
    execute 'select count(*) from onboarding_responses' into answered;
    if answered > 0 then
      raise exception
        'onboarding_responses contient % ligne(s) : suppression interrompue. Vérifiez ces réponses avant de relancer.',
        answered;
    end if;
  end if;
end $$;

-- Aucune vue ne dépend de ces trois tables : seules leurs propres policies RLS
-- les référencent, et elles tombent avec le cascade. Vérifié avant écriture.
drop table if exists onboarding_responses cascade;
drop table if exists onboarding_conclusions cascade;
drop table if exists onboarding_check_ins cascade;

-- Dénormalisait le prochain point de suivi. Les entretiens portent leur propre
-- date, il n'y a plus rien à dénormaliser.
drop index if exists onboardings_next_check_in_idx;
alter table onboardings drop column if exists next_check_in_at;

-- ─── Retour arrière ─────────────────────────────────────────────────────────
-- Les questionnaires ne sont pas restaurables : leurs tables sont supprimées.
-- Le reste se défait ainsi :
--
-- drop table if exists onboarding_interview_conclusions, onboarding_actions cascade;
-- delete from interviews where type like 'integration_%';
-- alter table interviews drop constraint interviews_type_check;
-- alter table interviews add constraint interviews_type_check check (type in ('screening', 'topgrading'));
