# Fan acquisition repair — B / S3-C / 100 seeds

- Git SHA before this repair commit: `1152807cb62b8d9267a789d7abf2e7dabd5d273d`
- Scenario: `staff-autoplay-scenario-v6-fan-acquisition-weekly-resolution`
- Balance configuration: `fanChekiBalanceV1-fan-acquisition-v2`
- Actual runs, no fixed revenue/fan/grade values:

```json
{
  "completedTif": 100,
  "finalPublicMean": 102.40321695410644,
  "finalOtakuMean": 32.47319904482914,
  "finalUnassignedOtakuMean": 10.179567289868363,
  "publicToOtakuMean": 0.54,
  "externalToOtakuMean": 5.55,
  "externalToPublicMean": 111.51,
  "finalCashMeanJPY": 416491.5,
  "performanceMean": 0.7265522217469261
}
```

## Fixed data flow

- Contract audience is now partitioned once into O, P and residual X; the three source counts never exceed contract attendance.
- Event fan results are stored as momentum and resolved once per week. P→O uses the combined weekly hazard, while distinct X audience transitions remain event-attributed.
- Saturday TIF momentum receives an explicit chapter-close resolution without an additional weekly churn pass.
- P/O/A natural churn is reduced only through the named TUNABLE balance configuration; no Fan conversion, Performance, contract, Finance or grade threshold was raised.

## Remaining boundary

- Non-O Cheki trial and its combined Trial→O hazard are still not implemented in the Staff adapter. It remains a data-flow follow-up, not a substitute fixed-fan reward.
- Graduation U currently follows the existing aggregate O decay path; the specification's separate U churn/reassignment process needs its own future lifecycle implementation rather than being folded into this acquisition/churn calibration.
