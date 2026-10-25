# Chronicle UX flow map

This document routes interface work to the authoritative UX rules. It is not a
second UI specification.

## Shared interaction contract

Use [v0.10 §§1, 7, and 8](design/Chronicle_Game_Design_v0.10.md), then the
non-conflicting visual/mobile detail in v0.9 and [the terminology
glossary](design/Terminology_ZH_JA_EN_v0.2.md).
Keep the four mobile destinations—Inbox, Calendar, Members, and Manage—on one
adaptive information architecture rather than building separate desktop logic.

| Surface | Primary responsibility | Authoritative reading |
| --- | --- | --- |
| Inbox | Decision queue and story/report entry point | v0.10 §§1 and 8 |
| Calendar | Future commitments, conflicts, and time advance | v0.10 §§1, 4, 6, and 7 |
| Members | Character list, card, detail, and conversation entry | v0.10 §§1–3 and 8 |
| Manage | Meeting entry points for Making, Training, Live, Audition, Finance, Policy | v0.10 §§1–5 |

## Non-negotiable flow boundaries

- Inbox detail is a full page; only brief irreversible confirmations may be a
  modal. Blocking items stop advancement, while reports and ambient updates do
  not.
- A report may create an action proposal but does not directly mutate world
  state. The path is report → proposal → meeting/module → Staff execution.
- Staff handle routine work under an approved strategy. A strategy change must
  begin at its appropriate meeting; do not turn the game into hourly micromanagement.
- Live, report, feedback, and review share factual references. Never expose
  hidden Performance/Impression or invent individual fan-conversion causes.
- Member Card/List/Detail draw from the same producer-knowledge boundary;
  audition UI shows estimates and qualitative observations, not true 17-attribute values.
- Use natural Japanese character language and the glossary's short UI labels.
  In particular, `Public` is not `新規`.

## Prologue flow checkpoints

The ordered gates, their event/idempotency requirements, and their acceptance
tests live in v0.10 §§6, 7, and 9. Before implementing a checkpoint, read its
source section instead of relying on this summary:

1. G00–G05: founders, interview, selection/contract, strategy, fixed original
   delivery, and the 2013-05-24 debut.
2. G06–G08: the small-group October check, experimental regular Lives, and
   formal weekly regular Lives from 2014-03-05.
3. G09–G12: Rina's graduation/Leader handover, One-man, TIF, and the snapshot.

Pending changes that may alter these checkpoints are recorded—but not made
operative—in [game rules](game-rules.md#pending-integration-register).

## Current implementation boundary

The current application provides a navigable mobile shell with mock Inbox,
Calendar, Members, and Manage content. It does not yet implement the gated
scenario, meetings, true data visibility, Live/feedback loop, or simulation.
Do not label mock buttons or static sample data as completed product flows.
