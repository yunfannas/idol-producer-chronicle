# Runtime audit — B / S3-C

| Area | Status | Runtime evidence |
| --- | --- | --- |
| P/O/A/W/U weekly state | EXISTING | `src/lib/runtime/fan.ts`, `staff-autoplay.ts`; emitted in `weekly.csv` |
| O/P/X capacity partition | EXISTING | `updateFanFromEvent`; emitted in `events.csv` and `attribution.csv` |
| Actual paid Cheki queue | EXISTING | `settleChekiQueue`; emitted in `cheki-member.csv` |
| Finance unique ledger | EXISTING | `resolveLive` / `postLedgerEntry`; emitted in `finance.csv` |
| Free newcomer voucher | NOT_IMPLEMENTED | No current Scenario contract creates a coupon service. Free-mall has zero paid revenue and no queue service. |
| P awareness/friend source | NOT_IMPLEMENTED | Current adapter samples existing P attendance; it does not persist awareness or friend channels. |
| X_idol/X_general split | NOT_IMPLEMENTED | Current X is a residual actual-viewer pool and has no subtype. |
| U-specific decay/reassignment | NOT_IMPLEMENTED | Current U follows aggregate O decay. |

Commands: `npm run test:staff-e2e`, `npm run report:prologue-fan-e2e`, `npm test`, `npm run lint`, `npm run build`.
