# Chronicle Live Review Generator v0.2

## Status and boundary

`src/lib/runtime/reviews.ts` is a deterministic, pure procedural commentary
Kernel implementing the commentary portion of the pending 2026-10-25
prologue revision. It is a presentation projection of an already-settled Live:
it does not alter Performance, Fan, Cheki, Finance, Calendar, contracts, or
the save schema.

The revision has not yet reconciled its product/price changes with v0.10 and
the Runtime Implementation Pack. Accordingly, this Kernel remains detached
from `resolveLive()`. A later integration must persist its rendered output
immediately after immutable Live settlement, once the report persistence
contract has been formally revised. Re-opening a report must read that stored
output and never regenerate it.

## Input and evidence contract

`SettledLiveReviewInput` accepts only facts from a settled outcome or report:

- report eligibility, event kind, actual media/newsworthiness eligibility;
- team and member Impression versus Expected Impression;
- optional settled per-song Impression, observed MC reception and observed
  stage-management execution;
- actual audience mix and an optional event-provided expected attendance;
- permitted tokuten gross and unfinished-queue loss; and
- optional prior team satisfaction and recent evidence-dimension history.

An optional field does not create a default observation. For example, no song,
MC, production or attendance-response commentary is possible unless that
corresponding settled fact was supplied. Raw values, evidence IDs and internal
ratings are traceability metadata only and are never rendered for players.

## v2 dimensions and editorial selection

The Kernel has fifteen fact-grounded evidence dimensions:

1. team performance and team cohesion;
2. member highlight and member caveat;
3. song highlight and song caveat;
4. MC rapport and MC caveat;
5. first impression and audience response;
6. tokuten flow and queue pressure;
7. production flow and production caveat; and
8. observed improvement over the supplied historical comparison.

Each report chooses at most two of Otaku, Public and Media. Otaku can notice
all settled dimensions; Public is limited to broad first impressions and
visible stage observations; Media needs the completed event's explicit
eligibility and remains restricted to debut, One-man and festival reports.
`reviewEligible` is owned by the completed contract/report, so a small ordinary
multi-act event can produce no commentary while a noteworthy larger event can.

Selection excludes recent dimensions when alternatives exist and never repeats
a source or dimension in one report. It selects a source-appropriate speech
act (notice, praise, caveat, comparison or return intent) before realization.
This keeps comments partial and subjective rather than turning them into a
score recap.

## Japanese realization

`review-ja-v2` is an offline static Japanese expression library. Every
dimension has several fact-specific observations and every source/act pair has
several different syntactic frames. The per-event seeded PRNG chooses among
them deterministically. This is not a runtime LLM/API call and does not invent
song names, member names, incidents, dates, press coverage, or fan-growth
causes.

`RenderedLiveComment` contains `liveId`, source, rendered Japanese text,
evidence IDs, `review-ja-v2`, and the seed. Future persistence writes that
value once; comments have no economic or simulation effect.

## Regression coverage

`src/lib/runtime/reviews.test.ts` verifies deterministic replay, source and
topic diversity, ineligible ordinary-event silence, sparse-input non-
fabrication, independent queue/improvement evidence, seed-based Japanese
variation, and mixed/weak results without numeric score rendering.
