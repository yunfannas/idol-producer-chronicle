# B Route Fan E2E — 100 real Runtime seeds

- Runtime commit: `7ff8a40a97ac718f2edd960e7719f4807ec25661`
- Scenario: `staff-autoplay-scenario-v7-fan-audit-contracts:S3-C`
- Balance: `fanChekiBalanceV1-fan-acquisition-v2`
- Seed set: 1..100; all source rows are emitted by the actual Staff Runtime.

## Results

- TIF completed: 100/100
- Final O: mean 33.616078, median 33.369746, p10 30.44029, p90 37.232361
- Final cash: mean ¥419435.5, median ¥417900, p10 ¥364250, p90 ¥479700
- O≈300 is retained solely as a calibration reference, not an assertion gate.

## Assertions

- PASS: population (100/100); failed seeds: none
- PASS: capacity (100/100); failed seeds: none
- PASS: attribution (100/100); failed seeds: none
- PASS: affinity (100/100); failed seeds: none
- PASS: freeRevenue (100/100); failed seeds: none
- PASS: queue (100/100); failed seeds: none
- PASS: graduation (100/100); failed seeds: none
- PASS: finance (100/100); failed seeds: none
- PASS: replay (100/100); failed seeds: none
- PASS: tif (100/100); failed seeds: none

All implemented structural checks passed. No conversion, Finance, Performance, or grade parameter was changed for this audit.

## Feedback observation

- New-O initial affinity followed by later same-member aggregate attendance and a completed paid service: 99/100 seeds. No observation: 77. This is expected to be stochastic and censored at the chapter end; it is retained as an auditable failure case rather than being fixed by a parameter change.

## Explicit limits

Chronicle deliberately persists no individual fan/Cohort IDs, so this feedback observation is aggregate, not a fictitious per-person purchase trail. The audit reports no free voucher service because the current Scenario has none. This is not a claim that the C4 voucher loop has been implemented. The missing channels and U lifecycle are listed in `audit.md` and `assertions.json`; no synthetic rows have been used to fill them.
