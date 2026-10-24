# Chronicle Project Tracker

**Canonical design:** [Chronicle Game Design v0.9](design/Chronicle_Game_Design_v0.9.md)  
**Localization glossary:** [ZH / JA / EN v0.2](design/Terminology_ZH_JA_EN_v0.2.md)  
**Visual inventory:** [Approved visuals and concepts](design/Visual_Asset_Inventory_v0.1.md)  
**Feedback spec:** [Live Report → Member Feedback → Weekly Review](design/Feedback_Rhythm_and_Milestones_v0.1.md)

This repository is the **story-mode web app**. Existing working source code is retained. Parent Idol GPT Game Design v0.3 / idol-data-lab govern common game systems. Approved images and numeric calibration files are staged in a separate source archive pending binary upload.

## Implementation tracking

| Phase | Issue | Outcome |
|---|---|---|
| A | #1 | Jan 7, 2013 founders meeting, mandatory interview, 6 AP, uncertain radar, member views |
| A | #2 | Policy meeting, staff calendar, cover songs and training setup |
| B | #3 | Two original songs, choreographer, March commercial Live, May debut |
| B | #4 | Live/Cheki facts, Member Feedback, Weekly Review |
| C | #5 | Oct additions, Dec regular live, July 2014 One-man, Aug 2014 TIF |
| Cross-cutting | #6 | Cashflow, loans, 2-year contracts, finance assets and valuations |
| Art | #7 | Title KV, 3 founder portrait triptych and interactive UI implementation |

## Asset import paths

```text
public/assets/chronicle/title/key-visual.png
public/assets/chronicle/characters/founders/portrait-triptych.png
public/assets/chronicle/ui-references/character-selection-concept.png
public/assets/chronicle/ui-references/profile-layout-concept.png
public/assets/chronicle/ui-references/profile-layout-alt.png
public/assets/chronicle/explorations/…
docs/data/…
```

**Not yet present in GitHub:** image binaries, spreadsheets and the Oct 2013 CSV calibration pool. The import ZIP is prepared outside the repository. Do not refer to these assets as already checked in until a commit is verified.

## Source rules

- v0.9 Chronicle governs story UX; core formulas are inherited, not reimplemented.
- `Public` is awareness, **not** `新規`; never expose imagined individual conversion reasons.
- Narrative opportunity is guaranteed; Live results, audience, revenue and grade are simulated.
- Prologue 2013 Jan – 2014 Aug, chapter evaluation four qualitative grades, historical reference B.

## Import audit (2026-10-24)

**Committed and verified in `main`:**
- Canonical v0.9, glossary v0.2, feedback spec and asset inventory.
- January first-generation CSV and October new-candidate CSV.
- Seven archived design notes under `docs/design/archive/`.

**Not yet uploaded:** 10 PNG image files (key visual, portrait triptych, UI concepts and explorations), 2 XLSX calibration/simulation files, plus the archive-only local manifest / import README and research playtest note. The complete 28-file import archive is retained for binary import. Do not link PNG paths on GitHub until they exist.

**Binary import requirement:** Upload ZIP contents under their paths (e.g. through GitHub web uploader or local `git add` / `git push`). The connector used for this import cannot take a local ZIP/binary file path. Reconcile/skip already committed Markdown and CSV files rather than overwriting newer revisions.
