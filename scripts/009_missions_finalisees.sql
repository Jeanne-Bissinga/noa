-- Une campagne abandonnée en cours de création restait enregistrée et
-- s'affichait dans la liste avec le libellé « En attente de candidat »,
-- impossible à distinguer d'une campagne aboutie.
--
-- La campagne continue d'être créée dès la première étape, pour ne rien perdre
-- si le navigateur se ferme, mais elle n'existe pour l'utilisateur qu'une fois
-- les 5 étapes franchies et la fiche de poste validée. Ce drapeau porte cette
-- distinction : l'application ne liste que les campagnes finalisées.
--
-- Run this once in Supabase Dashboard -> SQL Editor -> New query -> Run,
-- sur CHAQUE projet : la prod ET le projet de test.

alter table missions
  add column if not exists finalized boolean not null default false;

-- ─── Rattrapage des campagnes existantes ────────────────────────────────────
-- Est considérée comme finalisée une campagne qui a une mission rédigée, au
-- moins un objectif et au moins une compétence : c'est ce qu'on ne peut avoir
-- qu'en ayant traversé les cinq étapes. Les campagnes abandonnées en route
-- restent donc à false et disparaissent des listes.
--
-- À exécuter APRÈS avoir vérifié ce que ça change, avec la requête de contrôle
-- en fin de fichier.
update missions m
set finalized = true
where coalesce(trim(m.mission_text), '') <> ''
  and exists (select 1 from mission_objectives o where o.mission_id = m.id)
  and exists (select 1 from mission_skills s where s.mission_id = m.id);

-- ─── Contrôle ───────────────────────────────────────────────────────────────
-- À lancer séparément pour voir ce que le rattrapage a décidé, campagne par
-- campagne, avant ou après coup :
--
-- select m.title, m.status, m.finalized,
--        coalesce(trim(m.mission_text), '') <> '' as mission_redigee,
--        (select count(*) from mission_objectives o where o.mission_id = m.id) as objectifs,
--        (select count(*) from mission_skills s where s.mission_id = m.id) as competences,
--        (select count(*) from candidates c where c.mission_id = m.id) as candidats
-- from missions m
-- order by m.created_at desc;
--
-- Une campagne à finalized = false qui aurait des candidats rattachés serait
-- une anomalie : la repasser à true à la main plutôt que de la perdre.
