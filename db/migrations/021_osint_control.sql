-- 021_osint_control.sql
-- OSINT installed-machine control plane.
--
-- Stores only activation/device/update metadata. It is intentionally NOT a
-- case-data store: no selectors, evidence, screenshots, notes, or source text.
--
-- SAFE TO RUN ANYTIME. Until it is run, /dashboard/osint-control shows setup
-- instructions and the public activate/check-in APIs return "not configured."

create table if not exists osint_control_activation_tokens (
  id               uuid        primary key default gen_random_uuid(),
  token_hash       text        not null unique,
  label            text        not null,
  contact          text,
  status           text        not null default 'active'
    check (status in ('active', 'disabled', 'expired')),
  max_activations  int         not null default 1
    check (max_activations between 1 and 25),
  activation_count int         not null default 0
    check (activation_count >= 0),
  expires_at       timestamptz,
  created_by       text        not null,
  created_at       timestamptz not null default now(),
  last_used_at     timestamptz
);

create index if not exists osint_control_activation_tokens_created_idx
  on osint_control_activation_tokens (created_at desc);

create table if not exists osint_control_devices (
  id                   uuid        primary key default gen_random_uuid(),
  token_id             uuid        references osint_control_activation_tokens(id) on delete set null,
  install_id           text        not null unique,
  device_secret_hash   text        not null unique,
  label                text        not null,
  contact              text,
  status               text        not null default 'active'
    check (status in ('active', 'suspended', 'revoked')),
  platform             text,
  app_version          text,
  last_ip_hash         text,
  last_user_agent_hash text,
  first_seen_at        timestamptz not null default now(),
  last_seen_at         timestamptz,
  status_changed_at    timestamptz not null default now(),
  revoked_at           timestamptz,
  revoked_by           text,
  revoke_reason        text,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

create index if not exists osint_control_devices_status_idx
  on osint_control_devices (status, last_seen_at desc);

create table if not exists osint_control_release_policy (
  id              text        primary key default 'global' check (id = 'global'),
  service_status  text        not null default 'active'
    check (service_status in ('active', 'maintenance', 'disabled')),
  latest_version  text        not null default '',
  minimum_version text        not null default '',
  download_url    text        not null default '',
  sha256          text        not null default '',
  message         text        not null default '',
  updated_by      text        not null default 'migration',
  updated_at      timestamptz not null default now()
);

insert into osint_control_release_policy (id)
values ('global')
on conflict (id) do nothing;

create table if not exists osint_control_events (
  id         uuid        primary key default gen_random_uuid(),
  event_type text        not null,
  actor      text,
  device_id  uuid        references osint_control_devices(id) on delete set null,
  token_id   uuid        references osint_control_activation_tokens(id) on delete set null,
  reason     text,
  metadata   jsonb       not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists osint_control_events_created_idx
  on osint_control_events (created_at desc);

alter table osint_control_activation_tokens enable row level security;
alter table osint_control_devices enable row level security;
alter table osint_control_release_policy enable row level security;
alter table osint_control_events enable row level security;

revoke all on table osint_control_activation_tokens from public, anon, authenticated;
revoke all on table osint_control_devices from public, anon, authenticated;
revoke all on table osint_control_release_policy from public, anon, authenticated;
revoke all on table osint_control_events from public, anon, authenticated;

grant select, insert, update, delete on table osint_control_activation_tokens to service_role;
grant select, insert, update, delete on table osint_control_devices to service_role;
grant select, insert, update, delete on table osint_control_release_policy to service_role;
grant select, insert, update, delete on table osint_control_events to service_role;

create or replace function osint_control_activate_device(
  p_token_hash text,
  p_device_secret_hash text,
  p_install_id text,
  p_label text,
  p_contact text,
  p_platform text,
  p_app_version text,
  p_ip_hash text,
  p_user_agent_hash text
)
returns table (
  device_id uuid,
  device_status text,
  service_status text,
  latest_version text,
  minimum_version text,
  download_url text,
  sha256 text,
  message text,
  server_time timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_token public.osint_control_activation_tokens%rowtype;
  v_device public.osint_control_devices%rowtype;
  v_policy public.osint_control_release_policy%rowtype;
  v_now timestamptz := now();
begin
  if nullif(p_token_hash, '') is null or nullif(p_device_secret_hash, '') is null then
    raise exception 'activation_token_invalid' using errcode = 'P0001';
  end if;

  insert into public.osint_control_release_policy (id)
  values ('global')
  on conflict (id) do nothing;

  select *
    into v_token
    from public.osint_control_activation_tokens
    where token_hash = p_token_hash
    for update;

  if not found then
    raise exception 'activation_token_invalid' using errcode = 'P0001';
  end if;

  if v_token.status <> 'active' then
    raise exception 'activation_token_disabled' using errcode = 'P0001';
  end if;

  if v_token.expires_at is not null and v_token.expires_at < v_now then
    update public.osint_control_activation_tokens
      set status = 'expired'
      where id = v_token.id;
    insert into public.osint_control_events (event_type, token_id, reason)
      values ('activation_token_expired', v_token.id, 'Expired token was presented.');
    raise exception 'activation_token_expired' using errcode = 'P0001';
  end if;

  if v_token.activation_count >= v_token.max_activations then
    raise exception 'activation_token_exhausted' using errcode = 'P0001';
  end if;

  insert into public.osint_control_devices (
    token_id,
    install_id,
    device_secret_hash,
    label,
    contact,
    platform,
    app_version,
    last_ip_hash,
    last_user_agent_hash,
    last_seen_at
  )
  values (
    v_token.id,
    left(p_install_id, 128),
    p_device_secret_hash,
    left(coalesce(nullif(p_label, ''), v_token.label, 'OSINT reviewer device'), 120),
    nullif(left(coalesce(p_contact, v_token.contact, ''), 160), ''),
    nullif(left(coalesce(p_platform, ''), 120), ''),
    nullif(left(coalesce(p_app_version, ''), 40), ''),
    nullif(p_ip_hash, ''),
    nullif(p_user_agent_hash, ''),
    v_now
  )
  returning * into v_device;

  update public.osint_control_activation_tokens
    set activation_count = activation_count + 1,
        last_used_at = v_now
    where id = v_token.id;

  insert into public.osint_control_events (event_type, actor, device_id, token_id, reason, metadata)
    values (
      'device_activated',
      'public-activation-api',
      v_device.id,
      v_token.id,
      'Invite token activated a device.',
      jsonb_build_object('platform', v_device.platform, 'appVersion', v_device.app_version)
    );

  select *
    into v_policy
    from public.osint_control_release_policy
    where id = 'global';

  return query select
    v_device.id,
    v_device.status,
    v_policy.service_status,
    v_policy.latest_version,
    v_policy.minimum_version,
    v_policy.download_url,
    v_policy.sha256,
    v_policy.message,
    v_now;
end;
$$;

create or replace function osint_control_check_in(
  p_device_id uuid,
  p_device_secret_hash text,
  p_install_id text,
  p_label text,
  p_platform text,
  p_app_version text,
  p_ip_hash text,
  p_user_agent_hash text
)
returns table (
  device_id uuid,
  device_status text,
  service_status text,
  latest_version text,
  minimum_version text,
  download_url text,
  sha256 text,
  message text,
  server_time timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_device public.osint_control_devices%rowtype;
  v_policy public.osint_control_release_policy%rowtype;
  v_now timestamptz := now();
  v_old_seen timestamptz;
begin
  insert into public.osint_control_release_policy (id)
  values ('global')
  on conflict (id) do nothing;

  select *
    into v_device
    from public.osint_control_devices
    where id = p_device_id
    for update;

  if not found then
    raise exception 'device_credentials_invalid' using errcode = 'P0001';
  end if;

  if v_device.device_secret_hash <> p_device_secret_hash or v_device.install_id <> p_install_id then
    insert into public.osint_control_events (event_type, device_id, reason)
      values ('device_check_in_denied', v_device.id, 'A check-in used invalid device credentials.');
    raise exception 'device_credentials_invalid' using errcode = 'P0001';
  end if;

  v_old_seen := v_device.last_seen_at;

  update public.osint_control_devices
    set label = left(coalesce(nullif(p_label, ''), label), 120),
        platform = nullif(left(coalesce(p_platform, ''), 120), ''),
        app_version = nullif(left(coalesce(p_app_version, ''), 40), ''),
        last_ip_hash = nullif(p_ip_hash, ''),
        last_user_agent_hash = nullif(p_user_agent_hash, ''),
        last_seen_at = v_now,
        updated_at = v_now
    where id = v_device.id
    returning * into v_device;

  if v_old_seen is null or v_old_seen < v_now - interval '1 hour' then
    insert into public.osint_control_events (event_type, actor, device_id, reason, metadata)
      values (
        'device_check_in',
        'public-check-in-api',
        v_device.id,
        'Device checked in.',
        jsonb_build_object('status', v_device.status, 'platform', v_device.platform, 'appVersion', v_device.app_version)
      );
  end if;

  select *
    into v_policy
    from public.osint_control_release_policy
    where id = 'global';

  return query select
    v_device.id,
    v_device.status,
    v_policy.service_status,
    v_policy.latest_version,
    v_policy.minimum_version,
    v_policy.download_url,
    v_policy.sha256,
    v_policy.message,
    v_now;
end;
$$;

revoke all on function osint_control_activate_device(text, text, text, text, text, text, text, text, text)
  from public, anon, authenticated;
revoke all on function osint_control_check_in(uuid, text, text, text, text, text, text, text)
  from public, anon, authenticated;

grant execute on function osint_control_activate_device(text, text, text, text, text, text, text, text, text)
  to service_role;
grant execute on function osint_control_check_in(uuid, text, text, text, text, text, text, text)
  to service_role;
