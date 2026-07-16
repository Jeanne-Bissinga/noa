-- Replaces the single free-text "Mission en macro" field captured at mission
-- creation (step "Pourquoi ce recrutement ?") with two distinct inputs used
-- to draft the executive summary (missions.mission_text) : the recruiter's
-- starting point (current situation) and their target objective (with its
-- own timeframe). Kept as separate columns (not just folded into
-- mission_text) so the recruiter's original inputs stay editable/visible
-- even after noa has rewritten mission_text into the executive summary.
--
-- Run this once in Supabase Dashboard -> SQL Editor -> New query -> Run.

alter table public.missions
  add column if not exists starting_point text,
  add column if not exists target_objective text;
