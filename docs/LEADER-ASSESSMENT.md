# Leader readiness assessment — build record and review request

Built 2026-08-13. Everything about the assessment lives here so it can be
handed to another reviewer (or a lawyer) in one piece.

**Live at:** `/leaders/readiness` — unlisted. Not in the nav, not in the
sitemap, `noindex, nofollow`. It is a link you send after a conversation has
started, not something people stumble into.

---

## 1. What this is, and what it is not

It is the honest conversation **before** the Leadership Covenant, not a
replacement for it. The covenant (`Christfields_Leadership_Covenant.pdf`) is
still walked through in person, given at least seven days before signing, and
prayed over (Covenant Section 15). This assessment decides whether that
walkthrough is worth booking.

Nothing is scored automatically. No applicant is accepted or rejected by the
form. The only automatic behavior is the four gates ending the form early, and
even then the person is pointed back toward the community rather than dismissed.

## 2. Structure

| Part | Type | Count | Behavior |
|---|---|---|---|
| Gates | Yes/No | 3 | A "no" ends the assessment immediately |
| Doctrine | Checkboxes | 8 | The fourth gate. "I cannot affirm all of these" ends it the same way |
| About | Fields | 4 + age | Three age bands; 13-or-younger ends it and stores nothing |
| Commitments | Yes/No | 19, or 20 under 18 | All must be answered; five are "not negotiable" |
| The walk | Free text | 5 | Short floors only — "nobody, honestly" has to be a valid answer |
| Scenarios | Free text | 7 | Behavioral; minimum lengths |

Source of truth: `lib/leaders/assessment.ts`.

**Four things gate this form**, matching the founder's spec: the three yes/no
questions and the doctrinal affirmation. The doctrinal step was originally only
able to disable the Continue button, which left someone who could not affirm an
item staring at a dead button with no way out; it now ends the form the way the
other three do, with its own closing words.

**Deliberate design decision:** the scoring rubric (Section 6 below) is NOT in
that file and never should be. Anything imported by the form is shipped to the
applicant's browser. Someone who can read what you are looking for can write it
back to you.

## 3. Every commitment traced to the covenant

| Assessment item | Covenant section |
|---|---|
| Follower of Christ (gate) | Section 2 — personal faith |
| Planted in a local church (gate) | Section 2 — church membership |
| Church 3×/month, serving 2×/month (commitment) | Section 2 — daily faith minimums |
| Named gatherings twice a week (gate) | Section 5 — role |
| The 8 doctrinal affirmations | Section 1 — doctrinal affirmation |
| Minor leaders serve under a screened adult | Section 14 — youth protection |
| Ministry content ownership and return of materials | Section 9 |
| Never alone with a minor | Section 14 — youth protection |
| Minor communication in group/parent channels | Section 14 |
| Report abuse to Colorado hotline immediately | Section 14 |
| Opposite-sex one-on-one boundaries | Section 3 — conduct |
| Pray daily, read Scripture daily | Section 2 |
| Co-leader, never alone; tell them early | Sections 5 and 6 |
| Submit to the Table; raise disagreement directly | Section 6 |
| Correction process; no exit to escape it | Section 7 |
| Confidentiality | Section 8 |
| Verified Scripture and content review | Section 4 |
| Life above reproach | Section 3 |
| Screening, and renewal of screening | Section 14 |
| Guardian details if under 18 | Sections 13 and 14 |

Items with no covenant section (accountability, private life matching public,
willingness to lead without a title, receiving a "not this season") are
character questions, not contractual terms. They are there to be read by a
person, not enforced.

**Two deliberate splits.** The church gate used to bundle "are you planted
somewhere" with "three times a month and serving twice." The covenant states
both figures as forward commitments ("I will attend...", "I will serve..."),
not as a test of this month, and bundling them stopped a faithful person who
had just moved cities at question two. Being planted is the gate; the schedule
is now a commitment, phrased the way the covenant phrases it.

