-- Intégration 30-60-90 : prolonge le parcours après l'embauche.
--
-- Le produit s'arrêtait à la décision de recrutement. Ces tables portent la
-- suite : plan d'intégration généré depuis la campagne, points de suivi
-- répondus par le collaborateur sans compte Noa, bilans J30/J60/J90.
--
-- Rien n'est dupliqué de la campagne quand une référence suffit :
-- onboarding_goals.mission_objective_id pointe vers l'objectif de la
-- Scorecard, et la mission du poste est relue depuis missions.mission_text.
-- Seuls les champs que le manager peut réécrire pour l'intégration sont
-- stockés ici (un objectif de recrutement peut être reformulé en objectif
-- d'intégration sans modifier la campagne, qui reste l'archive du besoin).
--
-- Run this once in Supabase Dashboard -> SQL Editor -> New query -> Run,
-- sur CHAQUE projet : la prod ET le projet de test.

-- ─── onboardings ────────────────────────────────────────────────────────────
-- Un candidat recruté a au plus une intégration : la contrainte unique évite
-- qu'un double clic sur « Préparer l'intégration » en crée deux.
--
-- company_id est dénormalisé depuis candidates pour que la RLS n'ait pas à
-- traverser une jointure à chaque ligne (même choix que candidates, qui porte
-- company_id en plus de mission_id).
create table if not exists onboardings (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  candidate_id uuid not null unique references candidates(id) on delete cascade,
  mission_id uuid references missions(id) on delete set null,
  manager_id uuid references recruiters(id) on delete set null,

  -- 'brouillon' : plan proposé par Noa, pas encore validé par le manager.
  -- 'actif'     : plan validé, les points de suivi courent.
  -- 'termine'   : bilan J90 conclu.
  status text not null default 'brouillon' check (status in ('brouillon', 'actif', 'termine')),

  -- Date de prise de poste : origine de tout le calendrier (S1..S4, J30/60/90).
  start_date date not null default current_date,

  -- Mission du poste telle qu'affichée au collaborateur. Préremplie depuis
  -- missions.mission_text, modifiable sans toucher à la campagne.
  mission_text text,

  -- ─── Profil comportemental ────────────────────────────────────────────────
  -- Volontairement agnostique du fournisseur : Noa ne fait passer aucun test.
  -- disc_source dit d'où vient le résultat ('manuel' = saisi par le manager
  -- depuis un test externe). Ajouter un prestataire = ajouter une valeur ici,
  -- pas réécrire le système.
  disc_primary text check (disc_primary in ('D', 'I', 'S', 'C')),
  disc_secondary text check (disc_secondary in ('D', 'I', 'S', 'C')),
  disc_source text check (disc_source in ('manuel', 'externe')),
  disc_assessed_at date,

  -- Prochain point de suivi dû. Dénormalisé depuis onboarding_check_ins pour
  -- qu'un futur job d'envoi puisse balayer les intégrations sans agréger les
  -- check-ins (cf. lib/noa/onboarding/schedule.ts).
  next_check_in_at timestamptz,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists onboardings_company_id_idx on onboardings(company_id);
create index if not exists onboardings_candidate_id_idx on onboardings(candidate_id);
create index if not exists onboardings_next_check_in_idx on onboardings(next_check_in_at)
  where status = 'actif';

