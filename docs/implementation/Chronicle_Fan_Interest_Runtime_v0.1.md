# Chronicle Fan Interest Runtime Foundation v0.1

## Status

This is the first implementation slice for the authoritative
`Chronicle_Fan_SNS_Interest_Cheki_Spec_v1.5.md`. It establishes persistence,
save migration and pure settlement transactions only. It does **not** claim
that the old C3 Staff autoplay route, its direct Live conversion paths, queue
request sampling, or weekly SNS acquisition are v1.5-compliant.

The C3 route remains an explicit legacy/compatibility fixture until a later
adapter selects v1.5 as a named mode. There is no silent fallback from the new
model into the old direct `Live -> O/A` or fixed trial probability paths.

## Persistent state

`FanState` now owns the required v1.5 fields:

- `followers.team` and `followers.members[memberId]`, initialized to zero;
- `interests[memberId].public` and `.otaku`, each a four-slot oldest-to-newest
  tuple of aggregate expected persons.

Follower counts and Interest are not P/O/A. Initializing or migrating either
state creates no fan, follower, affinity or purchase power. Roster extension
adds zero-valued member entries; graduation removes the departed member's
active Interest/follower slots while retaining the pre-existing temporary-U
fan handling.

## Kernel mapping

`src/lib/runtime/fan-interest.ts` provides:

| v1.5 rule | Kernel |
| --- | --- |
| New exposure creates member Interest, not O/A | `addMemberInterest()` |
| Successful service removes Interest proportionally across age slots | `consumeInterestProportionally()` |
| Four-week expiry, exposure-authorized renewal, then newest-slot append | `settleWeeklyInterest()` |
| Public service success moves P→O and creates A; existing-O success creates only A | `applyCompletedBroadTokutenConversions()` |

`applyCompletedBroadTokutenConversions()` requires an actual completed-service
count. A reservation, a requested queue position, an abandoned request, a
Live observation, SNS reach or a voucher issue cannot create O/A through this
owner. It does not persist trial W.

Population caps are reconciled at the weekly Interest boundary. Event-local
Interest is intentionally not clipped early while a same-week P/O settlement
is still pending.

## Save compatibility and tests

`ensureFanMembers()` upgrades existing fan state with zero-valued v1.5 fields.
`loadOrCreateSave()` invokes it for older local saves before rewriting the
save atomically.

`fan-interest.test.ts` covers zero initialization, newest-slot insertion,
proportional redemption, expiry/renewal, delayed population reconciliation,
completed-service-only P/O/A formation, multi-oshi aggregate A, and roster
extension. Existing full Runtime tests confirm that legacy Staff routes retain
their previous outcomes while preserving the added fields.

## Deliberately pending

1. Named v1.5 Staff adapter mode with direct Live/SNS conversion disabled.
2. Live/SNS/external exposure -> Interest and follower weekly audit.
3. Broad tokuten request generation, W_trial, paid/voucher service integration
   and conversion probability using Fan Service/Appearance.
4. Weekly Interest settlement after actual weekly exposure plus a v1.5
   paired-seed report for the required roster/event scenarios.
