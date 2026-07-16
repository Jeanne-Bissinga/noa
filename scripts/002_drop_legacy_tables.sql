-- Drops the unused legacy tables left over from v0's original Supabase
-- auto-provisioning (commit 0aa59bd, before this app's real schema in
-- 001_noa_schema.sql). Nothing in the codebase queries these singular-named
-- tables (company, mission, candidate, ...) - the app uses the plural ones
-- (companies, missions, candidates, ...) exclusively.
--
-- Run this once in Supabase Dashboard -> SQL Editor -> New query -> Run.
-- This is destructive: any data in these tables will be permanently lost.

drop table if exists public.synthesis cascade;
drop table if exists public.evaluation_grid cascade;
drop table if exists public.interview_guide cascade;
drop table if exists public.interview cascade;
drop table if exists public.candidate cascade;
drop table if exists public.mission cascade;
drop table if exists public.company cascade;
