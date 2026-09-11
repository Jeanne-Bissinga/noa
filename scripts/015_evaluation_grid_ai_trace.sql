-- Traçabilité IA (règlement européen sur l'intelligence artificielle) des
-- grilles d'évaluation.
--
-- Les réponses de `evaluation_grids.answers` sont exclusivement produites par
-- noa à partir de la transcription (cf. finishInterview /
-- app/candidats/[id]/actions.ts) : il n'existe aucun chemin où un recruteur
-- coche ou corrige une réponse individuellement. `updated_at` ne suffit pas à
-- en garder la trace : cette colonne est aussi touchée quand le recruteur
-- modifie les CRITÈRES avant l'entretien (même fichier, ligne ~338), ce qui
-- est un geste humain distinct.
--
-- `answers_evaluated_at` isole l'évènement qui compte pour la traçabilité
-- exigée par l'article 12 du règlement IA pour les systèmes à haut risque :
-- le moment précis où le système a produit son évaluation. Nullable : reste
-- vide tant que l'entretien n'a pas été analysé.
--
-- Run this once in Supabase Dashboard -> SQL Editor -> New query -> Run,
-- sur CHAQUE projet : la prod ET le projet de test.

alter table evaluation_grids
  add column if not exists answers_evaluated_at timestamptz;

-- ─── Retour arrière ─────────────────────────────────────────────────────────
-- alter table evaluation_grids drop column if exists answers_evaluated_at;
