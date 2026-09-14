# Scripture audit workspace

The corpus's wording has been checked in full. The contextual and application review is in progress. No app Scripture content or selection input was changed by this audit.

Start with [the concern log](CONCERN-LOG.md), [the source register](SOURCES.md), and [the quotation-change table](QUOTATION-CHANGE-TABLE.md). `summary.json` reports the actual coverage. It deliberately keeps `stage5Ready: false` while the agreed complete review remains unfinished.

## Files

- `inventory.json`: all 522 original corpus records, stable original indices and tags, normalized references, source comparisons, occurrence locations, quotation candidates, broader claim candidates, file hashes, and explicit review status.
- `reviewed-passages.json`: source-based first reviews. Textual observations, historical reconstruction limits, and application are separate. These are not automatically approved publication copy.
- `manual-quotation-pairs.json`: quotations whose reference and text live in separate JSX nodes or HTML email strings; baseline locations were read manually.
- `chapters.json`: numbered chapter text from the pinned provider source, with source footnotes retained separately. This is a review cache only, not a runtime app dependency or an approved context boundary.
- `source/provenance.json`: bulk source URL, exact revision, retrieval time, checksum, and size.
- `source/eng-web.usfx.xml`: public-domain provider source snapshot. The generator extracts verse boundaries and excludes footnotes from quotation text while preserving them in the cache.
- `source/api-samples.json`: identifier-API checks, including the full single-chapter book Jude.

## Reproduce

Run `node scripts/audit-scripture.mjs` to rebuild the inventory from the local source snapshot without network access. Use `node scripts/audit-scripture.mjs --fetch-source` only for an explicit source download. The revision is pinned in the generator; changing it is a deliberate review decision.

The generator scans tracked authored `.ts`, `.tsx`, `.mdx`, and `.json` files under `app`, `components`, `content`, and `lib`, excluding tests and handling the corpus separately. It never reads secrets, databases, member-authored content, `docs/private`, or the GraceFlow repository. Reference and keyword extraction helps find candidate claims but is not proof that every possible allusion was interpreted. Manual review remains necessary.

The audit compares the corpus after whitespace normalization only. Quotation candidates additionally distinguish outer display quotation marks and verbatim excerpts. Neither comparison rewrites the app. Lowercasing, punctuation normalization, added ellipses, and translation harmonization are not used to declare exact matches.

## Baseline result

All 522 corpus entries match the pinned provider text. The 83 unbalanced-curly-quote flags and 38 terminal continuation-punctuation flags are therefore review flags on excerpts, not evidence of damaged transcription. The existing 366-day leap-year arithmetic is unrelated and remains valid.

The first contextual review covers 35 literary case records, including 39 corpus entries and additional public-only references. Most corpus context reviews remain pending. Treating a complete inventory or full chapter cache as a complete hermeneutic review would misrepresent the work.
