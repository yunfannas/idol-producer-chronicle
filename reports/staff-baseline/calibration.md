# Calibration record

`staff-autoplay-scenario-v1` is a new, explicit Scenario adapter. The following are `TUNABLE`, because the governing v0.10 schedule does not define their per-contract values: taiban capacity/sell-through/ticket/rent; experimental and regular capacity/sell-through/ticket/rent; graduation and One-man capacity/sell-through/ticket/rent; and TIF assumed entry/rent.

Frozen inherited kernels used unchanged:

- `fanChekiBalanceV1` P/O/A/W, attendee and queue mechanics;
- two Cheki tiers, 20% member commission and one shared queue time budget;
- Performance / Palette adapter from `operating-simulation.ts`;
- idempotent Finance ledger and ordinary taiban 15%/N + 25% nomination split;
- initial cash ¥3,000,000, production assets and shared Medium training room cost.

No parameter was changed after observing a seed. The one correctness repair was month-end snapshot timing; it changes report attribution only, not any settlement amount.

Observed B 100-seed calibration: final O mean `4.3891`, cash mean `¥322,251.50`, C/C/C success `0/100`. The principal reason is causal and visible in the ledger: the route begins with zero P/O/A/W; externally observed audiences become P/O slowly under the inherited conversion rates, leaving virtually no affinity queue demand. Performance also rests near the kernel floor (`Q=0.5`) after early shows. This is a balance/input question for a later approved Scenario calibration, not permission to patch the final grade.
