# Chronicle Mobile Web UI & Inbox Interaction Spec v0.6

**Date:** 2026-10-27  
**Status:** Approved product/UI interaction direction; implementation proposed, not asserted complete.  
**Scope:** Chronicle mobile-first browser UX, not parent Idol Producer UX.  
**Source order:** This document overrides `Chronicle_Game_Design_v0.10.md` §§0–1,7–8 **only for interaction surface and mobile navigation**. It does not override the v1.0 Implementation Pack's runtime formulas, chronology, scenario gates, permissions, or Policy R1/R2/R3/R4 restrictions. More specific approved simulation specs remain authoritative.

## 1. Product rule

**Inbox = Action + Reports; six Modules = read-only Information; Calendar = Schedule; Advance = Simulation.**

- Chronicle has **no separate playable Live scene or Meeting screen**, unlike the parent game. All required choices and permitted adjustments are made in Inbox event details, with contextual embedded choice/editor components. The engine automatically executes Live, Cheki, training, production, external work, and finance.
- Do not implement Attend/Delegate as a universal player-facing Live/Meeting interaction. Where a scenario requires presence or agency assignment, express that as a scripted Inbox choice, not an additional gameplay mode.
- The **six informational modules** — Making, Training, Live, Audition, Finance, Policy — never directly edit business state, change strategy, approve contracts, start audition, or submit a decision. They may contain contextual `Open in Inbox` links to a specific permitted action.
- Report and summary Inbox messages link to relevant read-only module pages and deep records. Multi-domain reports may have multiple contextual links.
- The Inbox detail view is a full URL-addressable web page, not a blocking modal. Only brief confirmations may use modal UI.
- No simulation mutation from navigation, opening a report, changing a filter, dismissing a view, or previewing a draft.

## 2. Mobile browser layout

Target 375–430 CSS px first, then responsive layouts for narrow/wide and desktop. Must work in regular iOS Safari and Android Chrome, without fullscreen/PWA installation.

```text
[Browser address / toolbar -- controlled by browser, NOT app]
┌───────────────────────────────────┐
│ HERO (scene illustration ~140-180)│
│   2013.01.07 Mon      Group / Era │  ← HTML/CSS overlay
│   Cash      Fans      Team status │
├───────────────────────────────────┤
│ Inbox            unread / action  │
│ [All] [Unread] [Action]           │
│ BLOCKING: contract decision       │
│ OFFER: Live invitation            │
│ REPORT: weekly recap  → Modules   │
│ AMBIENT: social updates           │
│    ... normal document scroll ... │
├───────────────────────────────────┤
│  Advance day / next important gate│
├───────────────────────────────────┤
│ Inbox Calendar Idols Groups Menu  │  ← app fixed navigation
└───────────────────────────────────┘
[Browser toolbar -- controlled by browser, NOT app]
```

- Hero is **a separate clean background image**; never burn HUD/text/buttons into image assets. Overlay rendered date (JST), current group/chapter, small set of *observable* group indicators, with contrast scrim as needed.
- Hero and HUD **scroll away together** during normal document scroll; neither is sticky. Hero height reference: 140–180 CSS px, subject to responsive art direction and actual browser test. No redundant Next Event / Today's Focus cards between Hero and Inbox.
- Inbox uses the **normal page scroll**, not an independent nested scroll; use sticky/fixed bottom controls without obscuring the last list item.
- Fixed bottom navigation has five destinations: **Inbox / Calendar / Idols / Groups / Menu**. "Idols" includes the player's member views; "Groups" presents limited context appropriate to the current chapter, **not an unrestricted industry database**.
- "Menu" opens a bottom sheet containing exactly six second-level destinations: **Making / Training / Live / Audition / Finance / Policy**. Keep Calendar and member/group access outside this six-module menu. The bottom sheet is navigation, not an editing panel.
- Advance is a global compact control just above bottom navigation (may collapse to one row on short viewports); it is disabled while a required Inbox choice or save/transaction is in progress. Default `Advance Day`; optional multi-day advance must stop at first required gate, preserving v0.10 maximum seven days.
- Use viewport-safe `env(safe-area-inset-bottom)`, `dvh` where appropriate, input focus/keyboard handling, and browser history. Do not paint fake browser chrome as part of the app.
- Tap Inbox while already at Inbox can scroll to top. Preserve message list scroll and filters on returning from details or module links.

## 3. Inbox list hierarchy and card density

Sort unresolved **blocking decisions** first, then actionable proposals/deadlines, followed by reports and ambient messages. Preserve chronological ordering inside equivalent sections; never reorder solely by unread.

