# Fan / Cheki seeded regression — 2026-10-24

This is the first calibration record for the executable v1 baseline. It does
not establish historical attendance, revenue, or a production Scenario seed.

> **Historical pre-fix results:** the values below were measured before the subsequent correction to actual-attendee-only affinity acquisition and one-stay-decision-per-fan Cheki sampling. The .05 balance parameter remains unchanged, but the numeric results below are **not valid post-fix regression expectations**. See [Fan_Cheki_Stress_Regression_2026-10-24.md](Fan_Cheki_Stress_Regression_2026-10-24.md) for fixes and rerun requirements.

## Verified post-fix rerun

Ran locally on 2026-10-24 after the actual-exposure and single-stay fixes:
5/9/15 members, 12 weekly taiban Lives, seeds 1–20 for each route. The
fixture and finance boundary below are unchanged; no ticket income is
invented. `pExistingOtakuToAffinity=.05` is retained.

| Route | Live attendance, week 1 → 12 | P / O / ΣA / mean W at week 12 | Cheki per member per Live: requested / gross / queue loss | Mean weekly gross / cash flow | Week-4 cash flow |
| --- | ---: | ---: | ---: | ---: | ---: |
| 5 | 38.35 → 37.65 | 297.09 / 40.70 / 26.63 / 2.00 | ¥706.67 / ¥706.67 / ¥0 | ¥3,533.33 / -¥24,673.33 | -¥62,080 |
| 9 | 38.35 → 37.65 | 297.09 / 40.70 / 27.26 / 2.00 | ¥396.30 / ¥396.30 / ¥0 | ¥3,566.67 / -¥34,646.67 | -¥102,520 |
| 15 | 38.35 → 37.65 | 297.09 / 40.70 / 27.22 / 2.00 | ¥283.06 / ¥283.06 / ¥0 | ¥4,245.83 / -¥49,103.33 | -¥161,520 |

Initial total `A` is 24. Post-fix `ΣA` grows only 11–14% over 12 weeks, and
the zero-exposure regression confirms that it cannot grow without an actual
Live audience. This is within the intended low-scale neutral-fixture behavior,
so no further adjustment to `.05` was made. The historical tables below remain
for traceability only.

## Method

- Routes: 5, 9, and 15 members; 12 weekly taiban Lives each; seeds 1–20 per
  route (60 deterministic runs).
- Neutral fixture only: `P=300`, `O=40`, total initial `A=24`, `W_i=2.0`;
  `A` is divided evenly across the selected roster. Each Live has 30 temporary
  external viewers.
- Finance covers actual Cheki net of the 20% member share, then ¥15,000 weekly
  training and ¥10,000/member payroll every fourth week. No ticket contract is
  supplied, so the fixture creates **no ticket income**. Both Cheki product
  variable costs are currently configured as ¥0.
- The event-local temporary audience uses per-member Hypergeometric affinity
  reconstruction, independent multi-oshi overlap, a shared queue, and the
  60-minute service window. Persistent Fan state remains only `P/O/A_i/W_i/U`.

Run it with `npm run test:regression` (use Vitest verbose output to view the
machine-readable summary).

## Initial baseline

The original `pExistingOtakuToAffinity=.10` produced these 20-seed means at
week 12:

| Route | Live attendance, week 1 → 12 | P / O / ΣA / mean W | Mean Cheki gross per week | Mean weekly cash flow |
| --- | ---: | ---: | ---: | ---: |
| 5 | 38.35 → 37.65 | 297.09 / 40.70 / 62.58 / 2.00 | ¥5,720.83 | -¥22,923.33 |
| 9 | 38.35 → 37.65 | 297.09 / 40.70 / 65.53 / 2.00 | ¥6,570.83 | -¥32,243.33 |
| 15 | 38.35 → 37.65 | 297.09 / 40.70 / 68.46 / 2.00 | ¥6,641.67 | -¥47,186.67 |

`ΣA` grew substantially while `O` was nearly flat, so the existing-O affinity
hazard was the only parameter changed.

## Calibrated run

`fanChekiBalanceV1.pExistingOtakuToAffinity` is now `.05`; no persistent Fan
field, roster multiplier, service capacity, or purchase model changed.

| Route | Live attendance, week 1 → 12 | P / O / ΣA / mean W at week 12 | Cheki per member per Live: requested / gross / queue loss | Mean weekly gross / cash flow | Week-4 cash flow |
| --- | ---: | ---: | ---: | ---: | ---: |
| 5 | 38.35 → 37.65 | 297.09 / 40.70 / 44.96 / 2.00 | ¥963.33 / ¥963.33 / ¥0 | ¥4,816.67 / -¥23,646.67 | -¥61,040 |
| 9 | 38.35 → 37.65 | 297.09 / 40.70 / 46.57 / 2.00 | ¥582.87 / ¥582.87 / ¥0 | ¥5,245.83 / -¥33,303.33 | -¥100,480 |
| 15 | 38.35 → 37.65 | 297.09 / 40.70 / 46.95 / 2.00 | ¥382.78 / ¥382.78 / ¥0 | ¥5,741.67 / -¥47,906.67 | -¥160,360 |

At this deliberately small initial market, every requested unit was sold and
there were no abandoned buyers or queue-capacity losses. W stays 2.00 because
there is neither a positive engagement score nor a queue-loss penalty in this
fixture. This is not evidence that the queue can be removed or that its timing
should be retuned; a Scenario-supplied high-demand event is needed for that
calibration.

The total Cheki amounts remain similar while per-member demand falls with
roster size. That is intended: members divide real affinity/exposure and do not
receive an artificial roster-size income multiplier. Payroll is the main reason
that the 15-member route has the weakest cash flow.
