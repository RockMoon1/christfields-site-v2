alter table public.activity_forms add column if not exists settings jsonb;
alter table public.activity_forms add column if not exists photo_version text;
alter table public.activity_forms add column if not exists updated_at timestamptz not null default now();
-- New events use their local end date in settings; retain the legacy timestamp.
alter table public.activity_forms alter column closes_at drop not null;
update public.activity_forms set settings='{"title":"November car camping","summary":"Winter is almost here, and ski season is starting! Help us find dates for car camping, walking through mountain towns, and time together. Tickets, discounts, costs and final arrangements will be confirmed separately.","tz":"America/Denver","start":"2026-11-01","end":"2026-11-30","email":"off","phone":"off","receipts":false,"moreInfo":false,"clothing":"","scripture":"","information":"","weather":false,"location":"","latitude":null,"longitude":null,"color":"gold","status":"planning"}'::jsonb where slug='november-2026-car-camping' and settings is null;
alter table public.activity_responses add column if not exists contact_email text not null default '';
alter table public.activity_responses add column if not exists contact_phone text not null default '';
alter table public.activity_responses add column if not exists follow_up_consent boolean not null default false;
alter table public.activity_responses add column if not exists prior_attendance text not null default 'unspecified' check (prior_attendance in ('first','returning','unspecified'));
alter table public.activity_responses add column if not exists attendance text not null default 'unknown' check(attendance in ('unknown','attended','no_show','cancelled'));
alter table public.activity_responses add column if not exists receipt_status text not null default 'not_requested' check(receipt_status in ('not_requested','pending','sent','failed','rate_limited'));
alter table public.activity_responses add column if not exists email_verified boolean not null default false;
alter table public.activity_responses add column if not exists is_test boolean not null default false;
-- Preserve the known synthetic response while excluding it from real metrics.
update public.activity_responses set is_test=true where name='TEST ONLY - CF E2E 20261104' and notes='SYNTHETIC VERIFICATION CF-E2E-20261104-01. Not a real attendee or availability response. Testing private storage and delivery to the organizer. Please disregard for planning.';
create table public.activity_form_photos(form_slug text primary key references public.activity_forms(slug),image_base64 text not null check(length(image_base64)<=400000));
create table public.activity_receipts(token_hash text primary key check(length(token_hash)=64),response_id uuid not null unique references public.activity_responses(id),expires_at timestamptz not null);
alter table public.activity_form_photos enable row level security;
alter table public.activity_receipts enable row level security;
revoke all on public.activity_form_photos,public.activity_receipts from public,anon,authenticated;
grant select,insert,update,delete on public.activity_form_photos,public.activity_receipts to service_role;

create function public.submit_activity_response_v2(p_slug text,p_id uuid,p_hash text,p_name text,p_interest text,p_available date[],p_unavailable date[],p_notes text,p_notice text,p_extra jsonb)
returns text language plpgsql security invoker set search_path='' as $$
declare f public.activity_forms; old_hash text; inserted uuid; today date; email text; phone text;
begin
 select * into f from public.activity_forms where slug=p_slug for share;
 if not found then return 'closed'; end if;
 select payload_hash into old_hash from public.activity_responses where id=p_id and form_slug=p_slug;
 if found then if old_hash=p_hash then return 'duplicate'; else return 'conflict'; end if; end if;
 if f.settings is null then return 'closed'; end if;
 today := (now() at time zone (f.settings->>'tz'))::date;
 if not f.enabled or f.settings->>'status' in ('completed','cancelled') or today>(f.settings->>'end')::date then return 'closed'; end if;
 if p_notice<>'2026-11-04-v2' or p_hash !~ '^[a-f0-9]{64}$' or cardinality(p_available)>62 or cardinality(p_unavailable)>62 or p_available&&p_unavailable or exists(select 1 from unnest(p_available||p_unavailable)d where d is null or d<today or d<(f.settings->>'start')::date or d>(f.settings->>'end')::date) then return 'invalid'; end if;
 email:=coalesce(p_extra->>'email','');phone:=coalesce(p_extra->>'phone','');
 if length(email)>254 or length(phone)>32 or (f.settings->>'email'='required' and email='') or (f.settings->>'phone'='required' and phone='') or (f.settings->>'email'='off' and email<>'') or (f.settings->>'phone'='off' and phone<>'') or ((p_extra->>'receiptRequested')::boolean and (email='' or not (f.settings->>'receipts')::boolean)) then return 'invalid'; end if;
 insert into public.activity_responses(id,form_slug,payload_hash,name,interest,available,unavailable,notes,notice_version,contact_email,contact_phone,follow_up_consent,prior_attendance,receipt_status)
 values(p_id,p_slug,p_hash,p_name,p_interest,p_available,p_unavailable,p_notes,p_notice,email,phone,coalesce((p_extra->>'followUp')::boolean,false),coalesce(p_extra->>'priorAttendance','unspecified'),case when (p_extra->>'receiptRequested')::boolean then 'pending' else 'not_requested' end)
 on conflict(id) do nothing returning id into inserted;
 if inserted is not null then return 'created';end if;
 select payload_hash into old_hash from public.activity_responses where id=p_id and form_slug=p_slug;
 if old_hash=p_hash then return 'duplicate';else return 'conflict';end if;
end;$$;
revoke all on function public.submit_activity_response_v2(text,uuid,text,text,text,date[],date[],text,text,jsonb) from public,anon,authenticated;
grant execute on function public.submit_activity_response_v2(text,uuid,text,text,text,date[],date[],text,text,jsonb) to service_role;
