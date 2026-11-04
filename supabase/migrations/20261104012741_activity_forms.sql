-- Private activity planning. No direct browser access; server performs identity checks.
create table public.activity_forms (
  slug text primary key,
  enabled boolean not null default true,
  closes_at timestamptz not null
);
create table public.activity_responses (
  id uuid primary key,
  form_slug text not null references public.activity_forms(slug),
  payload_hash text not null,
  name text not null check (length(name) between 1 and 80),
  interest text not null check (interest in ('yes','maybe','no')),
  available date[] not null default '{}',
  unavailable date[] not null default '{}',
  notes text not null default '' check (length(notes) <= 1000),
  notice_version text not null,
  email_status text not null default 'pending' check (email_status in ('pending','sent','failed')),
  created_at timestamptz not null default now()
);
create index activity_responses_form_created on public.activity_responses(form_slug, created_at desc);
alter table public.activity_forms enable row level security;
alter table public.activity_responses enable row level security;
revoke all on public.activity_forms, public.activity_responses from public, anon, authenticated;
grant select, insert, update, delete on public.activity_forms, public.activity_responses to service_role;
insert into public.activity_forms(slug, enabled, closes_at)
values ('november-2026-car-camping', true, '2026-12-01 07:00:00+00');

create function public.submit_activity_response(
  p_slug text, p_id uuid, p_hash text, p_name text, p_interest text,
  p_available date[], p_unavailable date[], p_notes text, p_notice text
) returns text language plpgsql security invoker set search_path = '' as $$
declare
  v_form public.activity_forms;
  v_hash text;
  v_inserted uuid;
begin
  select * into v_form from public.activity_forms where slug=p_slug for share;
  if not found then return 'closed'; end if;
  -- A retry may acknowledge an already saved answer, but cannot create a new
  -- response after closure, including from an old browser tab.
  select payload_hash into v_hash from public.activity_responses where id=p_id and form_slug=p_slug;
  if found then
    if v_hash=p_hash then return 'duplicate'; else return 'conflict'; end if;
  end if;
  if not v_form.enabled or now() >= v_form.closes_at then return 'closed'; end if;
  if p_slug <> 'november-2026-car-camping' or p_notice <> '2026-11-04'
    or p_hash !~ '^[a-f0-9]{64}$'
    or cardinality(p_available)>30 or cardinality(p_unavailable)>30
    or p_available && p_unavailable
    or exists(select 1 from unnest(p_available || p_unavailable) d where d is null or d < date '2026-11-01' or d > date '2026-11-30')
  then raise exception 'Invalid response'; end if;
  insert into public.activity_responses(id,form_slug,payload_hash,name,interest,available,unavailable,notes,notice_version)
  values(p_id,p_slug,p_hash,p_name,p_interest,p_available,p_unavailable,p_notes,p_notice)
  on conflict(id) do nothing returning id into v_inserted;
  if v_inserted is not null then return 'created'; end if;
  select payload_hash into v_hash from public.activity_responses where id=p_id and form_slug=p_slug;
  if v_hash=p_hash then return 'duplicate'; else return 'conflict'; end if;
end;
$$;
revoke all on function public.submit_activity_response(text,uuid,text,text,text,date[],date[],text,text) from public,anon,authenticated;
grant execute on function public.submit_activity_response(text,uuid,text,text,text,date[],date[],text,text) to service_role;
