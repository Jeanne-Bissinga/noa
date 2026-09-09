-- Préférences de travail du collaborateur recruté.
--
-- Une fois le plan d'intégration validé, le manager invite la personne à
-- renseigner ses préférences de travail par un lien public : soit en déclarant
-- le résultat d'un test déjà passé ailleurs (DISC, MBTI, Big Five), soit en
-- répondant au questionnaire Noa (24 questions, 6 préférences). Noa ne fait
-- passer aucun test psychométrique : le questionnaire mesure des préférences
-- de travail, pas une personnalité.
--
-- Ces préférences ne modifient aucun objectif ni aucun critère : elles ne
-- servent qu'à contextualiser l'aide des questions de suivi et les suggestions
-- faites au manager. Les réponses réelles aux points de suivi priment toujours.
--
-- ─── Pourquoi une table et non des colonnes sur onboardings ─────────────────
-- Trois tests déclarés possibles, un questionnaire, et une invitation qui a
-- son propre cycle de vie (lien, expiration, reprise) : tout cela sur
-- onboardings ferait une table à vingt colonnes nullables. Une table 1-1, un
-- résultat structuré en jsonb validé côté serveur, et « pas de ligne » qui
-- vaut « non invité ». Ajouter un test = ajouter une valeur à assessment_type
-- et un validateur, pas une migration.
--
-- Les colonnes disc_primary / disc_secondary / disc_source / disc_assessed_at
-- de onboardings sont conservées en LECTURE SEULE : elles restent le repli
-- pour les intégrations créées avant cette migration. Rien ne les alimente
-- plus.
--
-- Run this once in Supabase Dashboard -> SQL Editor -> New query -> Run,
-- sur CHAQUE projet : la prod ET le projet de test.

create table if not exists onboarding_work_preferences (
  id uuid primary key default gen_random_uuid(),
  onboarding_id uuid not null unique references onboardings(id) on delete cascade,

  -- 'invited'   : lien émis, en attente du collaborateur.
  -- 'completed' : résultat enregistré (test déclaré ou questionnaire).
  status text not null default 'invited' check (status in ('invited', 'completed')),

  -- Renseignés à la complétion seulement.
  source text check (source in ('declared_test', 'noa_questionnaire')),
  assessment_type text check (assessment_type in ('disc', 'mbti', 'big_five', 'noa_work_preferences')),

  -- Résultat structuré, forme dépendante de assessment_type :
  --   disc      : { "primary": "C", "secondary": "S" | null }
  --   mbti      : { "type": "INFJ" }
  --   big_five  : { "openness": "high", "conscientiousness": "medium", ... }
  --   noa       : { "scores": {...}, "orientations": {...} } (voir questionnaire_scores)
  -- Validé côté serveur avant écriture (lib/noa/onboarding/declared-tests.ts,
  -- lib/noa/onboarding/work-preferences.ts). Jamais interprété côté client.
  structured_result jsonb,

  -- Questionnaire Noa : réponses au fil de l'eau ({ "q1": 3, ... }) pour
  -- permettre une reprise ; scores calculés à la complétion.
  questionnaire_answers jsonb,
  questionnaire_scores jsonb,

  -- Lien public : même mécanisme que onboarding_check_ins (empreinte SHA-256
  -- liée à un purpose, jamais le token brut ; cf. lib/noa/onboarding/tokens.ts).
  token_hash text,
  token_expires_at timestamptz,

  invited_at timestamptz not null default now(),
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- Un résultat complété doit dire d'où il vient.
  constraint onboarding_work_preferences_completed_consistent check (
    status <> 'completed'
    or (source is not null and assessment_type is not null and structured_result is not null and completed_at is not null)
  )
);

create index if not exists onboarding_work_preferences_onboarding_id_idx
  on onboarding_work_preferences(onboarding_id);

create unique index if not exists onboarding_work_preferences_token_hash_idx
  on onboarding_work_preferences(token_hash)
  where token_hash is not null;

-- ─── Row Level Security ─────────────────────────────────────────────────────
-- Même modèle que les autres tables d'intégration. Aucune policy `anon` : la
-- page publique passe par service_role côté serveur, filtrée sur l'empreinte.
alter table onboarding_work_preferences enable row level security;

create policy "onboarding scoped all" on onboarding_work_preferences
  for all using (
    exists (select 1 from onboardings o where o.id = onboarding_work_preferences.onboarding_id and o.company_id = current_company_id())
  ) with check (
    exists (select 1 from onboardings o where o.id = onboarding_work_preferences.onboarding_id and o.company_id = current_company_id())
  );

-- ─── Retour arrière ─────────────────────────────────────────────────────────
-- drop table if exists onboarding_work_preferences cascade;
