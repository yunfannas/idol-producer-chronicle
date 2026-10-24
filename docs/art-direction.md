# Chronicle art direction and asset routing

This is a development-facing index. The authoritative asset status is the
[visual asset inventory](design/Visual_Asset_Inventory_v0.1.md); use it before
adding, replacing, or publishing imagery.

## Current visual source of truth

- `KV-APPROVED` is the approved title visual. The title, language controls,
  and menu are rendered by UI components, not baked into the image.
- `PORTRAIT-STRIP` is the canonical source for the three founders. Current
  runtime crops are derived from it and are not replacement illustrations:
  `characters/founders/portraits/hoshino-rina.png`, `miyahara-yuka.png`, and
  `kohinata-hina.png`.
- `PORTRAIT-PROFILE`, `PORTRAIT-PROFILE-ALT`, and `UI-CARD-LIST` are visual
  concepts only. Their text, numbers, charts, and controls must be rendered
  from data and components.
- External UI reference art is not a Chronicle release asset.

For filenames, intended usage, dimensions, and import limitations, consult the
inventory and [project tracker](PROJECT_TRACKER.md#asset-import-paths).

## Founder portrait handling

Founder identity is locked to the existing triptych. Do not regenerate,
substitute, or silently reinterpret the three characters when implementing a
new view. Reuse the derived independent crops and use component-level masks or
`object-fit` behavior for each view's safe crop.

The reusable production checklist and prompt rules for *new, non-founder*
portraits are in [portrait-generation.md](portrait-generation.md). Any future
founder replacement requires explicit art approval and an inventory update.

## UI and delivery constraints

- Verify mobile safe crops for the title visual; preserve the foreground
  Setlist, microphone, distant idols, and spotlight.
- Keep image placement separate from localized copy and data; no baking labels,
  stats, or interaction affordances into PNGs.
- Use Next's documented local-image path behavior and specify layout dimensions
  or `fill`/`sizes` so images do not create layout shift.
- Treat assets as unapproved for GitHub publication until their paths and commit
  state are confirmed. The tracker retains the current binary-import audit.
