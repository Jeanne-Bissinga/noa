-- ─── skills_signals ─────────────────────────────────────────────────────────
-- Signaux marché (compétences, tendances RH) ingérés depuis des flux RSS
-- externes (études, médias emploi/tech). Donnée de marché partagée entre
-- toutes les entreprises, pas de company_id : alimente le contexte de la
-- Scorecard intelligente (chat hard skills / soft skills / valeurs).
create table if not exists skills_signals (
  id uuid primary key default gen_random_uuid(),
  source_name text not null,
  source_url text not null,
  priority text not null check (priority in ('high', 'medium')),
  title text not null,
  link text not null unique,
  summary text not null default '',
  published_at timestamptz,
  fetched_at timestamptz not null default now()
);

create index if not exists skills_signals_published_at_idx on skills_signals(published_at desc);
create index if not exists skills_signals_fetched_at_idx on skills_signals(fetched_at desc);

alter table skills_signals enable row level security;

-- Lecture ouverte à tout recruteur authentifié (donnée de marché, pas de
-- périmètre entreprise). L'écriture ne passe que par le client admin
-- (service_role) depuis la route d'ingestion, jamais depuis le navigateur :
-- aucune policy insert/update/delete n'est nécessaire.
create policy "authenticated recruiters can read skills signals" on skills_signals
  for select using (auth.uid() is not null);
