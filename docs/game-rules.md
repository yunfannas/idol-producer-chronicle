# Chronicle game-rule routing and pending integration register

This is a source map for implementation. It does not define new formulas,
events, balances, or mandatory historical outcomes.

## Where to read each rule

| Concern | Authoritative source |
| --- | --- |
| Story scope, chronology, gates, and scenario consequences | [Game Design v0.10](design/Chronicle_Game_Design_v0.10.md), especially §§0–9 |
| Runtime formulas, Fan/Cheki, Performance, Finance and policy | [Implementation Pack v1.0](implementation/README.md) and its linked v1.0 modules |
| Live, Member Feedback, Weekly Review presentation | [Game Design v0.10](design/Chronicle_Game_Design_v0.10.md) §§5 and 8, plus [Feedback rhythm v0.1](design/Feedback_Rhythm_and_Milestones_v0.1.md) where it does not conflict |
| Localization and player-visible naming | [Terminology v0.2](design/Terminology_ZH_JA_EN_v0.2.md) |
| Initial roster calibration and October candidate pool | [data directory](data/) and v0.10 §2 |
| Superseded reasoning or source context | [design archive](design/archive/) and v0.9 only, subject to v0.10 precedence |
| Implementation sequencing | [Project tracker](PROJECT_TRACKER.md) and v0.10 §9 |

Runtime formulas live in the checked-in Implementation Pack. Implement its
`LOCKED` kernels directly; keep its `TUNABLE` and `INTEGRATION_PENDING`
parameters versioned and explicit rather than deriving replacements from old
research prose.

## Implementation invariants

- Story opportunities may be supplied by the narrative; player outcomes,
  attendance, revenue, performance, relationships, and chapter grades are not
  guaranteed.
- Events, contracts, Live results, and payouts require stable per-save
  idempotency and factual references.
- Character dialogue is an interpretation of observed or reported facts, never
  a source of hidden metrics or invented conversion causality.
- Producer knowledge, contractual/school safeguards, and the current scenario
  time bound what a UI may show or schedule.
- A navigation or archive note cannot override a current approved spec.

## Pending integration register

**Status:** user-confirmed design revision awaiting reconciliation into the
authoritative design. It is intentionally non-operative: do not use it to
change Runtime, mock defaults, existing chronology, or character fate until a
versioned update resolves its interactions with v0.10.

### PDR-2026-10-24-01 — character growth and natural departures

The requested revision is recorded exactly as the current design input:

- unified route;
- no forced eight-member lineup;
- the January audition may be deferred;
- October replenishment;
- upper-management recommendations; and
- initial vocal/dance calibration: 成瀬瑠菜 (Naruse Runa) `12/13`, 藤咲美緒
  (Fujisaki Mio) `10/13`.

Required reconciliation before implementation:

1. v0.10 currently requires the January group interview and only applies the
   October company branch to a 3–7-person group. A formal update must state
   which parts change, which remain, and how existing saves migrate.
2. “Unified route,” “deferred,” “replenishment,” and “upper-management
   recommendations” need approved event boundaries, player choices,
   information visibility, and failure/expiry handling. This register does not
   invent any of them.
3. The two `12/13` and `10/13` values must be attached to the canonical data
   schema and source row before use. They do not imply any other attributes,
   traits, contract status, joining date, graduation, or forced narrative.
4. Natural departures must remain character- and evidence-driven. They are not
   a license to add unavoidable departures beyond an approved scenario contract.

When resolved, update v0.9 and the relevant data source first, add the decision
and migration notes to the tracker, then remove or mark this register entry as
integrated.


### PDR-2026-10-25-02 — prologue event, tokutenkai/merch, SNS and external commentary

User-agreed revision and phased plan: [Chronicle Prologue Events / Merch / SNS / Reviews](design/Chronicle_Prologue_Events_Merch_SNS_Reviews_Revision_2026-10-25.md).

**Pending integration, not Runtime authority** until reconciled with v0.10 and Implementation Pack v1.0. In particular the ¥1,500 signed Cheki proposal conflicts with the existing ¥2,000 price tier; honor the existing school/company closed-contract and free-mall-Live rules, and preserve P/O/A_i/W_i (no persistent Core). Review comments must be generated offline from settled metrics without changing the outcome. Update v0.10, Fan/Cheki modules, fixtures, report contract and tracker coherently before implementing.

The isolated C4 newcomer-voucher queue contract is now available only behind an
explicit Scenario switch and uses named TUNABLE values; it does not enable
vouchers in the default B-route or reconcile the wider proposal. See
`docs/implementation/Chronicle_Newcomer_Voucher_Contract_v0.1.md`.
