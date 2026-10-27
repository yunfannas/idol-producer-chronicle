# Chronicle product context

This is a navigation document for development. It deliberately links to the
authoritative specifications instead of reproducing their rules or numbers.

## Read first

- [Chronicle Runtime Implementation Pack v1.0](implementation/README.md) is
  the current implementation authority for Runtime formulas and contracts.
- [Chronicle Game Design v0.10](design/Chronicle_Game_Design_v0.10.md) is the
  authority for Chronicle story mode, dates and contracts. For mobile web
  interaction surfaces, [Mobile Web Inbox UI v0.6](design/Chronicle_Mobile_Web_Inbox_UI_Spec_v0.6.md)
  takes precedence through [UX flows](ux-flows.md).
  [v0.9](design/Chronicle_Game_Design_v0.9.md) is historical/supplementary only
  where it does not conflict with v0.10.
- [Project tracker](PROJECT_TRACKER.md) maps the work to Vertical Slice A–C
  and records import state.
- [Terminology v0.2](design/Terminology_ZH_JA_EN_v0.2.md) governs player-facing
  Chinese, Japanese, and English terms.
- [Feedback rhythm](design/Feedback_Rhythm_and_Milestones_v0.1.md) is the
  detailed Live Report → Member Feedback → Weekly Review protocol.

The checked-in Implementation Pack is the approved local source for inherited
performance, palette, member-attribute, fan and economy formulas. Do not make
`idol-data-lab` a Runtime dependency or use it to fill a local implementation
gap without an explicit versioned update.

## Product frame

Chronicle is a mobile-first, fictional Japanese idol Producer story mode. The
Inbox is the workbench, daily advancement is the default time unit, and
Inbox details—not standalone meetings or Live scenes—are the decision spaces.
The initial scenario starts on
2013-01-07 JST with the three founders and progresses through the 2014-08
prologue snapshot. See v0.10 §§0–9 for the normative scope.

The Calendar/header and Inbox now read a persisted local prologue Runtime.
Inbox includes the implemented opening contract editor and a factual report
path into read-only Live/Finance details; those surfaces show only persisted
Scenario and ledger facts. This is not an approved replacement for the parent
Performance, Fan, Cheki-demand, or Staff eligibility Runtime: persistent Live
settlement and the remaining meeting modules are still incomplete. Use the
tracker before opening a new implementation stream.

## Source precedence

1. `docs/implementation/README.md` and its linked v1.0 modules for Runtime.
2. v0.10 for Chronicle's prologue and mobile requirements when those
   requirements do not change inherited engine behavior.
3. The terminology, feedback, visual-inventory, calibration, and tracker files
   linked above for their stated domains.
4. Files in [design/archive](design/archive/) for historical context only;
   they never override a current specification.
5. Navigation documents in `docs/` for routing only.

When sources conflict or a later product decision is not yet integrated into
v0.9, record the conflict and request/specify a formal resolution; do not
encode a guessed rule in UI, mock data, or Runtime.

## Development routes

- **Slice A:** 2013-01-07 through the 2013-05-24 debut: audition, strategy,
  production, member Cheki, reports, and a complete ledger.
- **Slice B:** 2013-06 through 2014-03: activity schedule, the small-group
  October branch, experimental/formal regular Lives, and ticket splits.
- **Slice C:** 2014-04 through 2014-08-02: Rina's graduation, One-man, TIF,
  finance, grading, and snapshot. See v0.10 §9.
- **Art:** title visual, founder portraits, and component-rendered character UI.
  See tracker issue #7 and [art direction](art-direction.md).

For UI behavior, continue with [UX flows](ux-flows.md). For rule/data work,
continue with [game rules](game-rules.md).
