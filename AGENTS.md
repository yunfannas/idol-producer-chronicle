<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Chronicle design context

Before changing Chronicle product behavior, read the relevant navigation file
in `docs/` and then its linked authoritative source. Navigation files are
entry points, not replacement specifications.

- For story-mode scope, chronology, implementation priority, and source
  precedence: `docs/product-context.md`, then
  `docs/design/Chronicle_Game_Design_v0.9.md`.
- For Inbox, Calendar, Members, Manage, mobile interaction, reports, and
  language: `docs/ux-flows.md`, the v0.9 sections it links, and
  `docs/design/Terminology_ZH_JA_EN_v0.2.md`.
- For images, portraits, title art, and visual UI work:
  `docs/art-direction.md`, `docs/design/Visual_Asset_Inventory_v0.1.md`, and
  `docs/portrait-generation.md` when applicable.
- For scenario rules, data boundaries, auditions, Live, finance, and event
  implementation: `docs/game-rules.md`, v0.9, `docs/data/`, and the relevant
  archived note under `docs/design/archive/`.

`Chronicle_Game_Design_v0.9.md` governs Chronicle story UX. The parent game
design and `idol-data-lab` govern inherited engine formulas; do not recreate
or silently alter those formulas here. Treat the pending-integration register
in `docs/game-rules.md` as design input only: it is not a Runtime contract
until it is reconciled into an authoritative specification.
