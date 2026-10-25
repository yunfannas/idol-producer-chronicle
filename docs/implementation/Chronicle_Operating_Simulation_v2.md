# Operating Simulation v2 — Roster & Performance Calibration

## Scope

This is a 12-week, seeded calibration report for the existing integration
fixture in `src/lib/runtime/operating-simulation.ts`. It changes neither the
persisted Fan schema (`P / O / A_i / W_i`) nor Calendar, save, contract, or UI
behaviour. The Fan × Cheki v1 regression baselines remain separate tests.

The run uses 20 fixed seeds (`operating-v2:1` through `operating-v2:20`) for
each configuration. Reported values are means unless a range is shown. A
fixed seed produces an identical route.

## Member-level conversion

For each actual Live participant, the fixture now derives an event-local
exposure sample from that member's real technical `Impression`:

`exposureProbability_i = clamp(Impression_i / ExpectedImpression, 0, 1)`

The temporary audience sampler removes Otaku who already have `A_i`, then
draws `E_i` from the remaining actual Otaku attendees. It stores only the
count in the weekly report; it does not add a cohort or person-level Fan
state. Existing-Otaku conversion is then:

`ΔA_i = Binomial(E_i, clamp(0.05 × Q_i, 0, 1))`

where `Q_i = clamp(Impression_i / ExpectedImpression, 0.5, 1.5)`. The bound is
the existing Fan v1 `Q` normalization, applied to the existing technical
Performance output; it is not a new performance scale. Raw Impression and
Expected Impression are both reported.

New Otaku created by the same Live receive one initial affinity selected by
positive actual-Impression weight. A member with zero Impression has zero
exposure probability and cannot receive either path of new affinity.

The current fixture has three songs and no persisted part-duration table yet.
Thus this is explicitly an event-local statistical exposure proxy based on
actual Impression, not a claim that every attendee sees every member. When a
real setlist/part-duration record is persisted, that record should replace the
proxy without changing persistent Fan data.

## Common operating constraints

- There is no roster-size audience multiplier.
- All members perform through 10. At 15 members, Staff selects an actual
  ten-person lineup by availability/Condition each Live; inactive members do
  not receive that event's exposure or Cheki sales.
- Free mall shows still produce Live exposure, but have no paid Cheki; ticket
  revenue is present only for contracts with explicit ticket inputs.
- Each weekly report exposes attendance, `P/O/ΣA`, revenue, cost and cash, plus
  `A_i/W_i`, Impression/Expected/`Q_i`, `E_i`, new affinity, and requested,
  completed and lost Cheki yen for every member.

## Experiment A — fixed market

Initial state is the neutral fixture for every roster: `P=300`, `O=40`,
`ΣA=24`, `W=2`. This isolates roster and lineup effects; it is not intended to
make 15 members automatically outperform 5 in a fixed market.

| Roster | Final P | Final O | Final ΣA | 12-week Cheki gross | Final cash |
| --- | ---: | ---: | ---: | ---: | ---: |
| 5 | 298.77 | 40.50 | 28.98 | ¥41,900 | ¥2,698,520 |
| 9 | 297.06 | 40.35 | 31.26 | ¥51,100 | ¥2,585,880 |
| 15 | 297.20 | 40.35 | 33.13 | ¥38,700 | ¥2,395,960 |

The earlier observation that five members can finish with more Otaku is not a
hidden size penalty: the five-member fixture starts with the stronger first
five calibration profiles, while 9/15 add lower-Performance profiles and
receive no extra market. `P→O` is therefore driven by team Impression, not by
member count. The 15-member route does increase total affinity (multi-oshi)
but its ten-person lineup cap and rotating actual participants limit per-show
Cheki capacity and exposure. This is the expected result for a fixed market,
not a target ordering for real groups.

## Experiment B — scaled but overlapping support

The initial fixtures are test inputs, not historical seeds:

| Roster | Initial P/O/ΣA/W | Final P | Final O | Final ΣA | 12-week Cheki gross | Final cash |
| --- | --- | ---: | ---: | ---: | ---: | ---: |
| 5 | 300 / 40 / 24 / 2 | 298.77 | 40.50 | 28.98 | ¥41,900 | ¥2,698,520 |
| 9 | 400 / 60 / 43 / 2 | 387.88 | 59.74 | 52.91 | ¥79,400 | ¥2,608,520 |
| 15 | 550 / 85 / 72 / 2 | 523.86 | 84.20 | 87.74 | ¥90,000 | ¥2,437,000 |

