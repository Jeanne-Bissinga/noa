-- Noa schema: companies, recruiters, missions, candidates, interviews, evaluations, syntheses, decisions
-- Run this once in Supabase Dashboard -> SQL Editor -> New query -> Run.

create extension if not exists "pgcrypto";

-- ─── companies ──────────────────────────────────────────────────────────────
create table if not exists companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  siret text,
  sector text,
  team_size text,
  main_objective text,
  activity_description text,
  culture_values text,
  tech_stack text[] default '{}',
  hr_challenges text,
  onboarding_completed boolean not null default false,
  created_at timestamptz not null default now()
);

-- ─── recruiters ─────────────────────────────────────────────────────────────
-- 1 company -> 1 recruiter in the current product flow, but modeled as
-- company_id FK on recruiters so multiple recruiters per company is possible
-- later without a migration.
create table if not exists recruiters (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  company_id uuid not null references companies(id) on delete cascade,
  first_name text not null,
  last_name text not null,
  email text not null,
  job_title text,
  role text not null default 'admin' check (role in ('admin', 'recruteur')),
  created_at timestamptz not null default now()
);

create index if not exists recruiters_company_id_idx on recruiters(company_id);

-- helper: company_id of the currently authenticated recruiter
create or replace function current_company_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select company_id from recruiters where user_id = auth.uid()
$$;

