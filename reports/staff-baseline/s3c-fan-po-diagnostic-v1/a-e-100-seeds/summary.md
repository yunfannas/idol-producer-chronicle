# Chronicle S3-C Fan P/O diagnostic — paired 100-seed A–E

- Source commit at generation: `071d700007ff9d97bc5af1c7ed8bf005c7bd27d7`
- Command: `npm run report:s3c-fan-po-diagnostic`
- Route B / Staff default / S3-C / C3; seeds 1–100 are reused for every experiment. No schedule, contract, finance, capacity, or non-target parameter changes.
- This is an audit, not a calibration edit. P≈600/O≈300 is a reference, not an assertion.

## Effective baseline path

C3 resolves `resolveDiagnosticAudienceChannels` per Live. Its effective active `P_active→O` rate is **0.35**; C3 does not use legacy `fanChekiBalanceV1.pPublicToOtaku=0.025` except in C2. The weekly ledger commits sampled P conversions once, caps them by the surviving P pool, and writes remaining external watchers only through the Sunday SNS/external exposure deduplication.

C3 currently has no paid-Cheki→new-O mechanism: paid Cheki changes the real queue, A/W, and finance only. Its default newcomer-voucher contract is disabled and C3 deliberately bypasses that second hazard. Therefore C/E are meaningful absence checks, not evidence that a nonzero source was hidden.

## Baseline and paired deltas

- A baseline: final P 282.825597, O 611.119414, P+O 893.945011, net growth 623.945011, cash ¥525955.5; Team Live→O 603.82, X→O 1.68, SNS→P 769.58, external exposure→P 8.08; P churn 131.014403, O churn 24.380586.
- B (active P→O 0.10): paired ΔP 315.790887, ΔO -337.312743, ΔP+O -21.521856, Δcash ¥-77344, ΔTeam Live→O -350.7.
- C (no paid Cheki conversion): paired ΔP 0, ΔO 0, Δcash ¥0, Δpaid-Cheki→O 0.
- D (no external direct O, X retained as exposure): paired ΔP -0.398561, ΔO -1.118138, ΔP+O -1.516699, Δcash ¥440, ΔX→O -1.68.
- E (no voucher conversion): paired ΔP 0, ΔO 0, Δcash ¥0, Δvoucher→O 0.

## Findings

The report’s paired B comparison is the causal check for whether 0.35 is in the active path. C and E show whether any currently active Cheki/newcomer path can explain O. D separates direct external conversion from delayed X→P exposure. Use the per-week source ledger—not terminal delta alone—for direct channel contribution, because every ablation changes later P/O population bases.

## Files

- `effective-config.json`: actual C3 baseline settings and each diagnostic override.
- `weekly.csv`: all 500×weekly conservation rows, including every requested P/O flow lane.
- `events.csv` / `attribution.csv`: live population, conversion, demand, and exposure facts.
- `cheki-member.csv` / `finance.csv`: every service queue and ledger fact.
- `seeds.csv` / `experiment-summary.csv` / `paired-deltas.csv`: distribution and paired analysis.
- `assertions.json`: weekly conservation, capacity, deduplication, queue, free-revenue, ledger, graduation, replay, and TIF checks.

## Assertions

- PASS: weekly_conservation (500/500); failures: none
- PASS: event_population_and_capacity (500/500); failures: none
- PASS: single_event_conversion_dedup (500/500); failures: none
- PASS: cheki_queue_capacity (500/500); failures: none
- PASS: free_event_revenue (500/500); failures: none
- PASS: finance_ledger (500/500); failures: none
- PASS: rina_graduation (500/500); failures: none
- PASS: replay_idempotency (500/500); failures: none
- PASS: tif_completion (500/500); failures: none
