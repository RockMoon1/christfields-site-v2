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
| Doctrine | Checkboxes | 8 | All must be affirmed to continue |
| About | Fields | 4 + age | Under-18 path collects guardian name and email |
| Commitments | Yes/No | 17 | All must be answered; four are marked "not negotiable" |
| The walk | Free text | 5 | Minimum lengths, honesty-oriented |
| Scenarios | Free text | 7 | Behavioral; minimum lengths |

Source of truth: `lib/leaders/assessment.ts`.

**Deliberate design decision:** the scoring rubric (Section 6 below) is NOT in
that file and never should be. Anything imported by the form is shipped to the
applicant's browser. Someone who can read what you are looking for can write it
back to you.

## 3. Every commitment traced to the covenant

| Assessment item | Covenant section |
|---|---|
| Follower of Christ (gate) | Section 2 — personal faith |
| Church 3×/month, serving 2×/month (gate) | Section 2 — daily faith minimums |
| Named gatherings twice a week (gate) | Section 5 — role |
| The 8 doctrinal affirmations | Section 1 — doctrinal affirmation |
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

## 4. Scripture used, and why

Quoted from the **World English Bible** (public domain), so this page carries
no licensing obligation. Where the covenant already cites a passage for a
commitment, the same passage is used here.

Gates: Luke 6:46 · Hebrews 10:24-25 · Psalm 15:4
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

## 7. Review requests for whoever reads this next

Flagged honestly. I am not a lawyer and this needs one.

1. **Special-category data.** Responses contain religious belief, church
   membership, and voluntarily disclosed personal struggles. Under GDPR/UK GDPR
   that is special-category data; US law is looser but this is still sensitive.
   Check retention, access, and deletion-on-request handling.
2. **Minors submitting.** The covenant permits leaders under 18, so minors will
   submit this form. That raises parental-consent questions (COPPA applies under
   13; state laws vary) and the guardian email currently is collected but not
   verified or contacted. **Recommend: email the guardian on submission.**
3. **The self-harm scenario.** It asks a minor applicant to describe handling a
   minor's self-harm disclosure. Pastorally reasonable, but worth a second
   opinion on whether it should be shown to under-18 applicants at all.
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

## 8. Files

```
app/leaders/readiness/page.tsx        the page (noindex, unlisted)
app/leaders/readiness/actions.ts      server action: validate, store, notify
components/leaders/ReadinessForm.tsx  the form (one step at a time)
lib/leaders/assessment.ts             all questions + Scripture (no rubric)
lib/emails.ts                         leaderAssessmentHtml()
db/migrations/014_leader_assessments.sql
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
