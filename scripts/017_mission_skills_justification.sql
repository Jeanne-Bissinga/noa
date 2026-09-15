-- ─── mission_skills.justification ──────────────────────────────────────────
-- Explication courte de pourquoi noa a proposé la compétence (signal marché
-- cité, stack/secteur de l'entreprise...), affichée aux managers pour qu'ils
-- comprennent le choix plutôt que de le prendre pour une boîte noire. Nul
-- pour les compétences ajoutées manuellement (pas de génération à justifier).
alter table mission_skills add column if not exists justification text;