- **Expanded** (important): title, brief context, deadline/importance, source and link; reserved for critical story decisions, member requests, contract risks, and milestone reports.
- **Compact** (routine): one- or two-line title, source, time, unread dot; weekly summaries, routine training, SNS, repeated Live result updates.
- Read/unread is independent of actionable, pending/resolved, blocked and expiry status. Reading a blocking message never resolves it.
- Filters: All / Unread / Action; accessibility labels and visible keyboard focus. Color is supporting information, never the sole signal.
- Avoid repetitive weekly confirmations; ordinary approved schedules, Live, training, Cheki and Staff tasks do not consume Inbox decisions.

### 3.1 Interaction templates

1. **Decision:** event details → limited explicit choices → confirmation → idempotent event resolution. Example: accept/decline a specific Live invitation or select contract option.
2. **Editor:** only an **authorized** setting (typically script-allowed R1 routine tuning) → current vs proposed values and projected qualitative tradeoffs → confirm in Inbox → effective-date audit entry. It is NOT a free Policy editor.
3. **Report/Summary:** factual short conclusion, observable key stats, comments where the event has them → deep links to read-only modules → historical reference. Opening report never commits choices.

If user discovers an issue in a module, `Request adjustment` may navigate to or generate the appropriate **eligible Inbox proposal**. It must not silently create unrestricted permissions. For R2/R3/R4 and scenario-frozen settings, show "Fixed by chapter" / read-only explanation instead of actionable edit.

### 3.2 Lifecycle and idempotency

- Separate **read_state** (`unread | read`) from **business_state** (`pending | scheduled | resolved | expired | superseded`). Blocking is a derived time-gate constraint, not a permanent read flag.
- An Inbox action must reference stable `save_id / scenario_instance / event_gate` and the target entity ID (`live_id`, `song_id`, member ID, contract ID, etc.). Submit once, record actor, choice, simulation effective date, ledger link and failure/rollback reason.
- An Inbox report links to existing canonical event/ledger records; it is not its own second settlement. Scheduled ≠ completed; accepted invitation ≠ performed Live.
- The real blocking list is recomputed when Advance runs; old resolved messages must not block progress. Mandatory scripted gates block, ordinary reports never block.

## 4. Calendar and time advance

Calendar remains a **read-only schedule** of dates, accepted obligations, expected next milestone, and collisions. Its links open corresponding Inbox proposals/decisions or read-only Live/Making records. Calendar does **not** edit schedules in place.

Advance Day flow: (1) validate no unresolved immediately required Inbox decisions → (2) execute permitted auto Staff activities/day in JST → (3) settle actual events exactly once → (4) generate linked Inbox decisions, summaries and reports → (5) stop at the first blocking story gate or requested day target. Keep the v0.10 seven-day maximum for multi-day advance.

No separate Live playback or Meeting scene as an obligatory stop. An optional noninteractive milestone illustration, including the previously proposed **post-Live Cheki silhouettes**, may appear in a report/transition without additional time or financial settlement.

## 5. Read-only module information architecture

| Module | Summary / detail / history views | Allowed outgoing interaction |
|---|---|---|
| **Making** | Song library, theme/work details, production state, readiness, release history | Deep-link to eligible song proposal in Inbox |
| **Training** | Member development trends, current schedule, fatigue/condition observations, arrangement familiarity | Deep-link to permitted training-policy proposal in Inbox |
| **Live** | Upcoming and historical event list, contract/venue, attendance, **observable** evaluation, per-member Cheki queue & sales, comments | Open invitation/plan Inbox item; links to Finance/Idols |
| **Audition** | Script-triggered candidate pool/status, assessments with producer-known estimates, intake history | Open *existing scripted* selection/contract Inbox gate; **no free-form recruitment** |
| **Finance** | Cash, income/expense, by-Live ledger summaries, costs, time series, projections clearly marked | Open specific permitted budget/contract Inbox decision |
| **Policy** | Current R1 settings, chapter-frozen R2/R3, world/group-frozen R4, staff arrangement, effective-dated change history | R1 permitted proposal in Inbox; **R2–R4 never editable from normal UI** |

Only observable/reported performance and fan/economic evidence is shown. Do not surface hidden exact attributes, internal Performance/Impression, private affinity probabilities, or unjustified conversion causes. Reputation/Tier visibility is governed by the 2026-10-26 integrated authority cited in v0.10; do not revive superseded "no Tier whatsoever" statements or invent a fully navigable competitor database.

Each module supports lightweight list → detail → history navigation. Avoid duplicated control logic. A module's data may be observationally delayed based on Staff reports/producer knowledge.

## 6. Read-only Live + Finance report example

```text
INBOX: Spring Idol Fes / RESULT
Attendance: 284    Qualitative evaluation: B+
Cheki revenue: ¥xxx (observed ledger)
[Live: detailed event] [Finance: event ledger] [Idols: individual feedback]
        ↓
LIVE / EVENT DETAIL -- read-only
Date, venue, lineup, songs, audience response, per-member Cheki,
queues, selected otaku/public/media comments, other event references.
        ↓
FINANCE / EVENT LEDGER -- read-only
Ticket income, Cheki income, actual expenses, net cash effect,
linked settlement IDs. No second accounting.
```

