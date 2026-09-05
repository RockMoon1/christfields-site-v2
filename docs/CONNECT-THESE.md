# Connect these

Everything the code is waiting on, with the exact block and where it goes.
Nothing here is urgent and nothing is broken while it waits: each item is
written to degrade gracefully until you connect it.

Last updated 2026-08-10.

---

## 1. Supabase → SQL Editor

**Where:** supabase.com/dashboard → your Christ Fields project → SQL Editor →
paste → Run. Success looks like "Success. No rows returned."

### 1a. Migration 018 — the schedule manager  ⬅ RUN BEFORE DEPLOYING THE REWRITE

The dashboard rewrite (2026-09) reads new columns and tables. Paste the whole
of `db/migrations/018_schedule_manager.sql` and run it once. It is additive and
safe to re-run. It also turns on RLS for every surviving table, replacing 010.

**Do NOT run the old 013_reflect_one_per_day.sql.** Its tables are dropped by
019 (below), so it would only index doomed tables.

### 1b. Migration 019 — drop the teaching tables  ⬅ RUN LAST, BY HAND, A WEEK AFTER LAUNCH

`db/migrations/019_drop_teaching.sql` removes rhythms, prayer journal, reflect,
scripture memory, progress, journey state and weekly attendance. It keeps the
prayer wall. Irreversible; you approved it on 2026-09-02, and the file header
quotes that. Run it only after the new dashboard has been live and checked for
a week, and after `npm run check:tables` passes.

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

### 1e. Migration 020 — Phase 4 (Scripture on posts, quiet question, rhythm)  ✅ DONE 2026-09-04

Supabase → SQL Editor → New query → paste `db/migrations/020_more_into_it.sql` →
Run. Additive and safe to re-run. The Phase 4 code writes the new event
columns on every post, so this must be in before that deploy goes live; the
Netlify build itself does not touch the database.

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

### 2d. The schedule manager (Phase 1)  ✅ DONE 2026-09-03

`NEXT_PUBLIC_APP_URL`, `APP_TOKEN_SECRET`, `CALENDAR_TOKEN_KEY`, `CRON_SECRET`.
The three secrets are random strings generated on the founder's computer, not
issued by any service. Values live only in `.env.local` and the local-only
sheet `docs/private/NETLIFY-ENV-2026-09.md`.

### 2e. Phone alerts (Phase 2)  ⬅ ADD BEFORE THE PHASE 2 DEPLOY

Three more rows, same way, values on the same private sheet:

| Key (top box) | Value (bottom box) |
|---|---|
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | the long string on the sheet |
| `VAPID_PRIVATE_KEY` | the long string on the sheet |
| `VAPID_SUBJECT` | `mailto:proverbs@christfields2717.com` |

These are the keys a phone uses to trust that a push came from us. Also
generated locally; nothing to sign up for. Until they are set, the app shows
"Phone alerts are not switched on for this site yet" and emails still work.

### 2f. The hourly tick (nothing to click)

`netlify/functions/tick.mts` is a Netlify Scheduled Function. After the deploy
it appears under **Functions** in the Netlify site and runs once an hour on its
own, using `CRON_SECRET` from the environment. It sends the day-before and
two-hour reminders, the 7am leader brief, refreshes pasted calendar links, and
keeps Supabase awake. To watch it: Functions → tick → recent logs.

Optional backstop: GitHub → the repo → Settings → Secrets and variables →
Actions → **New repository secret**, name `CRON_SECRET`, value the same string.
Then `.github/workflows/keepalive.yml` can also run the tick weekly. Without it
the workflow still pings the database, which is what matters.

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

## 5. Google Cloud → the Calendar connect (Phase 3)

The code is live but hidden until two rows exist in Netlify. Everything below
happens at **console.cloud.google.com**, signed in with the Google account you
want to own the project (your christfields2717.com Workspace account if you
have one, otherwise your Gmail). About 25 minutes, then a wait of 3 to 5
business days for Google's review.

### 5a. Project and API

1. Top bar → project picker → **New project** → name `Christ Fields` → Create,
   then select it.
2. Left menu → **APIs & Services → Library** → search **Google Calendar API** →
   **Enable**.

### 5b. The consent screen (what members see when they tap Connect)

1. **APIs & Services → OAuth consent screen** (Google now calls this
   **Google Auth Platform**). Choose **External** if asked.
