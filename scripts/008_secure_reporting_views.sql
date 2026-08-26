-- Sécurise les 11 vues de reporting créées par les scripts 005, 006 et 007.
--
-- Problème corrigé : ces vues avaient été créées dans le schéma `public`, que
-- Supabase expose automatiquement via son API REST. Elles étaient donc
-- interrogeables de l'extérieur avec la seule clé `anon`, qui est publique par
-- nature (préfixe NEXT_PUBLIC_, embarquée dans le bundle JS du navigateur).
-- Et comme une vue Postgres s'exécute avec les droits de son créateur et non
-- de son appelant, les policies RLS des tables sous-jacentes ne s'appliquaient
-- pas : n'importe qui pouvait lire les candidats, décisions et entretiens de
-- toutes les entreprises clientes.
--
-- Correction : déplacer les vues dans un schéma `reporting` dédié, non exposé
-- par l'API, et retirer les droits que les default privileges de `public`
-- avaient accordés automatiquement à anon et authenticated (7 privilèges par
-- vue, pas seulement le select).
--
-- Aucune de ces vues n'est lue par l'application (aucune occurrence de `vw_`
-- dans le code TypeScript) : ce script ne change rien au fonctionnement de noa.
--
-- Run this once in Supabase Dashboard -> SQL Editor -> New query -> Run,
-- sur CHAQUE projet : la prod ET le projet de test.

-- ─── 1. Schéma dédié, hors de portée de l'API REST ──────────────────────────
-- À vérifier une fois créé : Settings -> API -> Exposed schemas ne doit
-- contenir que `public` (et `graphql_public`), surtout pas `reporting`.
create schema if not exists reporting;

-- ─── 2. Déplacement des 11 vues ─────────────────────────────────────────────
-- `if exists` pour que le script reste rejouable, et passe aussi sur un
-- environnement où l'une des vues n'aurait pas encore été créée.
alter view if exists vw_missions_summary            set schema reporting;
alter view if exists vw_candidates_pipeline         set schema reporting;
alter view if exists vw_candidate_funnel            set schema reporting;
alter view if exists vw_decisions_detail            set schema reporting;
alter view if exists vw_interviews_summary          set schema reporting;
alter view if exists vw_time_to_hire                set schema reporting;
alter view if exists vw_kpi_candidates_imported_30d set schema reporting;
alter view if exists vw_kpi_decision_completion_30d set schema reporting;
alter view if exists vw_kpi_new_accounts_30d        set schema reporting;
alter view if exists vw_kpi_stagnant_campaigns      set schema reporting;
alter view if exists vw_kpi_pack_utilization        set schema reporting;

-- ─── 3. Retrait des droits hérités de `public` ──────────────────────────────
-- Les privilèges sont attachés à l'objet, pas au schéma : ils ont suivi les
-- vues pendant le déplacement. On les retire explicitement, et on coupe l'accès
-- au schéma lui-même. Ceinture et bretelles : sans usage sur le schéma, les
-- grants restants seraient déjà inutilisables.
revoke all on all tables in schema reporting from anon, authenticated;
revoke usage on schema reporting from anon, authenticated;

-- Contrairement à `public`, ce schéma n'a aucune default privilege : toute vue
-- créée ici à l'avenir sera privée dès sa création, sans rien avoir à révoquer.

-- ─── 4. Lire ces vues, désormais ────────────────────────────────────────────
-- Depuis le SQL Editor, préfixer par le schéma :
--   select * from reporting.vw_kpi_new_accounts_30d;

-- ─── 5. Le jour où un outil BI sera branché ─────────────────────────────────
-- Rôle dédié en lecture seule, à créer volontairement (ce script ne le fait
-- pas). `bypassrls` est nécessaire pour un dashboard cross-company.
--
-- create role metabase_reader login password 'change-moi' bypassrls;
-- grant usage on schema reporting to metabase_reader;
-- grant select on all tables in schema reporting to metabase_reader;
--
-- Ne jamais utiliser la clé service_role de l'app pour un outil externe.
