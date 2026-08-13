# Connect these

Everything the code is waiting on, with the exact block and where it goes.
Nothing here is urgent and nothing is broken while it waits: each item is
written to degrade gracefully until you connect it.

Last updated 2026-08-10.

---

## 1. Supabase → SQL Editor

**Where:** supabase.com/dashboard → your Christ Fields project → SQL Editor →
paste → Run. Success looks like "Success. No rows returned."

### 1a. Migration 013 — one gratitude and one examen per day  ⬅ NEW

Without this, a double tap can write two rows for the same day, and that day's
entry then stops loading for the member. The app already handles both states,
so this is a hardening step, not a fix you have to rush.

```sql
delete from gratitude_entries a
  using gratitude_entries b
 where a.clerk_user_id = b.clerk_user_id
   and a.entry_date    = b.entry_date
   and a.ctid          < b.ctid;

delete from reflections a
  using reflections b
 where a.clerk_user_id = b.clerk_user_id
   and a.entry_date    = b.entry_date
   and a.ctid          < b.ctid;

create unique index if not exists gratitude_entries_user_day_idx
  on gratitude_entries (clerk_user_id, entry_date);

create unique index if not exists reflections_user_day_idx
  on reflections (clerk_user_id, entry_date);

create index if not exists community_prayers_user_idx
  on community_prayers (clerk_user_id, created_at desc);
```

The last line is a speed index: the community count runs on every dashboard
load and that table was only indexed by date.

*(Migration 012, the durable form submissions table, is already done.)*

### 1b. Migration 014 — leader assessment responses  ✅ DONE

### 1c. Migration 015 — guardian notified flag  ⬅ NEW

One line. Records whether the parent of an under-18 applicant was actually
emailed, so a bounce is visible rather than assumed delivered. The notice sends
either way; this only records it.

```sql
alter table leader_assessments
  add column if not exists guardian_emailed boolean not null default false;

alter table leader_assessments
  add column if not exists visibility jsonb not null default '{}'::jsonb;
```

The second line records which answers an under-18 applicant chose to share with
their parent. Both features work without it; you would just lose the record of
the choice.

### 1d. Migration 017 — provenance and retention  ⬅ NEW

Two columns and a retention note. Cheap now, **impossible to backfill later**.
Nothing in the app reads them yet, so this is safe whenever.

```sql
alter table leader_assessments
  add column if not exists assessment_version text not null default '2026-08-13';

alter table leader_assessments
  add column if not exists outcome text;
```

`assessment_version` stamps which version of the questions someone answered —
the ids are stable but the wording is not, so without it the responses quietly
stop being comparable and there is no way to tell when. `outcome` is the one you
set by hand at twelve months: did they actually lead, and how did it go. The
existing `status` column records what you *decided*; nothing records what
*happened*, and a record of decisions can never tell you which decisions were
right. That is the difference between a credential and a certificate.

The full file also sets a retention period (three years, or service plus three)
as a table comment, which the covenant review asked for.

---

## 2. Netlify → Environment variables

**Where:** app.netlify.com → your christfields site → Site configuration →
Environment variables. Each variable has a **Key** box (the name) and a
**Value** box (the contents). Both of the rows below currently exist with the
contents typed into the *name* box, which is why they do nothing.

### 2a. Delete the two broken rows first

Find the two rows whose names are long strings starting with `org_...` and
`whsec_...`, and delete each with the ⋯ menu on the right. They do nothing
except print the secret into every build log.

### 2b. Add them properly

| Key (top box) | Value (bottom box) |
|---|---|
| `MAIN_COMMUNITY_ORG_ID` | `org_3EexE8Ynjxyz8pm2tCitG7iG4Yy` |
| `CLERK_WEBHOOK_SIGNING_SECRET` | the `whsec_...` from step 3b |

Then **Deploys → Trigger deploy → Deploy site**. Environment changes only take
effect on a fresh build.

### 2c. Optional tidy

`NVIDIA_API_KEY` has been unused since the verse AI was removed in June. Safe
to delete whenever.

---

## 3. Clerk → the Iron & Ember wiring

**Where:** dashboard.clerk.com → your Christ Fields app. Check the top of the
page says **Production**, not Development.

### 3a. The organization (already created)

`Iron and Ember` → `org_3EexE8Ynjxyz8pm2tCitG7iG4Yy`

### 3b. The webhook

1. Left sidebar → **Webhooks** → **Add endpoint**
2. Endpoint URL: `https://christfields2717.com/api/clerk-webhook`
3. Subscribe to exactly one event: **user.created**
4. Create it, then copy the **Signing secret** (`whsec_...`) straight into the
   Netlify value box in step 2b. Do not paste it into chat or a screenshot.

**What this turns on:** every new member is automatically added to Iron and
Ember, and the weekly check-in starts preferring their small group over the
main community. Until then both simply behave the way they do today.

**How to confirm it worked:** the endpoint currently answers `503`. Once both
env vars are set and a deploy has finished, it should answer `400` instead
(refusing an unsigned request). Ask me and I will check it from here.

---

## 4. Things only you can do (no code involved)

- **The Christ Fields CO test.** Say "Christ Fields CO, our Colorado" out loud
  at the next gathering. If the room picks it up, it goes in the member
  dashboard welcome. It never goes on the public site either way.
- **The five questions** (`B:\graceflow\GO-LIVE-WEEK.md`, step 3). Ask Iron &
  Ember, write the answers down verbatim. This is what unlocks the
  strip-the-metrics decision, which is deliberately parked until then.
- **The YouVersion note.** Fully drafted in `docs/youversion-application.md`.
- **Probely.** Mark the four triaged findings, re-run the scan.
- **hstspreload.org.** Check christfields2717.com is submitted.
