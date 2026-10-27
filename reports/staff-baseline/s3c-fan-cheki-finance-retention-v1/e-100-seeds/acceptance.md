# S3-C Fan x Cheki x Finance x Retention integrated acceptance

## Status

- PASS: P0 Cheki finance and completed-service reconciliation.
- PASS: P0 member A/W source-path observability.
- NOT_IMPLEMENTED: P1 multi-oshi overflow (S_ij, q_base=.4, temporary event W, cross-member capacity transfer). FIFO alone is not presented as a passing overflow test.
- NOT_IMPLEMENTED: P1/R2 Live/SNS/satisfaction-adjusted retention. Current weekly retention is fixed natural decay only.
- TUNABLE (unchanged): R0 curves, product prices, 20% commission, voucher cost, and natural churn.

## Full E, 100 seeds

P 562.946842; O 321.378109; A total 233.288008; W total 11.694736 KJPY; Cheki gross JPY 1273880; Cheki net JPY 828626.2; final cash JPY 1145013.7.

## Cash explanation

Comparable Legacy-C3 (same scenario/seeds, R0 disabled) cash is JPY 448611.5; full E is JPY 1145013.7; paired delta is JPY 696402.2. The quoted ~JPY619k uses an older non-identical report baseline; this report uses the same-seed executable comparator.
Completed-service source: paid requests JPY 1273880; Cheki gross JPY 1273880; member share JPY 254776; paid variable cost JPY 0; voucher cost JPY 190477.8; net JPY 828626.2. The paid-newcomer request-counter repair only improved audit accounting; it did not create revenue.

## A/W and retention findings

Team-trigger O has no member A. Member Live and completed paid/voucher Cheki source A are in member-affinity.csv. Existing O gains new A through Live exposure; existing-O Cheki-to-new-A remains NOT_IMPLEMENTED because normal requests are affinity-only and there is no multi-oshi trial/overflow path. W is updated once per week from served/lost queue results and is not queue priority.
Graduation moves Rina's unique affinity estimate to U and zeroes Rina A without an additional O decrement; graduation.csv records the transition.
Retention-weekly.csv records the effective fixed O factor 1.0 and base rate 0.0015; live/SNS columns are context, not active modifiers.

## Assertions

- PASS: cheki_and_queue
- PASS: r0_population
- PASS: affinity_bounds
- PASS: rina_closed
- PASS: replay
- PASS: reputation_and_tif

Raw event, finance, member, weekly-retention, graduation, seed, and assertion files are colocated here.