-- ─── missions ───────────────────────────────────────────────────────────────
create table if not exists missions (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  created_by uuid references recruiters(id) on delete set null,
  title text not null,
  reason text,
  reason_detail text,
  status text not null default 'brouillon' check (status in ('brouillon', 'en_cours', 'pourvu', 'annule')),
  process_step int not null default 0,
  mission_text text,
  final_spec_text text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists missions_company_id_idx on missions(company_id);

create table if not exists mission_objectives (
  id uuid primary key default gen_random_uuid(),
  mission_id uuid not null references missions(id) on delete cascade,
  label text not null,
  metric text,
  deadline text,
  threshold text,
  position int not null default 0
);

create index if not exists mission_objectives_mission_id_idx on mission_objectives(mission_id);

create table if not exists mission_skills (
  id uuid primary key default gen_random_uuid(),
  mission_id uuid not null references missions(id) on delete cascade,
  category text not null check (category in ('technique', 'relationnelle', 'comportementale')),
  name text not null,
  position int not null default 0
);

create index if not exists mission_skills_mission_id_idx on mission_skills(mission_id);

-- ─── candidates ─────────────────────────────────────────────────────────────
create table if not exists candidates (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  mission_id uuid not null references missions(id) on delete cascade,
  first_name text not null,
  last_name text not null,
  email text,
  title text,
  location text,
  summary text,
  cv_url text,
  attachments jsonb not null default '[]',
  source text,
  status text not null default 'Screening' check (status in ('Screening', 'Topgrading', 'Decision finale', 'Non retenu', 'Recrute')),
  screening_status text not null default 'current' check (screening_status in ('done', 'current', 'pending', 'none')),
  topgrading_status text not null default 'pending' check (topgrading_status in ('done', 'current', 'pending', 'none')),
  decision_status text not null default 'pending' check (decision_status in ('done', 'current', 'pending', 'none')),
  score int,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists candidates_company_id_idx on candidates(company_id);
create index if not exists candidates_mission_id_idx on candidates(mission_id);

create table if not exists candidate_experiences (
  id uuid primary key default gen_random_uuid(),
  candidate_id uuid not null references candidates(id) on delete cascade,
  role text,
  company text,
  period text,
  bullets text[] default '{}',
  position int not null default 0
);

create index if not exists candidate_experiences_candidate_id_idx on candidate_experiences(candidate_id);

create table if not exists candidate_skills (
  id uuid primary key default gen_random_uuid(),
  candidate_id uuid not null references candidates(id) on delete cascade,
  name text not null
);

create index if not exists candidate_skills_candidate_id_idx on candidate_skills(candidate_id);

-- ─── interviews ─────────────────────────────────────────────────────────────
create table if not exists interviews (
  id uuid primary key default gen_random_uuid(),
  candidate_id uuid not null references candidates(id) on delete cascade,
  type text not null check (type in ('screening', 'topgrading')),
  format text,
  duration_minutes int,
  status text not null default 'planifie' check (status in ('planifie', 'termine')),
  recording_status text not null default 'none',
  transcript text,
  interviewer_id uuid references recruiters(id) on delete set null,
  scheduled_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

create unique index if not exists interviews_candidate_type_unique on interviews(candidate_id, type);

-- ─── evaluation grids (screening / topgrading answers) ─────────────────────
create table if not exists evaluation_grids (
  id uuid primary key default gen_random_uuid(),
  interview_id uuid not null references interviews(id) on delete cascade,
  mission_id uuid references missions(id) on delete set null,
  criteria jsonb not null default '[]',
  answers jsonb not null default '{}',
  notes jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists evaluation_grids_interview_id_unique on evaluation_grids(interview_id);

-- ─── interview guides (distinct from the grid) ─────────────────────────────
create table if not exists interview_guides (
  id uuid primary key default gen_random_uuid(),
  interview_id uuid not null references interviews(id) on delete cascade,
  questions jsonb not null default '[]',
  topics jsonb not null default '[]',
  format text,
  duration_minutes int,
  created_at timestamptz not null default now()
);

create unique index if not exists interview_guides_interview_id_unique on interview_guides(interview_id);

-- ─── syntheses (noa-generated vs recruiter) ────────────────────────────────
create table if not exists syntheses (
  id uuid primary key default gen_random_uuid(),
  candidate_id uuid not null references candidates(id) on delete cascade,
  interview_id uuid references interviews(id) on delete set null,
  authored_by text not null check (authored_by in ('noa', 'recruiter')),
  content text,
  advice text,
  created_at timestamptz not null default now()
);

create index if not exists syntheses_candidate_id_idx on syntheses(candidate_id);

-- ─── decisions ──────────────────────────────────────────────────────────────
create table if not exists decisions (
  id uuid primary key default gen_random_uuid(),
  candidate_id uuid not null references candidates(id) on delete cascade,
  stage text not null check (stage in ('screening', 'topgrading', 'final')),
  status text not null check (status in ('retenu', 'non_retenu', 'reporte')),
  reason text,
  decided_by uuid references recruiters(id) on delete set null,
  decided_at timestamptz not null default now()
);

create index if not exists decisions_candidate_id_idx on decisions(candidate_id);

-- ─── RPC: atomic signup (creates company + recruiter together) ─────────────
create or replace function create_company_and_recruiter(
  p_company_name text,
  p_siret text,
  p_sector text,
  p_team_size text,
  p_main_objective text,
  p_first_name text,
  p_last_name text,
  p_email text,
  p_job_title text
)
returns table (company_id uuid, recruiter_id uuid)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_company_id uuid;
  v_recruiter_id uuid;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;

  if exists (select 1 from recruiters where user_id = auth.uid()) then
    raise exception 'recruiter already exists for this user';
  end if;

  insert into companies (name, siret, sector, team_size, main_objective)
  values (p_company_name, p_siret, p_sector, p_team_size, p_main_objective)
  returning id into v_company_id;

  insert into recruiters (user_id, company_id, first_name, last_name, email, job_title, role)
  values (auth.uid(), v_company_id, p_first_name, p_last_name, p_email, p_job_title, 'admin')
  returning id into v_recruiter_id;

  return query select v_company_id, v_recruiter_id;
end;
$$;

grant execute on function create_company_and_recruiter(text, text, text, text, text, text, text, text, text) to authenticated;

-- ─── Row Level Security ─────────────────────────────────────────────────────
alter table companies enable row level security;
alter table recruiters enable row level security;
alter table missions enable row level security;
alter table mission_objectives enable row level security;
alter table mission_skills enable row level security;
alter table candidates enable row level security;
alter table candidate_experiences enable row level security;
alter table candidate_skills enable row level security;
alter table interviews enable row level security;
alter table evaluation_grids enable row level security;
alter table interview_guides enable row level security;
alter table syntheses enable row level security;
alter table decisions enable row level security;

create policy "recruiters can read their own company" on companies
  for select using (id = current_company_id());
create policy "recruiters can update their own company" on companies
  for update using (id = current_company_id());

create policy "recruiters can read colleagues" on recruiters
  for select using (company_id = current_company_id());
create policy "recruiters can update themselves" on recruiters
  for update using (user_id = auth.uid());

create policy "company scoped select" on missions
  for select using (company_id = current_company_id());
create policy "company scoped insert" on missions
  for insert with check (company_id = current_company_id());
create policy "company scoped update" on missions
  for update using (company_id = current_company_id());
create policy "company scoped delete" on missions
  for delete using (company_id = current_company_id());

create policy "mission scoped all" on mission_objectives
  for all using (
    exists (select 1 from missions m where m.id = mission_objectives.mission_id and m.company_id = current_company_id())
  ) with check (
    exists (select 1 from missions m where m.id = mission_objectives.mission_id and m.company_id = current_company_id())
  );

create policy "mission scoped all" on mission_skills
  for all using (
    exists (select 1 from missions m where m.id = mission_skills.mission_id and m.company_id = current_company_id())
  ) with check (
    exists (select 1 from missions m where m.id = mission_skills.mission_id and m.company_id = current_company_id())
  );

create policy "company scoped select" on candidates
  for select using (company_id = current_company_id());
create policy "company scoped insert" on candidates
  for insert with check (company_id = current_company_id());
create policy "company scoped update" on candidates
  for update using (company_id = current_company_id());
create policy "company scoped delete" on candidates
  for delete using (company_id = current_company_id());

create policy "candidate scoped all" on candidate_experiences
  for all using (
    exists (select 1 from candidates c where c.id = candidate_experiences.candidate_id and c.company_id = current_company_id())
  ) with check (
    exists (select 1 from candidates c where c.id = candidate_experiences.candidate_id and c.company_id = current_company_id())
  );

create policy "candidate scoped all" on candidate_skills
  for all using (
    exists (select 1 from candidates c where c.id = candidate_skills.candidate_id and c.company_id = current_company_id())
  ) with check (
    exists (select 1 from candidates c where c.id = candidate_skills.candidate_id and c.company_id = current_company_id())
  );

create policy "candidate scoped all" on interviews
  for all using (
    exists (select 1 from candidates c where c.id = interviews.candidate_id and c.company_id = current_company_id())
  ) with check (
    exists (select 1 from candidates c where c.id = interviews.candidate_id and c.company_id = current_company_id())
  );

create policy "interview scoped all" on evaluation_grids
  for all using (
    exists (
      select 1 from interviews i
      join candidates c on c.id = i.candidate_id
      where i.id = evaluation_grids.interview_id and c.company_id = current_company_id()
    )
  ) with check (
    exists (
      select 1 from interviews i
      join candidates c on c.id = i.candidate_id
      where i.id = evaluation_grids.interview_id and c.company_id = current_company_id()
    )
  );

create policy "interview scoped all" on interview_guides
  for all using (
    exists (
      select 1 from interviews i
      join candidates c on c.id = i.candidate_id
      where i.id = interview_guides.interview_id and c.company_id = current_company_id()
    )
  ) with check (
    exists (
      select 1 from interviews i
      join candidates c on c.id = i.candidate_id
      where i.id = interview_guides.interview_id and c.company_id = current_company_id()
    )
  );

create policy "candidate scoped all" on syntheses
  for all using (
    exists (select 1 from candidates c where c.id = syntheses.candidate_id and c.company_id = current_company_id())
  ) with check (
    exists (select 1 from candidates c where c.id = syntheses.candidate_id and c.company_id = current_company_id())
  );

create policy "candidate scoped all" on decisions
  for all using (
    exists (select 1 from candidates c where c.id = decisions.candidate_id and c.company_id = current_company_id())
  ) with check (
    exists (select 1 from candidates c where c.id = decisions.candidate_id and c.company_id = current_company_id())
  );

-- ─── Storage: CV & attachments bucket ───────────────────────────────────────
insert into storage.buckets (id, name, public)
values ('cv-attachments', 'cv-attachments', false)
on conflict (id) do nothing;

create policy "recruiters read own company cv files"
  on storage.objects for select
  using (bucket_id = 'cv-attachments' and (storage.foldername(name))[1] = current_company_id()::text);

create policy "recruiters upload own company cv files"
  on storage.objects for insert
  with check (bucket_id = 'cv-attachments' and (storage.foldername(name))[1] = current_company_id()::text);

create policy "recruiters update own company cv files"
  on storage.objects for update
  using (bucket_id = 'cv-attachments' and (storage.foldername(name))[1] = current_company_id()::text);

create policy "recruiters delete own company cv files"
  on storage.objects for delete
  using (bucket_id = 'cv-attachments' and (storage.foldername(name))[1] = current_company_id()::text);
