# Failure cases and fixes

## Fixed

1. **Month reports projected final roster/fan state into every earlier month.**
   - Reproduction: B seed 1 before the fix showed eight active members in January.
   - Cause: monthly reports were assembled after completion from the final `PrologueState`.
   - Fix: record a per-month end snapshot in the Calendar loop.
   - Regression: B seed 1 now reports 9 active through April and 8 from May.

2. **Graduation did not move departed affinity into `O_unassigned`.**
   - Cause: `graduateRina()` only marked the member inactive.
   - Fix: added `graduateMemberFanAffinity()` and call it from the canonical graduation workflow.

## Retained observed failures

- **B does not meet the statistical C/C/C target.** All 20 and all 100 B seeds end `E/E/E/E`. This is deliberately retained; no end-state multiplier or synthetic Cheki sale was added.
- **A is debt-distressed in all 20 seeds.** It still resolves TIF and uses actual ten-member lineups, but its cumulative monthly payroll/venue cost exceeds revenue under the provisional Scenario contract configuration.
- **No seed-1 Cheki sale occurs.** This is not an accounting failure: the actual route starts P/O at zero and reaches only 2.72 O by TIF, so no affinity attendee buys a product. The queue and two-tier settlement run, but record zero completed demand.
