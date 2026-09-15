-- Les préférences de travail passent de l'intégration au recrutement.
--
-- Elles étaient rattachées à un onboarding, donc collectables seulement APRÈS
-- l'embauche. Elles servent maintenant à préparer l'entretien technique :
-- elles se rattachent au candidat, entre le premier entretien et le second.
--
-- Le nom de la table garde son préfixe « onboarding_ » : le renommer imposerait
-- de rejouer un rename à la main sur chaque projet et casserait tout code écrit
-- contre l'ancien nom, y compris sur une branche en cours. Le préfixe est
-- historique, rien de plus.
--
-- Rien n'est supprimé ici. Les lignes existantes sont rattachées à leur
-- candidat par backfill ; onboarding_id devient simplement facultatif.
--
-- Run this once in Supabase Dashboard -> SQL Editor -> New query -> Run,
-- sur CHAQUE projet : la prod ET le projet de test.

-- ─── Rattachement au candidat ───────────────────────────────────────────────
alter table onboarding_work_preferences
  add column if not exists candidate_id uuid references candidates(id) on delete cascade;

update onboarding_work_preferences wp
   set candidate_id = o.candidate_id
  from onboardings o
 where o.id = wp.onboarding_id
   and wp.candidate_id is null;

-- L'onboarding n'est plus le point d'entrée. La colonne reste pour les lignes
-- historiques ; la contrainte unique qui la porte tolère plusieurs NULL, les
-- NULL étant distincts en PostgreSQL.
--
-- La contrainte `onboarding_work_preferences_completed_consistent` de
-- scripts/012 ne mentionne pas onboarding_id : elle porte sur status, source,
-- assessment_type, structured_result et completed_at. Ce `drop not null` ne
-- l'affecte donc pas, et elle n'a pas à être retouchée.
alter table onboarding_work_preferences
  alter column onboarding_id drop not null;

-- Une ligne doit toujours être rattachée à quelque chose.
alter table onboarding_work_preferences
  drop constraint if exists onboarding_work_preferences_rattachement;
alter table onboarding_work_preferences
  add constraint onboarding_work_preferences_rattachement
  check (candidate_id is not null or onboarding_id is not null);

-- Un seul questionnaire par candidat, comme il n'y en avait qu'un par onboarding.
--
-- Index NON partiel, volontairement. `issueWorkPreferencesLink` fait un
-- upsert `on_conflict=candidate_id` : PostgREST doit pouvoir inférer cet index
-- comme arbitre du conflit, ce qu'il ne sait pas faire sur un index partiel
-- (il n'émet pas la clause WHERE correspondante) — l'upsert échouerait. Les
-- NULL étant distincts en PostgreSQL, les lignes historiques sans candidat ne
-- se gênent pas entre elles, et un index partiel n'apporterait rien.
create unique index if not exists onboarding_work_preferences_candidate_id_idx
  on onboarding_work_preferences(candidate_id);

-- ─── Traçabilité du texte d'information ─────────────────────────────────────
-- Ce n'est PAS un consentement et ces colonnes ne doivent jamais être lues
-- comme tel : elles disent seulement quelle version du texte « Pourquoi ces
-- informations ? » a été affichée au candidat, et quand. Aucun traitement, aucun
-- affichage et aucune décision ne dépend de leur valeur — elles se relisent le
-- jour où quelqu'un demande ce qui lui a été présenté.
alter table onboarding_work_preferences
  add column if not exists notice_version text;
alter table onboarding_work_preferences
  add column if not exists notice_shown_at timestamptz;

-- ─── Briefing d'entretien dérivé ────────────────────────────────────────────
-- Les hypothèses et questions suggérées sont produites au moment de préparer
-- l'entretien technique, puis figées — pas recalculées à chaque affichage. Les
-- figer est ce qui permet à la synthèse de remontrer le signal initial TEL
-- QU'IL A ÉTÉ FORMULÉ AVANT l'entretien, au lieu d'en régénérer un autre après
-- coup, une fois les réponses connues.
--
-- Un seul briefing par candidat, sur la ligne dont il dérive, et non sur
-- interview_guides : savePreparation y fait un upsert de la ligne entière
-- (app/candidats/[id]/actions.ts), qui effacerait la colonne à chaque
-- enregistrement de la préparation. Ici, rien ne l'écrase.
alter table onboarding_work_preferences
  add column if not exists interview_briefing jsonb;
alter table onboarding_work_preferences
  add column if not exists briefing_generated_at timestamptz;

-- ─── Row Level Security ─────────────────────────────────────────────────────
-- La policy existante passe par onboardings ; elle ne couvre plus les lignes
-- créées depuis le recrutement. On ajoute la voie candidat sans retirer
-- l'ancienne : les policies permissives se combinent par OU, donc une ligne
-- rattachée aux deux reste lisible, et une ligne rattachée au seul candidat le
-- devient. Aucune policy `anon` ici non plus — la page publique passe par
-- service_role côté serveur, filtrée sur l'empreinte du token.
drop policy if exists "candidate scoped all" on onboarding_work_preferences;

create policy "candidate scoped all" on onboarding_work_preferences
  for all using (
    exists (
      select 1 from candidates c
       where c.id = onboarding_work_preferences.candidate_id
         and c.company_id = current_company_id()
    )
  ) with check (
    exists (
      select 1 from candidates c
       where c.id = onboarding_work_preferences.candidate_id
         and c.company_id = current_company_id()
    )
  );

-- PostgREST garde le schéma en cache : sans ce rappel, les premières requêtes
-- sur les nouvelles colonnes répondent « Could not find the ... in the schema
-- cache » (PGRST205).
notify pgrst, 'reload schema';

-- ─── Contrôle ───────────────────────────────────────────────────────────────
-- select count(*) filter (where candidate_id is null)  as sans_candidat,
--        count(*) filter (where onboarding_id is null) as sans_onboarding,
--        count(*)                                      as total
--   from onboarding_work_preferences;
--
-- `sans_candidat` doit valoir 0 après cette migration : toute ligne existante
-- vient d'un onboarding, et tout onboarding a un candidat.

-- ─── Retour arrière ─────────────────────────────────────────────────────────
-- drop policy if exists "candidate scoped all" on onboarding_work_preferences;
-- drop index if exists onboarding_work_preferences_candidate_id_idx;
-- alter table onboarding_work_preferences drop constraint if exists onboarding_work_preferences_rattachement;
-- alter table onboarding_work_preferences drop column if exists briefing_generated_at;
-- alter table onboarding_work_preferences drop column if exists interview_briefing;
-- alter table onboarding_work_preferences drop column if exists notice_shown_at;
-- alter table onboarding_work_preferences drop column if exists notice_version;
-- alter table onboarding_work_preferences drop column if exists candidate_id;
