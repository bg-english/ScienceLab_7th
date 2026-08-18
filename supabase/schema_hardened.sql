-- ============================================================
-- SciLab — HARDENED schema (opt-in security upgrade)
-- ------------------------------------------------------------
-- IMPORTANT: run schema.sql first (base tables), then run this
-- file in the Supabase SQL Editor to lock down Row Level Security.
--
-- Model:
--   * The teacher pre-loads each student with a secret PIN/token
--     (hashed with SHA-256, never stored in plaintext).
--   * The student app sends the token in the header
--     `x-student-token`. RLS verifies it server-side.
--   * Students can ONLY read/update THEIR OWN row; only the
--     teacher account can see the whole class, post notices,
--     and read interventions.
--   * Without a valid token, reads/writes are DENIED.
--
-- This replaces the wide-open "using (true)" policies from
-- schema.sql. It does NOT yet make XP server-authoritative
-- (that is the next milestone: a scoring Edge Function).
-- ============================================================

create extension if not exists pgcrypto;

-- 1) Student accounts (token store). Populate from your roster, e.g.:
--    insert into student_accounts (student_name, section, role, token_hash)
--    values
--      ('Student Blue 1', 'blue', 'student',
--        encode(digest('BLUE1-PIN', 'sha256'), 'hex')),
--      ('Edoardo Arturo Ortiz Urbina', null, 'teacher',
--        encode(digest('TEACHER-PIN', 'sha256'), 'hex'));
create table if not exists public.student_accounts (
  student_name text primary key,
  section text,
  role text not null default 'student' check (role in ('student','teacher')),
  token_hash text not null,
  created_at timestamptz default now()
);

-- 2) Helper: read the client-provided token from the request header
create or replace function public.auth_token() returns text
language sql stable
as $$
  select coalesce(
    nullif(current_setting('request.headers', true)::json->>'x-student-token', ''),
    ''
  );
$$;

-- 3) Helper: current student (returns NULL if token invalid)
create or replace function public.current_student() returns text
language sql stable
as $$
  select s.student_name
  from public.student_accounts s
  where s.token_hash = encode(digest(public.auth_token(), 'sha256'), 'hex')
  limit 1;
$$;

-- 4) Helper: is the requester the teacher?
create or replace function public.is_teacher() returns boolean
language sql stable
as $$
  select exists (
    select 1 from public.student_accounts
    where role = 'teacher'
      and token_hash = encode(digest(public.auth_token(), 'sha256'), 'hex')
  );
$$;

-- ============================================================
-- 5) Row Level Security policies
-- ============================================================

-- ---- sciencelab_scores: own row only (or teacher) ----
drop policy if exists "anon read scores" on public.sciencelab_scores;
drop policy if exists "anon upsert scores" on public.sciencelab_scores;
drop policy if exists "anon update scores" on public.sciencelab_scores;
create policy "score read own" on public.sciencelab_scores
  for select using (public.is_teacher() or public.current_student() = student_name);
create policy "score insert own" on public.sciencelab_scores
  for insert with check (public.current_student() = student_name or public.is_teacher());
create policy "score update own" on public.sciencelab_scores
  for update using (public.current_student() = student_name or public.is_teacher());

-- ---- sciencelab_interventions: insert own, read teacher-only ----
drop policy if exists "anon read interventions" on public.sciencelab_interventions;
drop policy if exists "anon insert interventions" on public.sciencelab_interventions;
create policy "intervention read teacher" on public.sciencelab_interventions
  for select using (public.is_teacher());
create policy "intervention insert own" on public.sciencelab_interventions
  for insert with check (public.current_student() = student_name or public.is_teacher());

-- ---- sciencelab_notices: read active for all, write teacher-only ----
drop policy if exists "anon read notices" on public.sciencelab_notices;
drop policy if exists "anon insert notices" on public.sciencelab_notices;
drop policy if exists "anon update notices" on public.sciencelab_notices;
create policy "notice read active" on public.sciencelab_notices
  for select using (active = true or public.is_teacher());
create policy "notice write teacher" on public.sciencelab_notices
  for insert with check (public.is_teacher());
create policy "notice update teacher" on public.sciencelab_notices
  for update using (public.is_teacher());

-- ---- sciencelab_notice_reads: insert own, read own or teacher ----
drop policy if exists "anon read reads" on public.sciencelab_notice_reads;
drop policy if exists "anon insert reads" on public.sciencelab_notice_reads;
create policy "reads read own" on public.sciencelab_notice_reads
  for select using (public.current_student() = student_name or public.is_teacher());
create policy "reads insert own" on public.sciencelab_notice_reads
  for insert with check (public.current_student() = student_name or public.is_teacher());

-- ============================================================
-- 6) Extra hardening
-- ============================================================

-- Reject requests that fail to provide a valid token entirely
alter table public.sciencelab_scores force row level security;
alter table public.sciencelab_interventions force row level security;
alter table public.sciencelab_notices force row level security;
alter table public.sciencelab_notice_reads force row level security;

-- Revoke direct table access from anon (all access must pass RLS above).
-- NOTE: The anon role still needs privileges for the queries to run;
-- policies gate which ROWS are visible. If you prefer API-only access,
-- revoke here and expose everything through Edge Functions instead.
revoke all on public.student_accounts from anon, authenticated;