**Sections still not represented:** 10 (online representation) and 11 (fixed
term, review, resignation by written notice). Both are procedural and are
covered properly in the walkthrough. Section 9 was the material omission — a
property clause is exactly the kind of thing people are surprised by at a
signing table — so it is asked here now.

## 4. Scripture used, and why

Quoted from the **World English Bible** (public domain), so this page carries
no licensing obligation. Where the covenant already cites a passage for a
commitment, the same passage is used here.

**Quoted exactly, including where WEB reads oddly.** Psalm 1:2 is "his delight
is in Yahweh's law," not "the law of the Lord" — the latter is KJV/NIV/ESV
wording. An audit found four passages that had drifted into other translations
or blended two references: Psalm 1:2 (twice), 2 Timothy 2:15, and Luke 15:4,
which had been rewritten with Matthew 18:12's construction under Luke's
reference. All four now match WEB. This page asks every applicant to verify
every Scripture they publish; quoting loosely here would refute the page.

Gates: Luke 6:46 · Hebrews 10:24-25 · Psalm 15:4
Added since: 1 Timothy 4:12 (minor under adult oversight) · 1 Chronicles 29:14
(Section 9) · Acts 5:29, shown beside Hebrews 13:17 on `c_submit_table` because
the covenant pairs them and the conscience exception was otherwise sitting under
a proof text pointing the other way
Doctrine: 2 Timothy 3:16 · Matthew 28:19 · John 1:14 · 1 Corinthians 15:3-4 ·
Ephesians 2:8-9 · Acts 1:11 · 1 Corinthians 12:27 · Titus 1:9
Commitments: Romans 12:17 · Ephesians 5:15-16 · Proverbs 24:11 · 1 Timothy 5:1-2 ·
1 Thessalonians 5:17 · Psalm 1:2 · Mark 6:7 · Hebrews 13:17 · Galatians 6:1 ·
Proverbs 11:13 · 2 Timothy 2:15 · 1 Timothy 3:2 · Luke 16:10 · Proverbs 27:17 ·
Luke 8:17 · Matthew 6:1 · James 4:10
Walk: Psalm 1:2 · James 5:16 · 2 Corinthians 12:9 · Jeremiah 17:9 · 1 Timothy 3:7
Scenarios: James 1:19 · Galatians 6:2 · Proverbs 27:12 · Matthew 18:15 ·
Luke 15:4 · Proverbs 12:15 · Matthew 11:28
Page and closings: Luke 14:28 · James 3:1 · Ecclesiastes 3:1 · Luke 16:10

## 5. Data

Stored in `leader_assessments` (migration `014_leader_assessments.sql`), with
the notification email as a secondary copy. Degrades gracefully: before the
migration is run, the email alone carries it.

Columns: name, email, phone, church, is_minor, guardian_name, guardian_email,
gates/doctrine/commitments/walk/scenarios (jsonb keyed by question id),
gate_passed (recomputed server-side, never trusted from the client), status
(new/reviewing/conversation/approved/declined), notes, emailed, created_at.

RLS is enabled deny-by-default, consistent with migrations 010-013. The app
reaches it only through the service-role key.

## 6. Rubric — what to look for when reading (keep out of the client bundle)

Not a score. These are the patterns worth noticing.

**The AirPods scenario.** Looking for: separating the behavior from the person;
addressing it privately rather than in front of the group; curiosity before
correction; following up afterward. Concerning: public shaming, treating it as
defiance to be won, ignoring it entirely, or making the evening about their own
authority.

**The disclosure scenario.** This one is close to disqualifying if handled
badly. Looking for: staying with them, not promising secrecy, naming that they
will need to involve others, contacting the Table and a parent, and knowing
that a fifteen-year-old talking about self-harm is an immediate escalation, not
a pastoral chat. Concerning: promising to keep it secret, handling it alone,
"praying about it" as the entire plan.

