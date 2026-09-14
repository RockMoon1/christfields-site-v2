# Scripture source register

Checked 8 September 2026. These sources support the specific observations below; they do not certify the site's theology or license position.

| Source | What it establishes | Limits |
| --- | --- | --- |
| [Bible API documentation](https://bible-api.com/) | The `web` translation, precise `/data/TRANSLATION/BOOK/CHAPTER` interface, and provider's linked bulk source. | The API calls its text World English Bible without a release identifier. Current documentation limits use to 15 requests per 30 seconds and directs bulk downloads to its source repository. The old proposed 900 ms interval exceeds that stated rate. |
| [Pinned provider XML](https://github.com/seven1m/open-bibles/blob/7768dacf2653164dd036d14a2d3f877d925015d3/eng-web.usfx.xml) | Exact reproducible text used for the 522-entry comparison and numbered chapter cache. | This is a provider snapshot, not a claim that the latest eBible site has exactly the same text. A source match verifies wording, not application. |
| [Open Bibles register](https://github.com/seven1m/open-bibles) | Lists `eng-web.usfx.xml` as World English Bible, public domain. | Other files have their own translations and licensing; no other translation was bulk-downloaded. |
| [WEB Classic edition page](https://ebible.org/eng-web/) | Classic uses Yahweh and US spelling; distinguishes its other editions. | The Classic page alone does not establish that every historic provider snapshot is the current edition. |
| [WEB Updated edition page](https://ebible.org/engwebu/) | Updated uses LORD or GOD for the divine name. | Do not silently substitute it for the corpus. |
| [WEB terms](https://ebible.org/eng-web/copyright.htm) | The text is public domain; the World English Bible name is reserved for faithful copies rather than changed wording. | A paraphrase may communicate a similar idea while still being unsuitable for a verbatim WEB attribution. |
| [Biblica permissions](https://www.biblica.com/permissions/) | NIV use has attribution and use conditions; the page separately discusses app/website and AI uses. | The general verse-count allowance alone does not establish permission for this platform. No permission was requested or represented as granted. |
| [Crossway permissions](https://www.crossway.org/permissions/) | ESV use has quotation limits, attribution, publication, and other conditions. | Wording resemblance is not proof of the source edition or permission. Removing a reference does not settle permissions. |

The whole corpus matched the pinned provider source after whitespace normalization. Its edition is recorded conservatively as **World English Bible, Classic family, pinned provider snapshot**. A public label that additionally claims a precise stable-text year needs a comparison to that edition. The source checksum and retrieval date live in `source/provenance.json`.

`source/api-samples.json` records small identifier-API checks for Proverbs 16 and the whole single-chapter book of Jude. The bulk XML came from the provider's recommended source rather than hundreds of chapter API requests. The application never imports or fetches any of these review files at runtime.

The reviews cite the primary text for speaker, audience, argument, and explicit narrative setting. They deliberately do not manufacture dates, reconstructions, disputed authorship conclusions, or a scholarly consensus. Where an interpretation goes beyond the text, it is identified as an application and remains reviewable.