More starting support produces more attendance, affinity and Cheki demand.
However, going from 9 to 15 raises Cheki by only ¥10,600 over twelve weeks,
while payroll rises with the full active roster. The 15-member route finishes
with less cash because the ten-person Live cap prevents it from monetizing all
members on every date. This gives large rosters a real, limited scale benefit
without treating their Otaku bases as disjoint copies.

## Experiment C — nine members, Performance only

The 9-member fixture, schedule, contracts and seeds are held fixed. Only the
specified member Performance multiplier is changed.

| Scenario | Final P | Final O | Final ΣA | 12-week Cheki gross | Final cash |
| --- | ---: | ---: | ---: | ---: | ---: |
| C1 neutral | 297.06 | 40.35 | 31.26 | ¥51,100 | ¥2,585,880 |
| C2 all ×1.20 | 300.29 | 40.65 | 34.52 | ¥52,150 | ¥2,586,720 |
| C3 IPC1-001 ×1.80 | 299.25 | 40.60 | 33.31 | ¥50,950 | ¥2,585,760 |
| C4 vocalist IPC1-002 ×1.70 | 298.96 | 40.55 | 33.21 | ¥50,850 | ¥2,585,680 |
| C5 IPC1-001/002/003 ×0.65 | 295.24 | 40.15 | 30.09 | ¥48,500 | ¥2,583,800 |

C1's 20-seed outcome range is `P 291.75–305.88`, `O 38.58–42.52`,
`ΣA 26.63–37.36`, Cheki `¥29,000–¥78,000`, and cash
`¥2,568,200–¥2,607,400`. Decisions use means and distributions, not a
per-seed monotonicity requirement.

### C3 member summary — mean over 20 seeds / 12 weeks

This table makes the relationship inspectable. `Req/Gross/Lost` are totals
per member; no queue loss appears in this low-demand neutral fixture, while
the retained popular-member baseline continues to exercise the capacity-loss
path.

| Member | Impression / Expected | Final A_i | Final W_i | New A_i | Req / Gross / Lost |
| --- | ---: | ---: | ---: | ---: | ---: |
| IPC1-001 | 0.700 / 0.620 | 5.55 | 1.992 | 3.10 | ¥6,700 / ¥6,700 / ¥0 |
| IPC1-002 | 0.395 / 0.620 | 3.74 | 1.993 | 1.25 | ¥5,850 / ¥5,850 / ¥0 |
| IPC1-003 | 0.354 / 0.620 | 3.55 | 1.994 | 1.05 | ¥4,200 / ¥4,200 / ¥0 |
| IPC1-004 | 0.263 / 0.620 | 3.45 | 1.994 | 0.95 | ¥5,050 / ¥5,050 / ¥0 |
| IPC1-005 | 0.354 / 0.620 | 3.75 | 1.992 | 1.25 | ¥5,000 / ¥5,000 / ¥0 |
| IPC1-006 | 0.278 / 0.620 | 3.45 | 1.992 | 0.95 | ¥6,100 / ¥6,100 / ¥0 |
| IPC1-007 | 0.273 / 0.620 | 3.31 | 1.992 | 0.80 | ¥6,600 / ¥6,600 / ¥0 |
| IPC1-008 | 0.312 / 0.620 | 3.21 | 1.992 | 0.70 | ¥6,150 / ¥6,150 / ¥0 |
| IPC1-009 | 0.261 / 0.620 | 3.30 | 1.992 | 0.80 | ¥5,300 / ¥5,300 / ¥0 |

The C3 star's final-affinity gain is `+2.89`, versus `+1.23` in C1. The
other eight members can move slightly because the higher team Impression also
changes group acquisition, but their mean gains remain below the star's. This
confirms member-level response without incorrectly forcing team-level effects
to zero. Impression, affinity-growth and Cheki-revenue ranks differ, as
expected: Cheki still follows existing affinity, budgets and the shared queue.

## Checks encoded in tests

- A/B/C each run 12 weeks × 20 fixed seeds; repeated matrices are identical.
- A zero-Impression member has `E_i = 0` and `ΔA_i = 0` every week.
- Higher all-member Performance raises mean `O`; the C3 and C4 member's own
  affinity grows more than its neutral counterpart; lower Performance reduces
  mean `O`.
- Finance weekly revenue/cost totals reconcile exactly to the sole Finance
  ledger; ticket income still requires a contract and the mall has no paid
  Cheki.
- The existing Fan × Cheki neutral, popular-member and multi-oshi regression
  tests remain the capacity and shared-queue baselines.

## Result

Keep the `.05` base conversion coefficient. The observed direction and
constraints are sound enough to proceed without a Fan-schema change or a new
cohort. Future tuning should start from real persisted part-duration/lineup
data and live contracts, not a roster-size multiplier or a second fan model.
