# Chronicle Audience Channel Diagnostic v1

## Purpose and status

`src/lib/runtime/audience-channels.ts` turns the 2026-10-25 design handoff's
candidate channel values into a deterministic C1–C3 test Kernel. It is not a
replacement for the default Staff B-route attendance model and does not claim
that its values are calibrated Runtime balance.

## Test configuration

`audienceChannelDiagnosticV1` uses the documented diagnostic candidates:

- Public awareness: 50%; aware Public purchase: 20%.
- Existing Otaku bringing a companion: 10%.
- Active/intentional Public confirmation after the Live: 35% × clamped Live
  quality.
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
  viewer; callers must provide actual external viewing demand.
- `X_idol` and `X_general` are distinct fields and have separate conditional
  conversion samples.
- Quality applies only after an attendee has been placed in the event.
- The Kernel persists no new fan IDs, Core, awareness cohort, or friend graph.

## Next boundary

The following work is deliberately separate: contract-backed source inputs,
weekly SNS reach, correct same-week overlap across multiple events, and
adapting the persistent Staff B-route to this diagnostic Kernel for 20/100
paired-seed reports. U-specific lifecycle remains independent work.
