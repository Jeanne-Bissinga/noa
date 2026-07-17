-- Données de démo : ajoute 1 candidat en Screening à la campagne "Product
-- Owner" déjà existante, pour le compte recruteur jojaref221@luckfeed.com.
--
-- Ce n'est PAS une migration de schéma : jeu de données ponctuel à exécuter
-- une fois, à la main. Ne crée pas de mission — échoue explicitement si la
-- campagne "Product Owner" n'existe pas encore pour ce recruteur.
--
-- Run this once in Supabase Dashboard -> SQL Editor -> New query -> Run.

do $$
declare
  v_company_id uuid;
  v_mission_id uuid;
begin
  select company_id into v_company_id
  from recruiters
  where email = 'jojaref221@luckfeed.com'
  limit 1;

  if v_company_id is null then
    raise exception 'Aucun recruteur trouvé avec cet email : jojaref221@luckfeed.com';
  end if;

  select id into v_mission_id
  from missions
  where company_id = v_company_id and title = 'Product Owner'
  order by created_at desc
  limit 1;

  if v_mission_id is null then
    raise exception 'Aucune campagne "Product Owner" trouvée pour ce recruteur.';
  end if;

  insert into candidates (
    company_id, mission_id, first_name, last_name, email, title, location, summary,
    status, screening_status, topgrading_status, decision_status
  ) values (
    v_company_id, v_mission_id, 'Thomas', 'Girard', 'thomas.girard@example.com', 'Product Owner', 'Lille, France',
    'Product Owner avec 5 ans d''expérience en delivery agile, priorisation de backlog et pilotage produit en lien direct avec les équipes engineering.',
    'Screening', 'current', 'pending', 'pending'
  );

  raise notice 'Candidat ajouté à la campagne Product Owner (mission_id=%).', v_mission_id;
end $$;