-- ─── onboarding_goals ───────────────────────────────────────────────────────
-- Porte à la fois les priorités J1-J30 et les résultats attendus à J60/J90 :
-- c'est la même nature d'objet (un but, une phase, un état d'avancement), les
-- séparer en deux tables n'apporterait que de la duplication.
create table if not exists onboarding_goals (
  id uuid primary key default gen_random_uuid(),
  onboarding_id uuid not null references onboardings(id) on delete cascade,

  -- Lien vers l'objectif de la Scorecard dont ce but est issu, quand il y en a
  -- un. Null pour les priorités J1-J30, que la campagne ne définit pas.
  -- on delete set null : supprimer un objectif de campagne ne doit pas faire
  -- disparaître le suivi d'intégration qui en découlait.
  mission_objective_id uuid references mission_objectives(id) on delete set null,

  phase text not null check (phase in ('j30', 'j60', 'j90')),
  label text not null,

  -- Comment le résultat se mesure. 'numeric' : target_value/current_value font
  -- foi et la progression est calculée. 'qualitative' : seul status compte.
  kind text not null default 'qualitative' check (kind in ('numeric', 'qualitative')),
  metric text,
  target_value numeric,
  current_value numeric,

  status text not null default 'non_commence'
    check (status in ('non_commence', 'en_cours', 'atteint', 'bloque')),

  position int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists onboarding_goals_onboarding_id_idx on onboarding_goals(onboarding_id);

-- ─── onboarding_check_ins ───────────────────────────────────────────────────
-- Un point de suivi = un questionnaire adressé au collaborateur par lien.
--
-- Le token est la seule chose qui autorise l'accès à la page publique : il est
-- aléatoire (32 octets), à usage unique de fait (status passe à 'repondu') et
-- expire. Il est stocké en clair et non haché, pour que le manager puisse
-- récupérer le lien depuis Noa (indispensable tant qu'aucun envoi automatique
-- n'existe) ; la table est protégée par RLS et la page publique n'y accède
-- que côté serveur (cf. lib/noa/onboarding/tokens.ts).
create table if not exists onboarding_check_ins (
  id uuid primary key default gen_random_uuid(),
  onboarding_id uuid not null references onboardings(id) on delete cascade,

  type text not null check (type in ('weekly', 'j30', 'j60', 'j90')),
  -- 1..4 pour les points hebdomadaires, null pour les bilans.
  week_number int check (week_number between 1 and 4),

  scheduled_at timestamptz not null,
  completed_at timestamptz,

  token text not null unique,
  token_expires_at timestamptz not null,

  -- 'planifie' : à venir. 'envoye' : lien remis au collaborateur.
  -- 'repondu' : réponses enregistrées. 'expire' : passé sans réponse.
  status text not null default 'planifie'
    check (status in ('planifie', 'envoye', 'repondu', 'expire')),

  created_at timestamptz not null default now()
);

create index if not exists onboarding_check_ins_onboarding_id_idx on onboarding_check_ins(onboarding_id);
create index if not exists onboarding_check_ins_token_idx on onboarding_check_ins(token);

-- Un seul point de suivi par type/semaine : rejouer la création du plan ne
-- doit pas empiler des questionnaires en double.
create unique index if not exists onboarding_check_ins_slot_unique
  on onboarding_check_ins(onboarding_id, type, coalesce(week_number, 0));

-- ─── onboarding_responses ───────────────────────────────────────────────────
-- Une ligne par question répondue. dimension est recopiée depuis la question
-- pour que les synthèses et les règles d'alerte n'aient pas à rejoindre la
-- bibliothèque TypeScript : quelle que soit la formulation servie au
-- collaborateur (adaptée à son profil DISC), c'est la même dimension qui est
-- alimentée.
create table if not exists onboarding_responses (
  id uuid primary key default gen_random_uuid(),
  check_in_id uuid not null references onboarding_check_ins(id) on delete cascade,

  question_id text not null,
  dimension text not null check (dimension in ('clarity', 'autonomy', 'support', 'blocker', 'results')),

  numeric_value int check (numeric_value between 1 and 5),
  text_value text,

  created_at timestamptz not null default now()
);

create index if not exists onboarding_responses_check_in_id_idx on onboarding_responses(check_in_id);
create unique index if not exists onboarding_responses_question_unique
  on onboarding_responses(check_in_id, question_id);

-- ─── onboarding_conclusions ─────────────────────────────────────────────────
-- Ce que le manager retient d'un bilan. Volontairement minimal : trois issues
-- et une note libre. Aucune de ces valeurs ne parle de la poursuite du
-- contrat — Noa fournit des faits, la décision reste hors de l'outil.
create table if not exists onboarding_conclusions (
  id uuid primary key default gen_random_uuid(),
  check_in_id uuid not null unique references onboarding_check_ins(id) on delete cascade,

  conclusion text not null check (conclusion in ('conforme', 'ajustements', 'attention')),
  note text,
  decided_by uuid references recruiters(id) on delete set null,
  created_at timestamptz not null default now()
);

-- ─── Row Level Security ─────────────────────────────────────────────────────
-- Même modèle que le reste du schéma : tout est rattaché à l'entreprise du
-- recruteur connecté. Aucune policy pour `anon` : la page publique du
-- collaborateur ne lit jamais ces tables avec la clé anonyme, elle passe par
-- une vérification de token côté serveur (service_role).
alter table onboardings enable row level security;
alter table onboarding_goals enable row level security;
alter table onboarding_check_ins enable row level security;
alter table onboarding_responses enable row level security;
alter table onboarding_conclusions enable row level security;

create policy "company scoped all" on onboardings
  for all using (company_id = current_company_id())
  with check (company_id = current_company_id());

create policy "onboarding scoped all" on onboarding_goals
  for all using (
    exists (select 1 from onboardings o where o.id = onboarding_goals.onboarding_id and o.company_id = current_company_id())
  ) with check (
    exists (select 1 from onboardings o where o.id = onboarding_goals.onboarding_id and o.company_id = current_company_id())
  );

create policy "onboarding scoped all" on onboarding_check_ins
  for all using (
    exists (select 1 from onboardings o where o.id = onboarding_check_ins.onboarding_id and o.company_id = current_company_id())
  ) with check (
    exists (select 1 from onboardings o where o.id = onboarding_check_ins.onboarding_id and o.company_id = current_company_id())
  );

create policy "check-in scoped all" on onboarding_responses
  for all using (
    exists (
      select 1 from onboarding_check_ins ci
      join onboardings o on o.id = ci.onboarding_id
      where ci.id = onboarding_responses.check_in_id and o.company_id = current_company_id()
    )
  ) with check (
    exists (
      select 1 from onboarding_check_ins ci
      join onboardings o on o.id = ci.onboarding_id
      where ci.id = onboarding_responses.check_in_id and o.company_id = current_company_id()
    )
  );

create policy "check-in scoped all" on onboarding_conclusions
  for all using (
    exists (
      select 1 from onboarding_check_ins ci
      join onboardings o on o.id = ci.onboarding_id
      where ci.id = onboarding_conclusions.check_in_id and o.company_id = current_company_id()
    )
  ) with check (
    exists (
      select 1 from onboarding_check_ins ci
      join onboardings o on o.id = ci.onboarding_id
      where ci.id = onboarding_conclusions.check_in_id and o.company_id = current_company_id()
    )
  );

-- ─── Retour arrière ─────────────────────────────────────────────────────────
-- drop table if exists onboarding_conclusions, onboarding_responses,
--   onboarding_check_ins, onboarding_goals, onboardings cascade;
