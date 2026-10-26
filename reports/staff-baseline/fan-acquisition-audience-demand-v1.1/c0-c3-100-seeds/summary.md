# Fan Acquisition × Audience Demand v1.1 — C0–C3 paired Runtime audit

- Runtime commit at generation: `a87daa5548d68d8529cbf00a5f9ce897675ea1de`
- Route: B / Staff default / S3-C; seeds 1–100 reused for every stage.
- C0 legacy control; C1 adds only weekly SNS→P; C2 adds C1 plus P awareness/ticket demand and explicit X demand with legacy conversion candidates; C3 adds segmented active-P/P-other/X-idol/X-general conversion.
- All values are emitted by the actual Runtime. No O target, fixed income, or invented capacity fill is used.

## Mean results

- C0: P 268.810006, O 33.616078 (p10–p90 30.44029–37.232361), online new P 0, P ticketed/attending 132.66, P→O 2.13, X→O 5.14, final cash ¥419435.5.
- C1: P 893.843466, O 38.008508 (p10–p90 34.375945–41.277931), online new P 760.18, P ticketed/attending 418.29, P→O 7.43, X→O 4.32, final cash ¥426027.5.
- C2: P 768.249803, O 97.924078 (p10–p90 87.097578–108.765767), online new P 760.97, P ticketed/attending 3982.53, P→O 72.46, X→O 0.82, final cash ¥541931.5.
- C3: P 284.238173, O 614.038283 (p10–p90 596.439262–630.18101), online new P 760.61, P ticketed/attending 2472.35, P→O 605.89, X→O 1.74, final cash ¥1661227.5.

## Audit files

- `events.csv`, `weekly.csv`, `online.csv`, and `attribution.csv` include all 400 Runtime runs.
- `cheki-member.csv` and `finance.csv` retain the detailed seed-1 ledger for each stage; `seeds.csv` and `stage-summary.csv` carry all 100-seed outcomes.

## Assertions

- PASS: population (400/400); failed runs: none
- PASS: capacity_and_sources (400/400); failed runs: none
- PASS: attribution (400/400); failed runs: none
- PASS: online_stage (400/400); failed runs: none
- PASS: queue (400/400); failed runs: none
- PASS: free_revenue (400/400); failed runs: none
- PASS: finance (400/400); failed runs: none
- PASS: graduation (400/400); failed runs: none
- PASS: replay (400/400); failed runs: none
- PASS: tif (400/400); failed runs: none

All structural assertions passed.

O≈300 remains a calibration reference only, not an assertion or a parameter-selection target.
