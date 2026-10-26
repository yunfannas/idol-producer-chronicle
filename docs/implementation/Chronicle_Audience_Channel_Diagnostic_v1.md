# Chronicle Audience Channel Diagnostic v1

## Purpose and status

`src/lib/runtime/audience-channels.ts` turns the v1.1 candidate values into a
deterministic C2–C3 demand and conversion Kernel. `staff-autoplay.ts` can now
inject it through the explicit `audienceDemand` fixture, so seeded Staff
simulations record event-local demand attribution. It remains opt-in and does
not replace the default Staff B-route attendance model or claim calibrated
Runtime balance.

## Test configuration

`audienceChannelDiagnosticV1` uses the documented diagnostic candidates:

- Public awareness: 50%; aware Public purchase: 20%.
- Existing Otaku bringing a companion: 10%.
- Active/intentional Public confirmation after the Live: 10% × clamped Live.
  This is the calibrated C3 runtime default and is intentionally isolated from
  retention, SNS, Cheki, and external-exposure tuning. Referred/other P has
  an explicit 0% fixture default because v1.1
  requires a lower separate rate but supplies no numerical candidate; it must
  not silently inherit the active buyer rate.
- External idol viewer conversion: 1% × quality (the middle of the documented
  1–3% sensitivity range); external general viewer conversion retains the
  existing 0.4% baseline × quality; remaining external viewers can become P
  at the existing 8% × quality.

The design does not specify an external idol/general mix or whether a referred
companion is already P. v1 makes both splits 50/50 only as named neutral test
placeholders. They are normal config fields and must be revised with the
paired-seed calibration, not treated as canon.

## Invariants

- Existing O, P and external viewers are event-local disjoint counts.
- Referred P is removed before ordinary P awareness/purchase sampling.
- Capacity truncates demand, but an empty seat never creates an external
  viewer. The Staff adapter accepts `externalWatchingDemandByEventId`; omitted
  events receive zero configured external demand (apart from a recorded
  O-referred companion), never a residual-capacity fill.
- `X_idol` and `X_general` are distinct fields and have separate conditional
  conversion samples.
- Quality applies only after an attendee has been placed in the event.
- The Kernel persists no new fan IDs, Core, awareness cohort, or friend graph.

## Current integration boundary

- C2/C3 updates the Fan and Cheki audience inputs from `actualUniqueAudience`
  and exports the full attribution per event. Existing Scenario ticket ledger
  rows remain contract-backed and are explicitly marked
  `ticketSettlementSource: "scenario-contract"`; no ticket income is inferred
  from an external viewer demand fixture.
- C4 vouchers are deliberately disabled while C2/C3 attribution is enabled:
  v1.1 requires a combined touchpoint hazard before both paths can be used in
  the same event.

## Next boundary

The following work is deliberately separate: real contract-backed source
inputs (rather than this test fixture), weekly SNS reach (C1), correct same-week
overlap across multiple events, C4 combined hazards, 20/100 paired-seed
reports, and U-specific lifecycle.
