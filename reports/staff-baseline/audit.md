# Staff autoplay E2E audit

Run date: 2026-10-25. Baseline: `9d47ecb` plus this worktree's integration changes.

| Area | Status before | Status after | Evidence |
| --- | --- | --- | --- |
| Prologue Calendar / event lifecycle | `PRODUCTION_CONNECTED`, but gate-only | `PRODUCTION_CONNECTED` through `runStaffAutoplayPrologue` | `staff-autoplay.test.ts` |
| Staff / Lineup | `FIXTURE_ONLY` (operating v3) | Adapter invokes all-member 3–10 roster rule and 10-member A rotation | E2E route tests |
| Performance | `FIXTURE_ONLY` (operating v1–v3) | Adapter invokes `resolveOperatingPerformance` per completed Live | E2E event audit |
| Fan / Cheki | `FIXTURE_ONLY` / optional Prologue port | Adapter invokes `settleChekiQueue`, two-tier settlement and weekly decay | E2E event audit |
| Finance | `PRODUCTION_CONNECTED` ledger primitive, no scenario contract bridge | Ticket, venue, payroll, training and Cheki entries are posted through the idempotent ledger | B seed 1 ledger summary |
| Graduation | active roster only | fan affinity is transferred to temporary unassigned state | `graduateMemberFanAffinity` |
| Month report | ledger-only with final-state leakage | month-end P/O/roster snapshots | `staff-autoplay.ts` |

Commands actually run:

```text
npm ci
npm test                         # 44 tests, passed (pre-100 E2E test addition)
npm run test:staff-e2e           # 5 tests, passed; includes B 100 and A/B/C 20
npm run build                    # passed
```

The Staff adapter has explicit `staff-autoplay-scenario-v1` TUNABLE contract terms because v0.10 supplies dates/types but not every venue capacity, ticket amount, rent, or outside audience. It has no end-state-dependent subsidy, fan injection, or grade override.
