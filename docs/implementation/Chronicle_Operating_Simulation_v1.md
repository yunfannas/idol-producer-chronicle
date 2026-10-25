# Chronicle 序章 12 周经营模拟 v1

## Purpose and boundary

`src/lib/runtime/operating-simulation.ts` is a deterministic integration
fixture for the next implementation phase. It joins Staff training, actual
lineup/performance, Fan momentum, member-level Cheki and the single Finance
ledger in one 12-week sequence. It preserves the separate neutral, popular
member, and multi-oshi Fan × Cheki tests as formula regression baselines.

This is not a claim that the Calendar UI's persisted `PrologueState` has
already migrated all 17 member attributes, arrangements, or contract data.
That migration remains the production-integration task; the fixture exists so
that it has a tested end-to-end reference rather than a second set of rules.

## Runtime path

1. Staff schedules the chapter's medium shared training, posts exactly one
   shared training-room cost, changes the single member `Condition`, and adds
   member training EXP.
2. Staff forms the actual lineup (all active members through 10; the 15-member
   fixture selects the ten best available members) and runs the technical
   attribute path plus one eight-color Palette multiplier.
3. The resulting `quality = clamp(TeamImpression / ExpectedImpression,.5,1.5)`
   is the Fan conversion `Q`; no fixed `liveQualityFactor` is used.
4. The same actual attendee sample is passed to the existing member-level
   Cheki queue. Its completed ¥1,000/¥2,000 units are then settled by
   `settleChekiSales` and posted with `chekiLedgerEntries`.
5. Ticket revenue is posted only when that fixture's contract contains
   `totalReceipts`, group count, and nomination inputs. The debut contract and
   the free-mall contract contain no such inputs and post ¥0 ticket revenue;
   the mall also forbids paid Cheki. Every revenue and cost line uses the
   existing idempotent Finance ledger.

The core performance attributes are copied from
`docs/data/Idol_Producer_Chronicle_First_Generation_Calibration_v0.6.csv`.
The simplified bridge from technical execution to `ExpectedImpression` is
explicitly versioned as `operatingSimulationV1`, because the detailed
BaseQuality / Arrangement / Env numerical bridge remains TUNABLE.

## Verified run

`runOperatingSimulation(5|9|15, seed)` was run for seed
`operating:<roster>:1` on 2026-10-24.

| Route | Final cash | Final P / O / ΣA | Explicit ticket revenue | Actual Cheki gross | Lowest mean Condition |
| --- | ---: | ---: | ---: | ---: | ---: |
| 5 | ¥2,689,000 | 294.33 / 43.50 / 28.57 | ¥75,000 | ¥30,000 | 78.81 |
| 9 | ¥2,572,200 | 290.60 / 40.54 / 24.67 | ¥75,000 | ¥34,000 | 76.25 |
| 15 | ¥2,386,600 | 301.03 / 40.57 / 25.83 | ¥75,000 | ¥27,000 | 91.74 |

The fifteen-member route's higher mean Condition comes from its explicit
ten-member lineup limit, not a roster-size income or audience multiplier.
These are integration-fixture observations, not historical targets or a
replacement for Scenario contracts.

## Verification

- `npm test` — 24 tests, including 5/9/15 deterministic operating routes.
- `npm run lint`
- `npm run build`

## Production integration still required

- Persist all 17 attributes, eight core EXP values, arrangement familiarity,
  actual live outcomes and contract inputs in `PrologueState` with a save
  migration.
- Replace Calendar's current `OFFERED` stop with this same Live pipeline after
  each event has a Scenario contract and final lineup/setlist record.
- Connect real Performance/Staff/interaction outputs to the explicit TUNABLE
  bridge; do not promote fixture values to locked historical facts.