2. **Branding:** App name `Christ Fields`; user support email your address;
   app logo `public/assets/logo.png` from this repo; **App home page**
   `https://christfields2717.com`; **Privacy policy**
   `https://christfields2717.com/privacy`; **Terms**
   `https://christfields2717.com/terms`; **Authorized domain**
   `christfields2717.com`; developer contact your address. Save.
3. **Data access → Add or remove scopes** → paste these two, exactly, one per
   line in the "Manually add scopes" box → Add to table → Update → Save:

   ```
   https://www.googleapis.com/auth/calendar.app.created
   https://www.googleapis.com/auth/calendar.freebusy
   ```

   Do NOT add `calendar`, `calendar.readonly`, or `calendar.events`. The two
   above are the narrowest that exist: one can only touch a calendar this app
   creates; the other returns free or busy and never a title.
4. **Audience → Publishing status → Publish app** so it says **In production**.
   Leaving it in Testing makes every member's connection expire after 7 days.

### 5c. The client (the two rows for Netlify)

1. **Clients → Create client** → Application type **Web application** → name
   `Christ Fields site`.
2. **Authorized redirect URIs** → add both:

   ```
   https://christfields2717.com/api/google/callback
   http://localhost:3000/api/google/callback
   ```

3. Create. Copy the **Client ID** and **Client secret** straight into Netlify
   (Site configuration → Environment variables), same way as before:

   | Key (top box) | Value (bottom box) |
   |---|---|
   | `GOOGLE_CLIENT_ID` | the long string ending in `.apps.googleusercontent.com` |
   | `GOOGLE_CLIENT_SECRET` | the `GOCSPX-...` string |

   Then **Deploys → Trigger deploy**. Add the same two lines to `.env.local`
   for testing here. Never paste them into chat or a screenshot.

### 5d. Verification (removes the "Google hasn't verified this app" screen)

Until Google reviews the app, members see a warning page with a small
**Advanced → Go to christfields2717.com (unsafe)** link; it works, but it is
ugly, and the app is capped at 100 connected people. To clear it:

1. **Search Console** (search.google.com/search-console) → add property
   `christfields2717.com` → verify by DNS record (Netlify DNS → add the TXT
   record Google gives you).
2. Record a short unlisted YouTube video (phone screen recording is fine):
   sign in, You page, tap **Connect Google Calendar**, show the Google consent
   screen with the app name, allow, show the Christ Fields calendar appear in
   Google Calendar. Then the same for **Share free or busy**, ending on the
   leader's "When to gather" board showing only counts of free people.
3. **Google Auth Platform → Verification Center → Prepare for verification**
   → submit. When it asks why each scope is needed, use these:

   > **calendar.app.created:** Christ Fields is a small church community
   > scheduling app. When a member taps "Put our events on your Google
   > Calendar", we create one secondary calendar named "Christ Fields" in their
   > account and add, update, or remove only the group events on that calendar.
   > We never read or write any other calendar. This is the narrowest scope
   > that allows creating a calendar and managing events on it.

   > **calendar.freebusy:** When a member taps "Help your leader pick a time",
   > we query free/busy for their primary calendar for the next 28 days and
   > store only whether a morning, afternoon, or evening is busy. Group leaders
   > see counts of free members and, on the three best times, first names of
   > those who are free. No event titles, locations, or attendees are ever
   > received or stored. This is the narrowest scope that exposes availability.

4. Reply to Google's emails promptly; they usually ask one clarifying question.
   Typical turnaround is 3 to 5 business days.

**Never** add Calendar scopes to the Clerk → Google sign-in connection. Clerk
resets extra scopes on each sign-in and does not refresh tokens; the connect
built here uses this project's own client on purpose.

---

## 4. Things only you can do (no code involved)

- **The Christ Fields CO test.** Say "Christ Fields CO, our Colorado" out loud
  at the next gathering. If the room picks it up, it goes in the member
  dashboard welcome. It never goes on the public site either way.
- **The five questions** (`B:\graceflow\GO-LIVE-WEEK.md`, step 3). Ask Iron &
  Ember, write the answers down verbatim. This is what unlocks the
  strip-the-metrics decision, which is deliberately parked until then.
- **Probely.** Mark the four triaged findings, re-run the scan.
- **hstspreload.org.** Check christfields2717.com is submitted.
- **Once a month: is keepalive still green?** GitHub → Actions → keepalive.
  GitHub switches scheduled workflows off after 60 days with no pushes; one
  click on "Run workflow" turns it back on.
