# Chronicle Newcomer Voucher Contract v0.1

## Status

This implements the C4 free-newcomer-service path from the 2026-10-25
acquisition handoff. It is deliberately an explicit Scenario test contract,
not a silent change to the Staff B-route baseline. The default
`newcomerVoucherTrialV1.enabled` is `false`; callers must opt in through
`runStaffAutoplayPrologue({ newcomerVoucher: ... })` while event authorization
and balance values remain TUNABLE.

## Contract and boundaries

The current first slice accepts actual external X viewers only. P awareness,
friend referral, and X-idol/X-general attribution require their own approved
input sources and remain outside this contract. A voucher is created only when
the caller enables it **and** the completed event already permits Cheki. The
free mall therefore cannot acquire a paid or free service queue by accident.

The explicit parameters are:

- `externalUptakeProbability`;
- `conversionProbability`, multiplied by settled Live quality;
- `serviceSeconds` (the current test fixture uses 20); and
- `variableCostJPY` (the current test fixture uses ¥180).

They are recorded as TUNABLE test values, not historical assertions or an
approved product menu. The existing 5-second member-change overhead is still
applied by the shared queue.

## Settlement sequence

1. Actual external audience is partitioned into voucher requesters and normal
   external viewers, so a requester cannot receive a duplicate X conversion.
2. Voucher requesters and paid Otaku orders enter the same per-member queue.
   A completed free service takes the configured time plus the existing
   handoff overhead; queue rejection records a lost free trial.
3. A completed free service has `gross=0`, `memberShare=0`, and no paid Cheki
   unit. It posts only its explicit variable cost once to Finance.
4. Only a completed free service can enter the voucher conversion sample. Each
   conversion is attached to the actually served member, then enters the
   existing weekly `externalToOtaku` and initial-affinity momentum. No fan ID,
   Core field, or parallel long-term Fan state is added.

## Code and tests

- Shared queue and free-service accounting: `src/lib/runtime/regression.ts`.
- Scenario adapter, Fan momentum, and cost ledger: `staff-autoplay.ts`.
- Queue and full B-route deterministic checks:
  `regression.stress.test.ts` and `staff-autoplay.test.ts`.

The tests verify zero gross/member share, queue time limits, shared-queue
completion, conversion only after completed service, one cost ledger path,
free-mall prohibition, and deterministic replay.