**The boundary scenario.** Looking for: warmth toward the person AND holding
the line; offering a same-sex leader or a second leader present; explaining the
rule as protection rather than suspicion. Concerning: making an exception
because the need is genuine — that is exactly the shape the rule exists for.

**The co-leader scenario.** Looking for Matthew 18 order: them first, directly,
privately, before the Table. Concerning: going straight to the founder, or
saying nothing.

**The drifting scenario.** Looking for persistence without harassment, and
pursuit that costs something. Concerning: one text and a shrug.

**The don't-know scenario.** Looking for "I don't know, let me find out."
Concerning: bluffing.

**The empty-week scenario.** Looking for honesty with the co-leader and showing
up anyway, or asking for help. Concerning: both "I would never feel that" and
"I would just not go."

**Across the walk answers:** does anyone else know them? Can they name a real
struggle? Is the reason for leading about people or about position?

**The minimums are floors against a blank box, not a standard.** They were
lowered after an audit pointed out that `w_accountable_who` tells people to say
plainly if nobody comes to mind, then refused "nobody, honestly" for being
sixteen characters. A short true answer is the point of the section. If a whole
set of answers is short, that is a thing to notice in the reading, not something
the form should have blocked.

**A "no" on a non-negotiable now shows in the subject line** and in a banner, and
every yes/no row renders the question rather than its id. Before this, a
submission that declined to report suspected child abuse arrived with the same
subject as a perfect one, and `c_report_abuse  No` sat visually identical to
`c_not_status  No` in a nineteen-row table. The single loudest signal the form
can produce was the hardest thing to see in it.

## 7. Review requests for whoever reads this next

Flagged honestly. I am not a lawyer and this needs one.

1. **Special-category data.** Responses contain religious belief, church
   membership, and voluntarily disclosed personal struggles. Under GDPR/UK GDPR
   that is special-category data; US law is looser but this is still sensitive.
   Check retention, access, and deletion-on-request handling.
2. **Minors submitting.** The covenant permits leaders under 18, so minors will
   submit this form. **The age question now has a floor: 13 or younger ends the
   form before a single personal question is asked and stores nothing.** That
   keeps this clear of COPPA and consistent with `app/privacy/page.tsx`, which
   states the services are for 13 and older — a form collecting free text from
   an eleven-year-old contradicted the site's own published policy. Fourteen is
   a judgment call, not a legal line: it is a year clear of the COPPA threshold
   and it matches a covenant written around a minor serving under a screened
   adult rather than around a child. **Founder decision if you want it lower.**
   The guardian is emailed automatically and immediately on submission
   (`guardianNoticeHtml`), and the applicant is told so before they answer
   anything personal. Still worth review: that address is self-reported and
   unverified, and notice-after-collection is not the verifiable prior consent
   COPPA would require if the floor were ever removed. There is no identity
   proofing here and there probably cannot be without making the form hostile;
   the in-person covenant walkthrough is the real check.
3. **The self-harm scenario.** It asks an applicant who may themselves be
   fifteen to describe handling a fifteen-year-old's self-harm disclosure, and
   two steps earlier asks them to name their own current struggle. **988 is now
   offered under both of those questions and again on the closing screen**
   (`CRISIS_LINE`); it shipped without any crisis resource at all, which was the
   worst thing this audit found. Still worth a second opinion on whether the
   scenario should be shown to under-18 applicants at all. If it stays, the
   resource line is mandatory, not optional.
4. **Screening is referenced, not implemented.** Covenant Section 14 requires a
   screening process. This form asks whether they consent to it. Background
   checks for volunteers working with minors are a separate legal requirement in
   most states and this form does not satisfy it.
5. **Statement of Faith does not exist.** Covenant Section 1 requires agreement
   with it and Appendix A is blank. The 8 doctrinal items here are the historic
   creedal core and could serve as its basis, but that is the founder's call and
   a real gap.
