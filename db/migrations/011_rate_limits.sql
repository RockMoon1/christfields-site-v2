-- 011_rate_limits.sql
-- Durable, atomic rate limiting to replace the best-effort in-memory limiters
-- in /api/submit and /api/verse. Those live in per-instance memory and reset on
-- cold start, so on serverless they are bypassable. This moves the counter into
-- the database where it is shared and atomic.
--
-- SAFE TO RUN ANYTIME. Until it is run, lib/rate-limit.ts detects the missing
-- function and the routes fall back to their in-memory limiters (today's
-- behavior). After it is run, the same code enforces a real global limit.

create table if not exists rate_limit_counters (
  bucket       text        not null,
  window_start timestamptz not null,
  count        int         not null default 0,
  primary key (bucket, window_start)
);

create index if not exists rate_limit_counters_window_idx
  on rate_limit_counters (window_start);

-- Defense-in-depth, consistent with 010_rls.sql: deny by default for any
-- non-service-role access path. The app reaches this only via the service-role
-- key (which bypasses RLS), so enabling it changes nothing for the running app.
alter table rate_limit_counters enable row level security;

-- Atomically count one hit in the current fixed window and return the new count.
-- The caller allows the request when the returned count <= its own limit.
create or replace function rate_limit_take(p_bucket text, p_window_seconds int)
returns int
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_window timestamptz;
  v_count  int;
begin
  v_window := to_timestamp(
    floor(extract(epoch from now()) / p_window_seconds) * p_window_seconds
  );
  insert into public.rate_limit_counters (bucket, window_start, count)
    values (p_bucket, v_window, 1)
  on conflict (bucket, window_start)
    do update set count = public.rate_limit_counters.count + 1
  returning count into v_count;
  return v_count;
end;
$$;

-- Only the server (service role) calls this; keep it off the public API surface
-- so anon/authenticated cannot poke the counter via /rest/v1/rpc.
revoke all on function rate_limit_take(text, int) from public, anon, authenticated;
grant execute on function rate_limit_take(text, int) to service_role;

-- Optional housekeeping: drop windows older than a day. Run from a scheduled
-- job if you like, or ignore (the table stays tiny at this scale).
create or replace function rate_limit_gc()
returns void
language sql
security invoker
set search_path = ''
as $$
  delete from public.rate_limit_counters where window_start < now() - interval '1 day';
$$;
