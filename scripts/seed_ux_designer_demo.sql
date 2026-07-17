-- Données de démo : 1 recrutement "UX Designer" avec 3 candidats en Screening,
-- rattaché au compte recruteur jojaref221@luckfeed.com.
--
-- Ce n'est PAS une migration de schéma (pas de numéro de séquence) : c'est un
-- jeu de données ponctuel à exécuter une fois, à la main, quand on veut une
-- démo. Suppose que scripts/001 à 004 ont déjà été appliqués (colonnes
-- starting_point/target_objective sur missions notamment).
--
-- Run this once in Supabase Dashboard -> SQL Editor -> New query -> Run.

do $$
declare
  v_company_id uuid;
  v_recruiter_id uuid;
  v_mission_id uuid;
begin
  select company_id, id into v_company_id, v_recruiter_id
  from recruiters
  where email = 'jojaref221@luckfeed.com'
  limit 1;

  if v_company_id is null then
    raise exception 'Aucun recruteur trouvé avec cet email : jojaref221@luckfeed.com';
  end if;

  -- ─── Mission ──────────────────────────────────────────────────────────────
  insert into missions (
    company_id, created_by, title, reason, status, process_step,
    starting_point, target_objective, mission_text
  ) values (
    v_company_id, v_recruiter_id, 'UX Designer', 'newrole', 'en_cours', 1,
    'Le produit n''a pas de designer dédié : les maquettes sont produites par les développeurs en parallèle du code, sans recherche utilisateur ni design system, ce qui ralentit les livraisons et nuit à la cohérence de l''interface.',
    'Structurer une vraie pratique UX/UI et livrer une refonte des parcours clés en 6 mois.',
    'Concevoir, prototyper et tester les parcours clés du produit, en collaboration avec l''équipe produit et les développeurs, pour structurer un design system et améliorer durablement l''expérience utilisateur.'
  )
  returning id into v_mission_id;

  -- ─── Résultats attendus (KPI) ───────────────────────────────────────────────
  insert into mission_objectives (mission_id, label, metric, deadline, threshold, position) values
    (v_mission_id, 'Refonte des parcours clés testée', 'Taux de complétion aux tests utilisateurs', '90 jours', '≥ 85 %', 0),
    (v_mission_id, 'Design system opérationnel', 'Composants critiques documentés dans Figma', '60 jours', '100 % des composants critiques', 1),
    (v_mission_id, 'Réduction du taux d''abandon', 'Delta abandon avant/après refonte', '90 jours', '-15 %', 2),
    (v_mission_id, 'Cadence de livraison des wireframes', 'Wireframes validés par sprint', '30 jours', '3 à 4 par sprint', 3),
    (v_mission_id, 'Collaboration produit/dev installée', 'Fréquence des ateliers de cadrage', '30 jours', '1 atelier par semaine', 4);

  -- ─── Compétences requises ───────────────────────────────────────────────────
  insert into mission_skills (mission_id, category, name, position) values
    (v_mission_id, 'technique', 'Figma', 0),
    (v_mission_id, 'technique', 'Prototypage interactif', 1),
    (v_mission_id, 'technique', 'Recherche utilisateur', 2),
    (v_mission_id, 'technique', 'Design system', 3),
    (v_mission_id, 'technique', 'Tests d''utilisabilité', 4),
    (v_mission_id, 'relationnelle', 'Communication avec les développeurs', 0),
    (v_mission_id, 'relationnelle', 'Animation d''ateliers de cadrage', 1),
    (v_mission_id, 'relationnelle', 'Présentation en comité', 2),
    (v_mission_id, 'comportementale', 'Empathie utilisateur', 0),
    (v_mission_id, 'comportementale', 'Rigueur méthodologique', 1),
    (v_mission_id, 'comportementale', 'Curiosité et veille design', 2);

  -- ─── Candidats (tous en Screening, entretien pas encore démarré) ───────────
  insert into candidates (
    company_id, mission_id, first_name, last_name, email, title, location, summary,
    status, screening_status, topgrading_status, decision_status
  ) values
    (v_company_id, v_mission_id, 'Camille', 'Bernard', 'camille.bernard@example.com', 'UX Designer', 'Bordeaux, France',
     'UX Designer avec 4 ans d''expérience en SaaS B2B, spécialisée en recherche utilisateur et design system.',
     'Screening', 'current', 'pending', 'pending'),
    (v_company_id, v_mission_id, 'Lucas', 'Petit', 'lucas.petit@example.com', 'UX/UI Designer', 'Nantes, France',
     'UX/UI Designer généraliste, 3 ans d''expérience, à l''aise sur l''ensemble du parcours de conception (recherche, wireframes, UI, tests).',
     'Screening', 'current', 'pending', 'pending'),
    (v_company_id, v_mission_id, 'Sarah', 'Cohen', 'sarah.cohen@example.com', 'Product Designer', 'Paris, France',
     'Product Designer au profil hybride UX/produit, habituée à travailler en méthode agile avec des équipes produit et tech.',
     'Screening', 'current', 'pending', 'pending');

  raise notice 'Mission UX Designer créée (id=%) avec 3 candidats en Screening.', v_mission_id;
end $$;
