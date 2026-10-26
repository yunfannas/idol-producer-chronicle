# S3-C R0 dynamic conversion audit

## Actual path

C3 calls `resolveDiagnosticAudienceChannels` only for demand/population attribution, with `skipLegacyConversion=true`. It then calls `updateFanFromR0Event`: actual Team quality and member quality become satisfaction; R0 samples Team Live, Member Live, then only completed paid/voucher services. Event momentum writes P/O once at Sunday. The legacy `activePublicToOtakuRate` and `pPublicToOtaku*q` paths remain available only when R0 is explicitly disabled for A/C0/C2 comparison.

- Baseline active fixed rate is not used by R0; legacy values: `{"pPublicToOtaku":0.025,"pExternalToOtaku":0.004}`.
- Team conversions add O only; Member Live/Cheki conversions add O plus the actual source/service member A. Event-local source members are neutral across actual participants because no approved Member-Appeal acquisition input is wired; actual Member Performance is applied once in its conversion/satisfaction curve.
- Unconverted X enters only the Sunday exposure pool. No persistent fan ID/cohort was added.

## A–E mean results

- A Legacy C3 baseline: P 598.616484, O 273.806671, P+O 872.423155, Team/Member/Paid/Voucher/X→O 253.12/0/0/0/1.6, cash ¥448611.5.
- B R0 dynamic Team/Member Live: P 628.845528, O 240.930226, P+O 869.775755, Team/Member/Paid/Voucher/X→O 102.26/118.74/0/0/0, cash ¥654651.5.
- C B + completed paid Cheki: P 598.331496, O 273.058278, P+O 871.389774, Team/Member/Paid/Voucher/X→O 99.63/115.96/38.54/0/0, cash ¥1237427.5.
- D C + completed newcomer vouchers: P 562.888659, O 310.62475, P+O 873.513409, Team/Member/Paid/Voucher/X→O 95.43/111.28/37.49/48.85/0, cash ¥1112335.3.
- E D + X Team/Member Live and weekly exposure: P 562.946842, O 321.378109, P+O 884.324951, Team/Member/Paid/Voucher/X→O 101.95/113.23/37.77/51.54/12.06, cash ¥1145013.7.

## Paired marginal results

- B vs A: ΔP 30.229045, ΔO -32.876445, ΔP+O -2.6474, Δcash ¥206040.
- C vs A: ΔP -0.284987, ΔO -0.748393, ΔP+O -1.03338, Δcash ¥788816.
- D vs A: ΔP -35.727824, ΔO 36.818079, ΔP+O 1.090255, Δcash ¥663723.8.
- E vs A: ΔP -35.669641, ΔO 47.571438, ΔP+O 11.901797, Δcash ¥696402.2.

## Assertions

- PASS: population_conservation (500/500)
- PASS: source_and_capacity (500/500)
- PASS: one_o_per_event (500/500)
- PASS: completed_service_only (500/500)
- PASS: queue (500/500)
- PASS: free_revenue (500/500)
- PASS: finance (500/500)
- PASS: graduation (500/500)
- PASS: replay (500/500)
- PASS: tif (500/500)

All raw event, weekly, attribution, queue, finance, seed, distribution, and paired-delta files are colocated in this directory.