All numbers in mockups are illustrative, never stored as scenario truth.

## 7. Browser navigation contract

Routes (suggested, implementation path may differ): `/inbox`, `/inbox/:messageId`, `/calendar`, `/idols`, `/groups`, `/manage/:module`, `/manage/:module/:entityId`. Avoid a six-tile primary Home screen.

- Browser Back from detail restores the originating list/filter/scroll if possible; from Module deep link returns to originating report.
- Menu bottom sheet closes with X, overlay, Escape, or browser Back; no false navigation that corrupts history.
- Deep links survive refresh and read persisted save snapshot.
- Large touch targets (approximately >=44 CSS px), readable body text, reduced-motion support, explicit loading/empty/error/no-save states.
- On desktop reuse the same information/permission contract; only adapt columns/navigation presentation.

## 8. Acceptance scenarios

- **UI01:** regular Safari/Chrome portrait, Hero+HUD scroll away; app bottom controls remain usable outside browser chrome and keyboard.
- **UI02:** Inbox filters restore after report→Live detail→Back; direct report links can open Live, Finance, and Idols details.
- **UI03:** none of six module screens expose direct edit/submit; authorized action deep-links back to Inbox.
- **UI04:** R1 limited tuning works in Inbox; R2/R3/R4 cannot be changed outside scripted chapter boundaries; Audition cannot be initiated freely.
- **UI05:** unread blocking decision remains blocking after read; resolved decision unblocks; advance stops at first mandatory gate; normal reports do not block.
- **UI06:** Live and Cheki settle exactly once; result report and linked Live/Finance detail reconcile to the same ledger IDs.
- **UI07:** ordinary Live/Meeting never force a separate playable interface or Attend/Delegate stop.
- **UI08:** hero image swaps without changing UI text or event state; post-Live Cheki silhouettes are presentational only.
- **UI09:** page reload, browser history, virtual keyboard, iOS browser toolbar, small viewport and screen-reader semantics work without losing confirmed choices.

## 9. Integration / migration work

1. Replace legacy UX copy in v0.10 (§0 "meetings decision space"; §1 Manage and Attend/Delegate; §7 gate navigation; §8 report links) **only after code flow is validated**. Until then, this file is the explicitly later UI-specific decision.
2. Update `docs/ux-flows.md` to route to this spec. Remove existing four-destination menu and Meeting interaction guidance as current UX.
3. Audit current mock mobile shell vs runtime; mark unimplemented Inbox choice persistence, linked reports, bottom sheet, deep links and advance blockers as **NOT_IMPLEMENTED** until actually tested.
4. Keep runtime/system contracts in Implementation Pack and story chronology/scenario permissions in v0.10. Do not change economy or actor availability in a visual UI PR.

## 10. Visibility of unscheduled scenario events (2026-10-27 clarification)

**At a new game on 2013-01-07, the player's Live list is empty.** The immutable scenario's prospective event seeds (`DORMANT`) are internal scheduling hints, **not** actual accepted invitations, contracts or player-visible scheduled Lives. Do not display them in Inbox, Calendar, Live or directly linked Live detail URLs merely because a date has been predeclared.

- **DORMANT / ELIGIBLE**: internal scenario metadata; never displayed as confirmed event or upcoming player schedule.
- **OFFERED**: can appear in Inbox as a pending offer/required resolution and may appear in the relevant event-context views clearly marked unconfirmed; cannot be described as completed or legally confirmed simply due to its status name.
- **RESOLVED**: actual executed record; visible in Live history and linked reports, backed by settlement facts.
- For an explicit confirmed future booking, introduce a separate persisted accepted/confirmed commitment status with source, approval and date rather than coercing DORMANT or OFFERED into `scheduled`. Do not create that status casually without aligning story and Runtime.
- A direct URL to a hidden internal DORMANT event must not disclose a player-visible Live detail. Chapter goals can be separately described as goals, **not** Calendar events.
- **Advance 1 Day / 翌日へ** must call a true one-JST-day operation (maximum 1 date, stopping earlier for a legitimate gate); a distinct explicitly labeled multi-day control may use the existing <=7-day capability.
- Until a real Live settlement adapter is connected, do not present an interactive fake settlement or claim the player can complete a Live through UI. Implementation must treat missing adapter as an incomplete gameplay path, not forge accounting facts.

### Additional acceptance tests

- **UI10**: freshly created state has zero visible Live entries in Inbox, Calendar and Live module, and direct DORMANT Live detail links are not accessible.
- **UI11**: pressing one-day advance on 2013-01-07 after required opening decisions advances to 2013-01-08 (unless an earlier genuine block exists), never automatically to 2013-01-14.
- **UI12**: internal historical event seed tables remain intact; newly arranged/persisted commitments become visible only through their own confirmed lifecycle, and actual performance/results appear only after genuine settlement.
