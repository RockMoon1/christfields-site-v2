# Christ Fields — Master Brand Brief (for Instagram content)

> Compiled 2026-06-23 from a top-to-bottom read of the live codebase and the founder's journal.
> Quoted copy is verbatim. This is the reference the content effort runs on. Do not invent facts beyond what is here.

---

## 1. What Christ Fields is

The company's own words (site metadata):
> "Christ Fields is a technology company rooted in Christian faith. Building tools and communities for people who want to live and work with wisdom, integrity, and faithfulness."

Plainer, on the homepage (BentoGrid):
> "Christ Fields is an invite-only Christian community, with the faith and study tools to walk it out together."

It is one company, many "fields": **FaithFlow** (in-person community + a member/leader dashboard), **ScholarFlow** (a shelf of faith + study apps, currently GraceFlow and LearnFlow), **the Journal**, and **OSINT & Trace** (in development, software to help find missing people). The site is the front of house for the whole ecosystem. Founder line on the homepage: "Started and built by Lisandro Pellow."

The heart of the brand (founder's journal):
> "Christ Fields is not trying to be a tech company that happens to be Christian. It is trying to be a Christian household that happens to build tools."
> "The difference is small. The difference is everything."

Everything downstream (the slowness, the invite-only gate, the refusal of vanity metrics, the candlelit look) flows from "a Christian household that happens to build tools."

---

## 2. Mission and north-star convictions

Mission (Vision section, "Built on faith. Grounded in truth."):
> "We build at the meeting point of faith and technology: tools meant to genuinely serve people and point them toward what is good, not to distract and diminish."
> "It is for people who want more than another app. People who want to grow in faithfulness, think clearly, and live with real integrity, because we become wiser and more faithful when we walk alongside each other with honesty."

Anchor verse: **Proverbs 27:17** — "As iron sharpens iron, so one person sharpens another." It is the slogan, the H1 of the site, the 27:17 in the domain (christfields2717.com) and the inbox (proverbs@christfields2717.com), and the root of the first group's name (Iron and Ember).

Convictions, in priority order:
1. **Faithfulness over growth and metrics.** "Faithfulness is the goal. Not growth. Not hype. Not metrics." The StatsBand uses honest figures, never vanity counts: 100% "Known and prayed for by name" / 4 seasons of growth / ∞ "Mercies, new every morning" / 27:17 "The proverb we are built on."
2. **Invite-only on purpose.** No public self-signup exists in the code. The only public action is the "Join the Journey" waitlist/contact form.
3. **Scripture as the ground, not the backdrop.** "Scripture is opened. Not as a backdrop. As the actual ground."
4. **Grace over pressure, faithfulness over perfection.** "Built on grace, not pressure."

### The three postures (the strongest single narrative)
> "ScholarFlow is for the work that happens behind closed doors. Time, distraction, discipline. The unseen hours."
> "FaithFlow is for the work that requires another human in the room. Accountability, friendship, study, prayer. The seen hours."
> "OSINT & Trace is for the work that exists to find people who have been lost. The hours nobody asked us to give."
> "These are not products. They are postures."

Note: there are two framings and they do not contradict. The **three postures** = the company's three fields of work. The **five practices** = what a personal walk inside FaithFlow is made of: Presence, Honesty, Scripture, Prayer, Sharpening ("Faithfulness, not perfection."). Use postures for company-level story, practices for the personal/discipleship angle.

Five core values (Values, "What We Stand On"): **Faith, Discipline, Wisdom, Growth, Technology.** "Technology is a tool, nothing more. Used with wisdom and honest intent, it can serve people well. Used without either, it becomes a source of harm."

---

## 3. The product ecosystem

These are NOT all separate apps. Several live inside others.

| Product | What it is | Where it lives | Posture | Access |
|---|---|---|---|---|
| Christ Fields (parent) | The company + platform, the front of house | this repo, Next.js 15 → Netlify → christfields2717.com | all three | brand home |
| FaithFlow (public) | In-person, Scripture-rooted small-group framework | inside the site (app/faithflow) | seen hours | invite-only, NOT enrolling |
| FaithFlow dashboard ("Iron & Ember") | Logged-in member companion + leader/shepherd view | inside the site (app/dashboard), Clerk-gated | seen hours | members/leaders only |
| ScholarFlow | A category/shelf, not one app | inside the site (app/scholarflow) | unseen hours | the one open door, free to start |
| GraceFlow | Free installable faith PWA: a verse for your moment, in context, + reflection + prayer | separate repo B:\graceflow → graceflows.netlify.app | unseen hours | LIVE & free; GraceFlow+ from $6.99/mo |
| LearnFlow | Deep-study tier inside GraceFlow (Greek/Hebrew, Strong's, lexicon) | inside the GraceFlow repo, not its own app | unseen hours | LIVE, from $11.99/mo or $89.99/yr |
| The Journal | Honest long-form writing, "Notes from the work" | inside the site (content/journal) | reflective heartbeat | public, 5 posts |
| OSINT & Trace | Software to help find missing people | referenced only, no shipped product | service | in development |

Containment facts: FaithFlow + ScholarFlow + Journal + Dashboard all live INSIDE this website. LearnFlow lives INSIDE GraceFlow. GraceFlow (with LearnFlow) is the only standalone app, deployed separately. Rule: **link, don't rebuild** (always point to graceflows.netlify.app). A product called ScrollFlow is paused, do not feature it.

---

## 4. FaithFlow in depth

Defining line (stated twice on the site):
> "FaithFlow is not an app. It is not a brand or an online group. FaithFlow is the Christ Fields community framework for real people walking together in Christ."

Built on one truth: "you do not grow alone." "Not digital. Not transactional." The one real group is **Iron and Ember**, in Colorado, in person, the model for future groups. Gate: "Iron and Ember is not currently open for public enrollment. If you would like to be considered for a future group, reach out below."

The "Get Involved" form has four interest tracks (community / future group / help start a group / just learn more), each with a tailored follow-up. Leadership is "service, not status."

### The Iron & Ember dashboard (back of house)
The most distinctive, screenshot-worthy material:
- **In-person is the gate, not a feature.** A hidden journey engine (seed → sprout → roots → fruit, never named to the member) unlocks depth only after a leader confirms real in-person attendance. "The app cannot hand you the deep thing; the gathering does."
- **Starts almost empty on purpose.** "This is the whole space, for now. We keep it simple on purpose."
- **No vanity metrics anywhere.** No leaderboards, streaks, likes, or ranking. "Cooperative, not competitive. No likes, no ranking, no comparison." Mood scale has "No red, no 'bad'." Reflection ends "in grace, never a score."
- **Surrender over self-improvement.** "The point is surrender, not self-improvement."

Key member features: **Today** (the anti-streak: "That is enough for today. Well done. Rest in what he has already done. There is nothing to keep up with here."), a 3D vitality orb, a private prayer wall + a shared community wall ("We carry each other," Galatians 6:2), attendance check-in ("I was there"), Reflect (mood / gratitude / Examen / Reframe), Scripture, a once-only sacred stage-crossing animation, and a founder welcome ("I am Lisandro. I built this for people I actually know... Come exactly as you are.").

Leader privacy model (a genuine differentiator, enforced at the data layer): leaders see ONLY metrics and relational health (vitality, mood trend, rhythm, "needs a check-in"), never the private words. "These are the only prayers visible. [Name] chose to share them." "Let this be a starting point for prayer, not a report card."

Note: the devotional→GraceFlow / study→LearnFlow hand-off is a website/storefront message only. There are currently no GraceFlow/LearnFlow links inside the dashboard app itself, so do not imply a member taps from the dashboard into GraceFlow.

---

## 5. ScholarFlow in depth

A category, not a product:
> "ScholarFlow is not one app. It is the shelf where our faith and study tools live."
> "Think of it like an aisle in a store."

Two apps on the shelf today (plus an empty "More on the way" slot):
- **GraceFlow** ("Live now") — "Scripture for whatever you are facing." Installs on your phone, meets you in the moment with a real verse in context + a short reflection + a prayer. Works offline. Free; GraceFlow+ from $6.99/mo. Links to graceflows.netlify.app.
- **LearnFlow** ("Live now") — "Go deep. The original languages, one tap away." The deep-study tier inside GraceFlow: tap-a-word Greek/Hebrew, Strong's, lexicon, cross-references, audio. From $11.99/mo or $89.99/yr.

One-line contrast: GraceFlow brings the right verse to your moment; LearnFlow takes you into that verse at the source. Posture: the unseen hours (focus, time, discipline).

Two consistency flags for the team: the /scholarflow-resources page still says "ScholarFlow is coming" while the storefront says two tools are "live now" (always lead with "live now"); and /scholarflow is missing from the sitemap (an SEO fix, not a content issue).

---

## 6. Brand voice and messaging

Rules:
- Plain, honest, unimpressive on purpose. Refuses hype.
- Antithesis is the spine: "X is not... it is...". Say what something is NOT first.
- Short, declarative sentences and fragments. "Slowly. On purpose."
- Calm and anti-urgency. "No rush, no performance." Resists FOMO.
- Reverent but warm. Lowercase "him/he" for God in devotional copy.
- Scripture is a set-apart moment, never a hashtag, and always accurate to source (World English Bible wording).
- Ends on invitation, not a hard CTA. "Send a real message."

Hard rules, do not break:
- **NO EM DASHES in user-facing copy** (README + CLAUDE.md rule). Use periods, commas, or restructure.
- No vanity metrics, ever. No fabricated counts.
- Be honest about access/status. Never "sign up now" for FaithFlow. Never imply OSINT & Trace is usable today.
- Never name the Colorado organization or the group's members.
- Verse text stays real and in context.

### Quotable line bank (verbatim)
1. "As iron sharpens iron, so one person sharpens another." (Proverbs 27:17)
2. "Christ Fields is not trying to be a tech company that happens to be Christian. It is trying to be a Christian household that happens to build tools."
3. "The difference is small. The difference is everything."
4. "These are not products. They are postures."
5. "We are slow on purpose. We are private on purpose."
6. "If we built fast we would build cheap."
7. "We will not write to be impressive. We will write to be true."
8. "A community is the thing you go home to."
9. "Faithfulness is the goal. Not growth. Not hype. Not metrics."
10. "Permission to ask you the hard question on Wednesday afternoon, not just Sunday morning."
11. "Faithfulness is a long pattern, not a moment."
12. "You cannot make someone want this. You can only leave the door open."
13. "The point was never the activity. The activity was the reason for the friendship to keep meeting."
14. "Most websites animate to impress you. We animate to tell you something."
15. "A page that is alive the way a room with a fire in it is alive."
16. "Plain files outlive platforms."
17. "We post here when something is real, not when something is launching."
18. "You do not grow alone."
19. "This is real community. Not digital. Not transactional."
20. "There is grace for the very first day, and the next one too."
21. "That is enough for today. Well done. Rest in what he has already done. There is nothing to keep up with here."
22. "Come exactly as you are."
23. "Leadership in FaithFlow is service, not status."

Daily-rhythm micro-lines (good for a series, DayScroll): "Open the Word first." / "Hand off the worry." / "Come and rest." / "Sharpen someone." / "Name the good." / "Look back with him." / "Iron does not sharpen itself."

Scripture already used on the site (safe, source-accurate): Proverbs 27:17, Psalm 46:10 "Be still, and know," Matthew 11:28 "Come to me, and rest," Lamentations 3:23 "His mercies are new every morning," Psalm 119:105 "a lamp to my feet," Galatians 6:2 "Bear one another's burdens," Ecclesiastes 4:9 "Two are better than one," Habakkuk 2:2 "Write the vision; make it plain," Proverbs 16:3 "Commit your work to the Lord," Proverbs 4:7 "Get wisdom," James 1:5, Ecclesiastes 10:10 "Skill brings success."

---

## 7. Visual and motion identity

One line: near-black sanctuary (#060908), warm gold flame (#c9a548), light editorial Cormorant serif, ivory text. Reverent, premium, candlelit, quiet. Gold is light, not paint.

### Color palette (exact hex, from globals.css)
Backgrounds (never pure black):
- `#060908` near-black, THE primary background
- `#0c110e` black-2 (cards), `#131a16` / `#1a221d` raised panels

Gold (signature accent, use sparingly):
- `#c9a548` gold (primary), `#e4c97a` light gold/cream (one emphasized word per headline), `#7a6228` antique gold

Emerald (faith/growth, supporting):
- `#1b4332` deep, `#2d6a4f` emerald, `#5cab7d` bright (status text only)

Text (ivory, never pure white):
- `#f0f2ee` ivory, `#c4ccca` dim ivory (body), `#8a9a92` silver-sage (captions)

Ember glow (flame/light graphics only, never a flat fill): `#ffd700 → #ffb830 → #ff8000 → #ff6400`, hot core `#fff4d2`.
Hairlines are always translucent: gold `rgba(201,165,72,0.14)`.

### Typography
- **Cormorant Garamond** for display/headlines/scripture/wordmark. Set Light (300) at large sizes, tight leading, italic for verses. Carries about 80% of the brand. Never bold.
- **Inter** for body/labels/buttons, weights 300-500, line-height 1.65.
- The "Christ Fields label" treatment: small, ALL CAPS, gold `#c9a548`, letter-spacing 0.18-0.24em.
- The gold-em shimmer: exactly one key word per headline in light gold `#e4c97a`.

### Aesthetic in words
Dark, warm, reverent, editorial. Premium but quiet. Candlelit, not flashy. A dim sanctuary lit by a single flame. Light is treated like fire: gold and ember add light to the dark rather than filling shapes. Generous negative space.

Brand symbol: a cross inside a gold flame on near-black (flame gradient `#f6df8f → #c9a548`, hot core `#fff4d2`, off-white cross `#f7f3ea`). Never drop the cross. Never render the flame as a flat solid shape. Pair the mark with "Iron sharpens iron. Proverbs 27:17."

### Motion language
Slow, deliberate, weighted, reverent. One easing curve everywhere: `cubic-bezier(0.22, 1, 0.36, 1)`. Signature motions: text rising word-by-word out of a mask, clip-path unveils, soft rise + fade, embers drifting upward, gold light that grows and fades rather than slides, film-grain at about 6%. Nothing snaps or bounces. "We animate to tell you something."

---

## 8. Instagram content brief

### (a) Positioning and bio
Run a single Christ Fields account, the public low-hype heartbeat of the work, mirroring the Journal. Not a per-product growth machine.

Bio direction (trim to fit, no em dashes, honest about status):
> Christ Fields. A Christian household that happens to build tools.
> Iron sharpens iron. Proverbs 27:17
> In-person community + faith & study tools. Built slowly, on purpose.
> GraceFlow, free → graceflows.netlify.app

Link in bio points to the one open door: GraceFlow (live, free, shareable). Never lead the bio with a FaithFlow "join" CTA.

### (b) Content pillars (7)
1. Iron sharpens iron (the anchor verse, community, "you do not grow alone").
2. The unseen hours (ScholarFlow / discipline; spotlight GraceFlow + LearnFlow).
3. The seen hours (FaithFlow; the Iron & Ember story, told as story, never a "sign up" pitch).
4. Notes from the work (the Journal; honest build notes, anti-hype).
5. Faithfulness over hype (no ads, no paywall on the core, invite-only, "no" as a feature).
6. A day walked with him (daily-rhythm devotional micro-series).
7. Scripture, in context (verse cards done the brand way, real WEB text, never proof-texted).
Optional 8th, sparing and labeled honestly: Service / OSINT & Trace as a mission beat (in development).

### (c) Visual style guide
- Palette: every post on `#060908`. Ivory text `#f0f2ee`. Gold `#c9a548` as a precise accent only (a rule, an eyebrow, one word, one CTA). Emerald as the supporting tone. Ember spectrum only for glow.
- Fonts: Cormorant Garamond Light for headlines/quotes/scripture (italic for verses), Inter for body. ALL-CAPS gold labels at 0.18-0.24em tracking. One word per headline in cream gold `#e4c97a`.
- Mood: dark candlelit sanctuary, one warm flame, soft gold radial glow behind the focal point, thin gold hairline frame, optional rising embers, about 6% grain. Generous negative space.
- Motion (Reels): slow eases only `cubic-bezier(0.22, 1, 0.36, 1)`, text rising out of a mask, gold light growing/fading, embers drifting up.
- DO: pair the flame-cross mark with Proverbs 27:17; treat gold/ember as glow that adds light; let the dark breathe; quiet over loud.
- DON'T: pure black/white; flood gold; neon or busy gradients; bold/playful fonts; fast bouncy motion; drop the cross; render the flame flat.

### (d) First-post ideas (14)
1. Brand-essence opener: flame-cross mark, "Iron sharpens iron." Caption: "A Christian household that happens to build tools. The difference is small. The difference is everything."
2. "These are not products. They are postures." 3-slide carousel: unseen / seen / the hours nobody asked us to give.
3. Iron & Ember origin-story carousel (highest value): the spark → an open door, no pressure → Scripture as the actual ground → life together (climbing, camping) → "you can only leave the door open" → "we are not in a hurry." Never name the org or people.
4. "A community is the thing you go home to." Antithesis carousel: what community is NOT vs what it IS.
5. GraceFlow spotlight: "Scripture for whatever you are facing." Live, free, offline. CTA: graceflows.netlify.app. (The primary conversion post.)
6. LearnFlow spotlight: "Go deep. The original languages, one tap away." The paid deep-study tier inside GraceFlow; pricing belongs here, not in the GraceFlow post.
7. The anti-streak: screen-record the "That is enough for today. Well done." stop screen. Caption: "What if your faith app told you to stop?"
8. Leader-privacy values post: "These are the only prayers visible. They chose to share them." A shepherding tool that brags about how little the leader can see.
9. "A day walked with him" series launch: Open the Word first / Come and rest / Name the good.
10. Scripture-in-context card: "Be still, and know." (Psalm 46:10) or "His mercies are new every morning." (Lamentations 3:23), done the brand way.
11. Journal voice / behind-the-scenes: "We post here when something is real, not when something is launching." + "Plain files outlive platforms." Why the account is quiet on purpose.
12. "Most websites animate to impress you. We animate to tell you something." A short Reel of one slow masked text reveal with drifting embers; the motion is the message.
13. ScholarFlow = the shelf: "It is a category. Think of it like an aisle in a store." Show GraceFlow + LearnFlow + an empty "More on the way" slot.
14. Founder welcome: quiet Reel of "I built this for people I actually know... Come exactly as you are." Anchored by Matthew 11:28.

### (e) Off-brand guardrails
- No hype/hustle energy, countdowns, or exclamation-stacking. Slow on purpose.
- No vanity metrics or follower-milestone celebrations. Honest figures only.
- No growth-hacking framing. "No" is a feature.
- No em dashes in copy.
- No false openness: never "sign up now" for FaithFlow; never imply OSINT & Trace is usable; never imply GraceFlow/LearnFlow are part of the website (they are a separate live app you link to); never promote ScrollFlow.
- No proof-texting or invented verses.
- Never name the Colorado organization or Iron & Ember members.
- No pure black/white, flooded gold, or neon.

---

Contact: proverbs@christfields2717.com. Domain: christfields2717.com. Live app to link: graceflows.netlify.app. Founder voice: Lisandro Pellow.