6. **Employment law.** The covenant states it is not an employment contract.
   Since this is a religious organization selecting ministry volunteers, the US
   religious-organization exemptions generally apply, but the question-set was
   deliberately kept free of disability, health, age (beyond the 18 threshold
   needed for consent), marital status, and national origin.
7. **Colorado specifics.** Covenant Section 13 already flags CRS 13-22-101 and
   13-22-107 for attorney review. The hotline number used here (1-844-264-5437)
   comes from the covenant; confirm it is current.

## 7b. The guardian notice, and the switches

When an under-18 applicant submits, their parent or guardian is emailed
immediately, before anyone reviews anything. They are told what their child has
stepped toward, what leading involves, that a co-signature will be needed, and
that they can reply to stop it.

**That email contains none of the answers, and this is the most important
decision on the page.** It was originally sent with them. A council caught what
that meant: the mail leaves in the same second a young person presses send,
before a human has read a word, and it told the parent *"if anything made us
think they were not safe, we would be calling you."* Nothing had been read. If
the parent is the reason a fifteen-year-old is struggling, her account of it
arrived in that house instantly, unreviewed, with a false assurance attached.

It also created the exact incentive the form should not create. A frightened
young person, told on screen that their answers go straight home, has a
one-click escape on the same screen: "18 or older." That defeats the guardian
notice, the minor-oversight commitment, and the reply-to protection all at once.
Every safeguard for minors hangs on a self-declared radio button, so the form
must never make lying about it the safer option.

**Each written answer still carries a switch, defaulted to shared.** Under every
walk and scenario answer, an under-18 applicant sees "Your parent may see this."
The switch decides what a person here may pass on **after reading it**. The
founder's own email carries a ready-to-forward block of exactly what the young
person left switched on, plus a **kept from parent** marker on anything held
back, because that choice is itself worth noticing and is usually the thing to
ask about gently in person.

The parent is not left guessing: they are told their child wrote answers, that
they chose question by question what may be shown, that nothing is attached
because nobody has read it yet, and that what they chose to share will follow.

Why default-on rather than default-off: the trust runs both directions. A parent
of a fifteen-year-old asking to lead should be able to see what they wrote, and
a young person should have to make a deliberate choice to hold something back
rather than a passive one.

Why the switch exists at all: the form asks what they are struggling with and
who holds them accountable. A young person who knows every word goes straight
home writes what sounds right instead of what is true. The switch buys honesty.

**Two things the form refuses to be vague about**, both stated on screen before
any personal question is asked:

1. A switch never hides anything from the Table. Everything written is read,
   because that is what the applicant is asking to be weighed.
2. A switch never overrides safety. If something suggests a young person is not
   safe, it is acted on.

**The wording of that second promise was wrong and has been fixed.** It said the
parent would be told. If a sixteen-year-old writes that the danger is at home,
that routes the disclosure straight to the source of the harm — and it is the
opposite of what `c_report_abuse` makes every applicant affirm two steps
earlier, which is that suspected abuse goes to the Colorado hotline or 911. It
also told a young person, before they wrote a word, that their parent is where a
safety disclosure lands, which is precisely the pressure that produces a
sanitised answer. Both the form and the guardian email now say the true thing:
we will not sit on it, we will get help, and depending on what it is that may
mean the parents and may mean the people whose job it is to keep them safe.

That promise is **operational, not automated**, and it always will be. But the
code now does one blunt thing to help: a keyword scan over what the applicant
wrote *about their own life* (never the scenarios, which are about other people
by design) prepends **READ TODAY** to the subject and a red banner to the body.
It is deliberately crude. A false positive costs reading a good application
sooner; a missed one costs exactly what it cost before. It is not triage and it
is not a substitute for reading them all. See `URGENT_TERMS` in
`app/leaders/readiness/actions.ts`.

