# Chronicle UX flow map

This document routes interface work to the authoritative UX rules. It is not a second UI specification.

## Current UI contract (2026-10-27)

**Read first:** [Chronicle Mobile Web Inbox UI Spec v0.6](design/Chronicle_Mobile_Web_Inbox_UI_Spec_v0.6.md).

It supersedes older Chronicle v0.10/v0.9 guidance **only for mobile-web navigation and player interaction surfaces**. The v1.0 Implementation Pack still governs Runtime, and [v0.10](design/Chronicle_Game_Design_v0.10.md) still governs scenario/story chronology and R1–R4 permissions. Do not turn UI consolidation into a simulation/contract change.

**Inbox = Action + Reports; Modules = read-only Information; Calendar = Schedule; Advance = Simulation.**

- Mobile browser bottom destinations: **Inbox / Calendar / Idols / Groups / Menu**.
- Menu opens a second-level sheet for **Making / Training / Live / Audition / Finance / Policy**. These six modules show data, progress, history and linked records but **never submit changes**.
- Decisions, script-permitted policy/routine tuning and action confirmations occur **inside Inbox event details**. Summary/report messages deep-link to module details. A module may link back to a *permitted* Inbox proposal.
- There is **no separate playable Live or Meeting screen** and no blanket Attend/Delegate workflow. Routine activity is simulated automatically. Optional milestone/post-Live Cheki silhouette artwork is presentation only.
- The compact Hero image with HTML/CSS overlaid date and observable status **scrolls out with the page**. Inbox is the primary scroll surface. The Advance control and fixed bottom navigation respect mobile browser chrome and virtual keyboards.
- Blocking choices stop advance; ordinary reports do not. Read state and decision state are separate.

## Surface routing

| Surface | Responsibility | Authoritative reading |
| --- | --- | --- |
| Inbox | Action, approved editors, report/summary navigation | Mobile UI v0.6 §§3–4 |
| Calendar | Read-only commitments/conflicts and time context | Mobile UI v0.6 §4, v0.10 §§4,6–7 |
| Idols | Member lists/cards, reported status and history | Mobile UI v0.6 §§5–7, v0.10 §§2,8 |
| Groups | Current team and limited contextual group information, not a full industry database | Mobile UI v0.6 §§2,5 |
| Menu | Six-module navigation bottom sheet | Mobile UI v0.6 §2 |
| Making / Training / Live / Audition / Finance / Policy | Read-only information and deep links to corresponding Inbox action | Mobile UI v0.6 §§5–6; v0.10 and Implementation Pack for facts |

## Runtime and story safeguards

- Prologue still follows v0.10's G00–G12 gates, including required scripted audition and 2013-05-24 debut.
- No free-form Audition. R1 tuning is only editable when permitted; R2/R3/R4 chapter/world-fixed permissions persist.
- Reports link to canonical actual event/ledger records; no double Live/Cheki settlement or hidden Performance/Impression display.
- A Scenario event remains hidden from Inbox, Calendar, Live lists and direct
  detail until it reaches `OFFERED`; `DORMANT` and `ELIGIBLE` are internal
  scheduling states, not player-facing previews.
- Producer knowledge visibility and terminology remain constrained by [Terminology v0.2](design/Terminology_ZH_JA_EN_v0.2.md) and the implementation authority.

## Implementation status

Inbox now reads the persisted prologue state and supports the implemented
opening contract editor: Inbox → full-page decision → persisted Scenario and
Finance entries → factual opening report. Reports can link to Live and Finance
read-only detail, but do not mutate state. Live detail shows its contract,
settled participants and event-linked ledger entries only when those facts
exist; an offered or dormant event must not display invented attendance,
Performance, Fan, ticket or Cheki results.

Calendar and the shared day control also read the persisted prologue state and
ledger-derived month reports. Day advance still stops honestly at an
unintegrated persistent Live settlement. Idols/Groups and the remaining
module presentations are incomplete. The v0.6 spec remains an approved UI
target beyond these verified paths; confirm actual code, routes, tests and
persistence before marking its acceptance scenarios complete. Follow
[project tracker](PROJECT_TRACKER.md) and [implementation README](implementation/README.md).

One authored post-debut Scenario Offer is now materialized only after `G05`:
a company invitation to a closed commercial performance. It is a blocking
Inbox accept/decline decision, creates an idempotent decision record, forbids
Cheki, and records neither revenue nor costs at acceptance. An accepted offer
is shown as a future commitment and stops advance on its event day until the
approved completed-Live settlement adapter supplies actual contract and
ledger facts.
