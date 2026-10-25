# Chronicle Runtime Audit — v0.10 baseline

**Audited:** 2026-10-24  
**Scope:** current `src/` implementation compared with
[Game Design v0.10](design/Chronicle_Game_Design_v0.10.md).  
**Initial result:** the repository started as a mobile UI mock shell, not a
game Runtime. The first implementation pass below adds an explicit local
integration boundary and deterministic orchestration; it does **not** claim to
replace the parent Runtime's hidden Performance, Fan, or Staff algorithms.
The classifications describe executable code only; prose specifications and
mock copy do not count as implementations.

## Evidence inspected

- `src/lib/mock/*`: static Inbox, Calendar, Members, and Manage data.
- `src/lib/game-date-cookie.ts` and `src/app/actions/advance-day.ts`: one
  client-visible date cookie and a one-day server action.
- `src/components/game/game-provider.tsx`: UI passthrough with no game state.
- `src/app/api/inbox/route.ts`: mock feed/empty/error preview endpoint.
- `package.json`: lint/build only; no unit, integration, or E2E test runner
  before this audit.
- `src/lib/runtime/*`: the implementation produced from this audit: condition
  load, per-member Cheki settlement, finance postings, prologue ledger/gates,
  and contract-facing parent Runtime ports.

## Runtime map

| Concern | Classification | Existing executable behavior | Required interface / gap |
| --- | --- | --- | --- |
| Performance | `PARTIAL_CONTRACT` | Parent-spec unified fitness condition and general-load equation are executable. | Approved scoring/Impression Runtime still required; the port stores no player-visible raw score. |
| Fan | `INTERFACE_ONLY` | Completed Live facts and member Cheki lines are handed to an injectable `fans` port. | Public/Otaku/Core, oshimen, conversion and retention Runtime remain absent; no roster-size multiplier was introduced. |
| Cheki | `PARTIAL_IMPLEMENTED` | Per-`live_id` / member / ¥1,000-or-¥2,000 settlement, 20% default share, variable cost and slots are executable. | The parent demand, queue and feedback model must supply actual sales / capacity outcomes. |
| Finance | `PARTIAL_IMPLEMENTED` | Cash, gross operating revenue, real operating costs, capitalized assets and loans post separately; Cheki cannot be net-deducted twice. | Contracts, full financial statements and persistence projections remain absent. |
| Staff / Calendar | `PARTIAL_CONTRACT` | Prologue has a unique live schedule, every Wednesday regular event from 2014-03-05, and a Staff callback. | Legal/conflict checks, reusable plans and automatic date advancement still need the approved Staff Runtime. |
| Event Ledger | `PARTIAL_IMPLEMENTED` | Per-save `save_id + event_gate + scenario_instance` keys, event lifecycle records and replay-safe settlement are executable. | Decision history, persistence and UI projections remain missing. |
| Reports / Weekly Review | `MOCK_ONLY` | Static copy says Performance is hidden, but no facts or host snapshot are recorded. | Live-report projection and weekly aggregation linked to actual ledger facts; host snapshotted at generation. |
| Roster / contracts | `MOCK_ONLY` | Three static founder records; no candidate, active/signed status, payroll tier, contract, or Leader state. | Roster/contract aggregate with 3/5/9/15 route fixtures and action history. |
| Persistence | `PARTIAL_UI_ONLY` | A mutable browser cookie stores an ISO date only. | Versioned save state, snapshot/replay behavior, and server-side integrity boundary. |

## Existing reusable surfaces

The following can remain as presentation scaffolding after a real Runtime is
introduced:

- mobile navigation and page layout;
- Inbox list/detail and tier badge components;
- the existing server-action pattern for a mutation and Next revalidation;
- date formatting utilities; and
- founder asset mapping.

They must read from Runtime projections instead of `src/lib/mock/*` before a
slice is considered implemented.

## Rule conflicts in current mock content

- The Calendar labels the May debut as `JUKEBOX AKIBA`; v0.10 fixes it at
  **2013-05-24 Akasaka BLITZ** and gives it zero ticket revenue and zero venue
  charge under its special contract.
- The mock content is explicitly labelled v0.6 and has no v0.10 activity
  schedule, small-group-only October branch, experimental 2014-01/02 regular
  Lives, or formal weekly regular Lives from 2014-03-05.
- `advanceOneDayAction` advances unconditionally. It cannot stop for a
  blocking decision, execute Staff work, issue a report, or prevent replay.
- Mock Members/Manage/Inbox imply screens, not the underlying approved
  contracts. Their wording must not be used as a Runtime rule source.
- The navigation documents originally pointed at v0.9. They have been updated
  with this audit to point at v0.10, which supersedes conflicting v0.9 rules.

## Implementation outcome and remaining gaps

`src/lib/runtime/runtime.test.ts` adds a Vitest runner and executes deterministic
3/5/9/15 routes from the mandatory interview through debut, experimental and
formal regular Live, graduation/Leader hand-off, One-man and TIF. It also checks
the two-tier Cheki contract, ticket split fallback, fitness load equation,
schedule uniqueness, loan separation and replay safety.

That is an orchestration regression suite, **not yet** an empirical player
playtest: the parent Runtime package/source is still not available as an
importable TypeScript dependency. Therefore actual Performance, Fan conversion,
Cheki demand/queue feedback, and Staff eligibility must arrive through the
declared ports before these tests can produce meaningful cohort, ticket-demand,
or retention calibration output. The missing parent document
`FITNESS_CONDITION_AND_WORKLOAD_SYSTEM.md`, linked by the portable spec, was
also not present in the fetched parent repository; no undocumented recovery or
risk constants were invented.

## Follow-up: persisted UI, day advance, and operating ledger

The Calendar and global day control now read a local Runtime save rather than
the old date-only cookie. `save-repository.server.ts` writes an atomic JSON
snapshot under the ignored `.chronicle-saves/` directory, and the regression
suite verifies a full save/reload round trip.

`advanceWithStaff` advances one to seven JST dates, applies shared weekly
training-room costs and monthly payroll, emits ledger-derived monthly operating
reports, and changes a due routine event through `DORMANT → ELIGIBLE → OFFERED`.
It deliberately stops at `OFFERED`: no parent settlement adapter is available
to produce the actual Performance, attendance, Fan conversion/retention, or
member-level Cheki demand required to resolve the Live. This is the correct
Staff-automation boundary; resolving it with zero or fabricated demand would
make a checkable-looking but false 5/9/15 route report.

## Implementation Pack migration (2026-10-24)

The repository now supplies `docs/implementation/README.md` and its v1.0
modules as the local authority. The earlier “wait for a parent Runtime” gap is
therefore superseded. This first migration adds the executable, replay-stable
eight-color PE/contrast kernel and Fan Market state (`P/O/A_i/W_i`, with no
persisted Core), attendance sampling, weekly aggregate decay, Gamma purchase
intent and product-request step. These are separate from actual Cheki sales:
the shared queue must still determine capacity and completed units before the
Finance ledger posts cash. Remaining technical Fit, EnvPalette bridge, complete
queue/event momentum and Scenario seed calibration stay explicitly
`TUNABLE`/`NOT_IMPLEMENTED` until their v1 contracts are wired end-to-end.
