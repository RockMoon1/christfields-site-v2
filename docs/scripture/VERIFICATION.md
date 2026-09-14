# Verification at the Stage 1 checkpoint

8 September 2026. This verifies the audit artifacts, not a completed website or completed theological review.

- Parsed all 522 original corpus entries without duplicate references.
- Compared all 522 to the pinned bulk provider source: 522 exact matches after whitespace normalization, zero differences.
- Independently fetched two identifier-API chapters: Proverbs 16 (33 verses) and Jude 1 (25 verses). All 58 verse texts match the local parser output after whitespace normalization. Jude returns the whole 25-verse book.
- Preserved the corpus checksum: `9dcb283004a5514307b8d7f3b63954b9f5045cef3d0b6d4ac5b9e9eff688f3c1`.
- Confirmed 83 curly-quotation flags and 38 terminal comma, colon, or semicolon flags. No text was repaired.
- Rebuilt the inventory from the local cache after the presentation checkpoint, without fetching. It records 218 authored files, 164 reference occurrences, 112 quotation candidates including manual source pairings, and 203 broader claim candidates. The homepage's manual quotation location was rechecked. Newly added presentation primitives contain no Scripture quotations; fixture data is synthetic and is not a public quotation source.
- First context review: 35 records covering 39 corpus entries and additional public-only passages. **483 corpus entries still require contextual review.** The generated gate is false.
- Cached 335 relevant chapters once each. `chapters.json` is 1,606,128 bytes at this checkpoint, so the earlier 250 KB estimate is not supported. This is a review cache, with zero app imports; no delivered member payload size is claimed.

The script writes only this audit directory. There are no changes to the corpus, tags, calendar functions, matching logic, schema, routes, member data, or Scripture displays in this stage. No app build or browser test is presented as evidence of a theological review. References that are merely examples or comments remain labelled occurrences; semantic classification is still required.
