-- Parcours d'intégration : date d'arrivée facultative, et fin des cibles devinées.
--
-- ─── 1. Date d'arrivée ──────────────────────────────────────────────────────
-- start_date valait « aujourd'hui » par défaut, ce qui faisait démarrer le
-- compteur des 90 jours au moment où le manager préparait le plan — pas au
-- moment où la personne arrive. Le parcours distingue désormais une phase
-- « Avant l'arrivée » : tant que la date n'est pas fixée, elle est nulle et
-- l'interface affiche « À définir ». Le calendrier des points de suivi n'est
-- créé qu'une fois la date connue ET le plan validé, dans n'importe quel ordre.
alter table onboardings alter column start_date drop default;
alter table onboardings alter column start_date drop not null;

-- ─── 2. Cibles chiffrées devinées ───────────────────────────────────────────
-- Le plan d'intégration déduisait une cible numérique en cherchant le premier
-- nombre du texte libre de la Scorecard (metric / threshold / label). Comme le
-- prompt de génération des objectifs impose au modèle de TOUJOURS chiffrer le
-- seuil, y compris pour un résultat qualitatif, la déduction se trompait
-- systématiquement :
--
--   « 100% du backlog reformulé avec au moins 50 user stories »   -> cible 50
--   « 100% des cérémonies réalisées sur 4 sprints consécutifs »   -> cible 4
--   « Écart inférieur à 15% sur 3 sprints consécutifs »           -> cible 3
--   « Score moyen supérieur ou égal à 8/10 »                      -> cible 8
--
-- Aucun de ces nombres n'était une cible à atteindre : c'était une cadence, une
-- durée ou une note. L'extraction est supprimée du code (lib/noa/onboarding/
-- plan.ts) ; cette requête répare les lignes déjà écrites.
--
-- Seuls les objectifs jamais suivis sont corrigés. Un objectif dont un manager
-- a réellement renseigné la valeur courante est conservé tel quel : sa cible a
-- été acceptée en connaissance de cause, la corriger effacerait son suivi.
update onboarding_goals
set kind = 'qualitative', target_value = null, updated_at = now()
where kind = 'numeric' and current_value is null;

-- ─── Contrôle ───────────────────────────────────────────────────────────────
-- select label, kind, target_value, current_value
-- from onboarding_goals order by kind, label;
--
-- Il ne doit plus rester de ligne kind = 'numeric' sans current_value.

-- ─── Retour arrière ─────────────────────────────────────────────────────────
-- Les cibles supprimées ne sont pas restaurables — c'est voulu, elles étaient
-- fausses. Seule la colonne se rend à son état antérieur :
--
-- update onboardings set start_date = current_date where start_date is null;
-- alter table onboardings alter column start_date set not null;
-- alter table onboardings alter column start_date set default current_date;
