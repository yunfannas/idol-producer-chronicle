# Chronicle Fan Interest Runtime v1.0

## Status

This implements the formal Staff adapter path for the authoritative
`Chronicle_Fan_SNS_Interest_Cheki_Spec_v1.5.md`. `runStaffAutoplayPrologue()`
defaults to named `V15`; C0–C3 are explicit legacy/compatibility fixtures.
There is no silent fallback from `V15` into direct `Live -> O/A`, fixed R1
trial, or legacy newcomer-participation conversion paths.

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

## Staff V15 event and weekly integration

The default Staff route uses one v1.5 chronology:

1. Demand attribution samples P/O/X attendance once. Interest raises P/O
   attendance with the v1.5 additive bounded response; spare capacity never
   creates viewers.
2. Live Performance/exposure creates per-member `I_P/I_O`, not O/A. The event
   ledger records zero direct Live conversion lanes.
3. Interest-backed first trials and established A/W demand use the same real
   queue. Only a completed paid/free service receives the relationship-success
   check and invokes the conversion owner. Vouchers are explicit contract
   authorization for a limited extra free-service allocation; they have no
   revenue and retain real variable cost and queue seconds.
4. The weekly online pipeline deduplicates new P once, then records Followers,
   SNS Interest, renewal and four-slot ageing. New P is not booked twice.

The current operating member schema has no authoritative Fan Service,
Appearance or content-attribute fields. V15 therefore uses the specified
neutral relationship baseline and does not invent substitute attribute keys;
the future expanded schema can replace that neutral modifier without changing
the P/O/A ownership or queue contracts.

## Save compatibility and tests

`ensureFanMembers()` upgrades existing fan state with zero-valued v1.5 fields.
`loadOrCreateSave()` invokes it for older local saves before rewriting the
save atomically.

`fan-interest.test.ts` covers zero initialization, newest-slot insertion,
proportional redemption, expiry/renewal, delayed population reconciliation,
completed-service-only P/O/A formation, multi-oshi aggregate A, and roster
extension. Existing full Runtime tests confirm that legacy Staff routes retain
their previous outcomes while preserving the added fields.

## Calibration boundary

The explicit v1.5 coefficients in `fan-v15.ts` remain TUNABLE. Required
next work is paired-seed calibration/reporting for the roster, high-overlap,
standalone and graduation cases named in v1.5—not reverting to a direct-Live
path or fixing outcomes with unearned P/O/Follower grants.
