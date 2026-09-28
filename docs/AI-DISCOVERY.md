# Local community discovery

Implemented September 28, 2026. The intended audience is people looking for Christian community near Centennial, Parker and the surrounding south Denver area. Roughly 35 minutes from Centennial is an outreach preference, not a guaranteed journey time, venue or service boundary.

## Public information

- `/small-groups`: Iron and Ember, the outreach area, inquiry process and practical questions.
- `/finding-community`: Christian friendship and connection, with a clear boundary between community and clinical or crisis support.
- `/about`: the relationship between Christ Fields, FaithFlow, Iron and Ember and ScholarFlow.

These are visible, linked pages rendered on the server. Schema describes the same public information. We do not use bot-only text, cloaking, fake locations, fabricated ratings, unconfirmed events or duplicate city pages. Existing Organization and WebSite schema remains in the root layout. New pages add WebPage and BreadcrumbList descriptions, not a new local branch or church entity.

The homepage, FaithFlow and journal articles have canonical metadata. The sitemap includes the new routes and omits invented build-time update dates. Journal `updated` dates record significant actual editorial changes; `date` remains the original publication date. Historical enrollment articles link to current information without rewriting the original story.

## Content ownership

The founder or community lead should confirm capacity, any age requirements, costs, format, meeting details and what can be shared publicly. Until confirmed, the site invites an inquiry, not guaranteed placement or walk-in attendance. Update the public pages when those facts change. Do not publish private member or meeting information by default.

## After publishing

1. In Google Search Console and Bing Webmaster Tools, verify the domain and submit `https://christfields2717.com/sitemap.xml`. Inspect the new URLs. These account actions are separate from deploying code.
2. Evaluate Google Business Profile eligibility before creating a listing. A meeting at another organization's venue is not automatically an eligible location. Never invent an office or represent someone else's venue without authority.
3. Ask genuine local partners for accurate public references when appropriate. Do not buy fabricated mentions or reviews.
4. Establish a dated baseline and repeat the same prompts monthly in fresh conversations, recording assistant, web-search mode, geographic context, cited URLs, accuracy and whether Christ Fields was recommended. Repeat prompts to observe variability.
5. Measure suitable inquiries, response rate and actual introductions alongside indexing and citations. Do not claim a deployment or a single AI mention proves sustained discovery growth.

## Sources and limits

- [Google's AI optimization guidance](https://developers.google.com/search/docs/fundamentals/ai-optimization-guide)
- [Google spam policies](https://developers.google.com/search/docs/essentials/spam-policies)
- [Structured-data content rules](https://developers.google.com/search/docs/appearance/structured-data/sd-policies)
- [Sitemap date guidance](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap)
- [OpenAI crawler purposes](https://developers.openai.com/api/docs/bots)
- [Anthropic crawler purposes](https://support.claude.com/en/articles/8896518-does-anthropic-crawl-data-from-the-web-and-how-can-site-owners-block-the-crawler)
- [Google Business Profile eligibility](https://support.google.com/business/answer/13763036?hl=en)
- [988 Lifeline](https://988lifeline.org/)

No reviewed source guarantees recommendations, indexing or a ranking benefit from these changes. `robots.txt` already allows public crawling; search and training crawlers have distinct purposes. No new `llms.txt` or paid AI-discovery service is required for this implementation. No authenticated analytics or directory accounts were audited or changed.