A failed or rate-limited guardian notice now says so in the founder's email,
loudly, rather than in a `console.warn` nobody reads. `GUARDIAN_RATE_LIMIT` can
no longer sit below the per-applicant limit — it did, which meant a teenager
fixing a typo twice would silently switch off their own parent's notification
while still seeing "Thank you."

## 7d. The draft

Half an hour and twelve essay boxes lived in React state in one tab, with no
warning. A phone call, a dead battery, or a stray back-swipe took all of it,
including the answer about what someone is struggling with. That is a far more
likely way to hurt an applicant than anything in the scenarios.

Written answers now save to `localStorage` as they type and restore on return.
**Only the essays** — never name, email, phone, church, or guardian details — so
a draft on a shared family computer is not a readable dossier and can never be
the thing that tells a parent their child applied. It is erased the moment the
form is sent, the applicant is told it exists, and there is a button to erase it
on demand.

**Reply-to.** The founder notification used to set reply-to to the applicant's
own address, so the one-tap reply to a fifteen-year-old was a private adult-to-
minor email — the exact thing `c_minor_channels` and Covenant Section 14 forbid.
For an under-18 applicant it now replies to the guardian, and the email says so.

Server-side, visibility defaults to shared when a value is missing or malformed,
so a dropped field always errs toward the parent seeing it rather than toward
silence. Stored in `visibility` (migration 016) so the record shows exactly what
was sent.

The guardian is also told, in general terms, what their child was asked, that
the question list is not confidential and will be sent on request, that the
answers are kept, and that they can reply to have them deleted. None of that
discloses an answer. A parent being asked to co-sign a covenant should not have
to guess what their child was asked.

`guardian_emailed` means **accepted for delivery**, not delivered. A false is
unambiguous and worth acting on. A true is weaker than it looks: bounces arrive
asynchronously and there is no Resend webhook in this repo, so a mistyped
address still records true. Until such a route exists, the real confirmation
that a parent heard is the in-person walkthrough.

## 7c. Abuse surface

The page is unlisted and unauthenticated, and it sends mail from the ministry's
own domain to an address the caller typed. That is an outbound-email primitive,
and it was originally limited only by a bucket keyed on the applicant's own
email address — a field the caller picks and can rotate at will — with no
in-memory fallback, so on a deploy without migration 011 there was no limiting
at all.

Now: an IP bucket (5/hour) that no field rotation resets, the per-applicant
bucket (3/hour), a tighter per-guardian-address bucket (2/hour) because that is
the path that mails a stranger, an in-memory fallback on all three matching
`app/api/submit/route.ts`, and a honeypot field. The guardian notice is sent
**before** the founder notification, so an error on the founder path can no
longer skip the message that has a duty-of-care clock on it.

## 8. Files

```
app/leaders/readiness/page.tsx        the page (noindex, unlisted)
app/leaders/readiness/actions.ts      server action: validate, limit, store, notify
components/leaders/ReadinessForm.tsx  the form (one step at a time)
lib/leaders/assessment.ts             all questions + Scripture (no rubric)
lib/emails.ts                         leaderAssessmentHtml(), guardianNoticeHtml()
db/migrations/014_leader_assessments.sql
db/migrations/015_guardian_emailed.sql
db/migrations/016_assessment_visibility.sql
public/assets/leaders/covenant-path.webp
docs/LEADER-ASSESSMENT.md             this file
```

## 9. Toward the credential

The founder's longer aim is a leadership credential that transfers between
churches. Two things in this build are deliberate steps toward that:

- **Doctrine is creedal, not sectarian.** A credential another church honors
  can only rest on what the whole church confesses.
- **Every answer is retained and keyed by stable question id**, so a body of
  responses accumulates that can later be analyzed for what actually predicted
  a faithful leader. That evidence is what would make a certificate credible
  rather than decorative.

What is missing for a real credential: a Statement of Faith, a defined training
curriculum, an assessment of competence rather than only commitment, a renewal
period, and a verifiable record a third party could check.
