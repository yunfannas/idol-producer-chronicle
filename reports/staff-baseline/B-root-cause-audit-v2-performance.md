# B E/E/E root-cause audit — Fan → Performance pass

Run version: `staff-autoplay-scenario-v3-performance-recovery`; B seeds `1..100` were actually replayed after this isolated Performance-only change.

## 1. Fan data flow: unchanged and observable

No Fan, Cheki, ticket, rent, payroll, or grade parameter changed in this pass. The event audit now records actual O/P attendance and each P→O / X→O / X→P event delta. Seed 1's monthly event-source deltas are below; the difference between `O_after` values is weekly `.003` O churn (and no hidden income/fan credit).

| Month | X audience | P→O | X→O | X→P | O after events |
| --- | ---: | ---: | ---: | ---: | ---: |
| 2013-05 | 80 | 0 | 0 | 1 | 0.000 |
| 2013-06 | 152 | 0 | 1 | 8 | 1.000 |
| 2013-07 | 70 | 0 | 0 | 5 | 0.985 |
| 2013-09 | 193 | 0 | 0 | 5 | 0.962 |
| 2013-10 | 127 | 0 | 0 | 4 | 0.953 |
| 2013-11 | 68 | 0 | 0 | 4 | 0.947 |
| 2013-12 | 135 | 0 | 0 | 2 | 0.925 |
| 2014-01 | 59 | 0 | 0 | 4 | 0.911 |
| 2014-02 | 48 | 0 | 0 | 2 | 0.900 |
| 2014-03 | 158 | 0 | 0 | 7 | 0.889 |
| 2014-04 | 208 | 0 | 2 | 9 | 2.870 |
| 2014-05 | 232 | 0 | 1 | 18 | 3.830 |
| 2014-06 | 206 | 0 | 0 | 11 | 3.784 |
| 2014-07 | 286 | 0 | 0 | 17 | 3.728 |
| 2014-08 | 130 | 0 | 0 | 6 | 3.728 |

The zero `P→O` in this single seed is a seeded result, not a bypass: early P attendance is below one expected viewer. The 100-seed mean final O rises from the prior 4.3891 to **6.4583** solely because observed Performance now reaches the Fan Q calculation.

## 2. Performance growth and score: repaired in isolation

Two data-flow omissions were repaired:

1. Staff rehearsal had only incremented a fixture counter. It now applies Palette experience from actual rehearsal time, and Live applies only its actual stage-time Palette exposure.
2. The Calendar had applied work loads but no intervening daily Condition recovery, pushing the technical kernel to its Q floor. It now applies the versioned `dailyConditionRecovery=2` before each Calendar day.

No familiarity number is reported as an invented fact: the persistent arrangement-familiarity / resolved-key-duty adapter is still `NOT_IMPLEMENTED` in this runtime. The report exposes the implemented training hours and member Palette instead. In seed 1, each member has 492 actual Staff training hours; active members' Palette means are 23.175–23.800 (Rina 22.737 before graduation). This is a gap to close before treating key-part Familiarity as calibrated.

Seed 1 Performance rises from 0.550 at debut to a high of 0.846 (2014-07-23); the 42-event mean is 0.7251 across B 100 seeds. Seed 1 ends `Fans E / Performance D / Business E / Overall E`: the Performance channel moved without changing its grade threshold.

## 3. Income / cost and Business: measured, not retuned

Seed 1 is still ¥2,085,500 operating revenue, ¥4,138,000 operating cost, ¥615,000 capitalized assets, ¥332,500 closing cash and ¥231,500 minimum cash. There is no real seed-1 Cheki sale because the resulting affinity population remains too small. Every event's ticket, venue, Cheki and cash evidence is in `B-seed-1-event-ledger.csv`.

No Business parameter is changed in this pass. The remaining Business-E result cannot be responsibly "fixed" by lowering the final-cash grade threshold or injecting revenue. Per-contract ticket/rent calibration must be reconciled into approved Scenario data before a Business tuning pass. A's 20/20 debt-distress remains recorded as an 18-person cost-risk observation, not a defect finding.

## 4. B 100-seed post-Performance rerun

| Metric | Baseline v1 | Performance v3 |
| --- | ---: | ---: |
| Final O mean | 4.3891 | 6.4583 |
| Event Performance mean | ~0.500 floor | 0.7251 |
| Final cash mean | ¥322,251.50 | ¥326,595.50 |
| Overall C-or-better | 0 / 100 | 0 / 100 |

This completes a separate B 100-seed replay for the Fan audit and Performance pass. Business has deliberately not been tuned concurrently.
