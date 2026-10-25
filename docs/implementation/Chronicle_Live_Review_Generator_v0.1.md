# Chronicle Live Review Generator v0.1

## Status and boundary

`src/lib/runtime/reviews.ts` is a deterministic, pure procedural review
generator. It implements the pending 2026-10-25 commentary architecture as an
isolated, tested Kernel; it does not change the locked Fan/Cheki price tiers,
Performance outcome, Finance ledger, Calendar, UI, or save schema.

The governing revision remains pending reconciliation with v0.10 and the
Implementation Pack. Therefore this Kernel is not yet called by
`resolveLive()` and does not claim that historical reports are persisted.
That integration must add a migration-safe report field and preserve the
already-settled event as the only outcome source.

## Runtime sequence

```text
settled Live facts + optional previous report facts
  → extractEvidence()
  → selectOpinions()
  → realizeJapanese()
  → curateComments()
  → RenderedLiveComment[]
```

`generateLiveComments()` runs the entire sequence. It uses only the local
seeded PRNG and an offline Japanese expression library: no LLM, external API,
network call, generated performer identity, or post-event economic effect.

## Input facts and evidence

`SettledLiveReviewInput` accepts only settled or report-level facts:

- `liveId`, event kind and explicit report eligibility;
- team and expected Impression;
- actual member Impression plus the established member name;
- Otaku/Public/external audience mix;
- permitted tokuten gross and queue-loss facts; and
- optional prior team satisfaction and recent evidence dimensions.

`extractEvidence()` produces stable internal IDs scoped to the actual
`liveId`. Current evidence dimensions are team performance, member highlight,
member caveat, first impression, smooth tokuten flow, tokuten queue pressure,
and observed improvement. Evidence is traceability metadata, not player-facing
text or a new simulation score.

## Editorial rules

- Sources are exactly `otaku`, `public`, and `media`.
- A report selects at most two source perspectives, never requires all three.
- Media is gated by an explicit settled-context flag and only debut, One-man
  or festival event kinds. Small ordinary events can have no comments.
- Source-specific evidence selection and a recent-dimension cooldown prevent a
  report from mechanically repeating the same theme.
- Surface text comes from a versioned static Japanese template library
  (`review-ja-v1`). It does not expose raw Impression, score, sales, queue
  amount or evidence IDs.
- A rendered comment stores `liveId`, source, evidence IDs, template version
  and seed. Future persistence writes that rendered result once; reopening a
  historical report must never generate a new one.

## Example generated perspectives

The templates are intentionally partial observations, not full score reports:

- Otaku may notice a member expression, a specific sense of improvement, or a
  long tokuten queue.
- Public may describe stopping to watch or a first-stage impression.
- Media may state a measured assessment of a debut/One-man/festival result.

The commentary may be mixed even when overall performance is positive. It may
not invent songs, artist names, media interviews, queue incidents, exact dates
or causal fan growth.

## Tests

`src/lib/runtime/reviews.test.ts` verifies:

1. deterministic replay and traceable evidence IDs;
2. one-or-two-source selection with no forced all-source report;
3. no comments for ineligible ordinary events;
4. independent queue-pressure and historical-improvement evidence;
5. mixed/weak outcomes without numeric score-to-sentence rendering.

## Next integration boundary

After the product revision formally updates v0.10 and the Runtime report
contract, integrate this Kernel immediately after immutable Live settlement.
Persist only the already-rendered `RenderedLiveComment[]`; do not call it from
Fan conversion, Finance, or a report re-open path.
