# Portrait handling and generation rules

This document is the production checklist for portrait assets. The founder
identity and asset status are governed by the [visual asset
inventory](design/Visual_Asset_Inventory_v0.1.md), which takes precedence over
this document. It does not replace character biography or game design rules.

## Canonical assets and filenames

| Character | ID | Runtime portrait | Source panel |
| --- | --- | --- | --- |
| 星野莉奈 (Hoshino Rina) | IPC1-001 | `public/assets/chronicle/characters/founders/portraits/hoshino-rina.png` | left third of `portrait-triptych.png` |
| 宮原優花 (Miyahara Yuka) | IPC1-002 | `public/assets/chronicle/characters/founders/portraits/miyahara-yuka.png` | centre third of `portrait-triptych.png` |
| 小日向陽菜 (Kohinata Hina) | IPC1-003 | `public/assets/chronicle/characters/founders/portraits/kohinata-hina.png` | right third of `portrait-triptych.png` |

`portrait-triptych.png` remains the untouched source asset. Each runtime file
is a lossless 724 x 724 crop, not a re-drawn interpretation. Use
`character-selection-concept.png` to check card layout, labels, and palette
ownership; it is a UI reference, not an image-generation target.

## Founder lock

The three founders must reuse the existing triptych and its independent crops.
Do **not** generate, redraw, replace, or reinterpret them for another UI view.
The source inventory requires names, stats, and UI controls to remain component
rendered. Any replacement requires explicit art approval and an inventory
update.

## Deliverable contract for new, non-founder portraits

- Generate a square, single-character portrait. Make the master at 2048 x
  2048 or larger; export the runtime PNG at 724 x 724.
- Keep one face and upper torso prominent. The face should sit in the upper
  half, with the chest bow visible and hands allowed to enter the lower/side
  frame.
- Use an opaque, softly illustrated background. Do not add UI, labels, age,
  stat charts, signatures, logos, or watermarks into the image.
- Leave a small quiet edge around the silhouette so the UI can crop it safely
  with `object-fit: cover` and a rounded mask.
- Preserve the shared white-and-powder-blue stage costume: lace/ruffle trim,
  pale-blue ribbons, heart-shaped centre brooch, delicate silver details.
  Individual accessories and background light may vary, but the three should
  read as one debut unit.

## Style lock

Use polished contemporary anime idol illustration: clean fine linework, soft
watercolour-like ambient light, crisp eyes, luminous hair highlights, layered
lace, and a bright-but-not-neon pastel range. Favour a close, welcoming camera
over a fashion editorial full-body pose. The expression must be readable at
56 px, since the same asset is used in the mobile member list.

Do not use photorealism, 3D rendering, chibi proportions, heavy noir shadows,
flat vector art, generic school uniforms, or a visibly different outfit
template. Avoid a collage of multiple people or an in-image card frame.

## Founder identity reference (crop QA only)

| Character | Must preserve | Pose/expression direction | Colour world |
| --- | --- | --- | --- |
| 星野莉奈 | 21; long black twin tails; pink-rose eyes; blue-and-white flower bows, fine hair chains | Warm open smile; confident host energy; reaching hand or microphone is appropriate | blush pink, petal light, cool powder blue |
| 宮原優花 | 17; light warm-brown/blonde side ponytail with loose curls; amber eyes; blue flower bow and heart earring | Direct, social, playful; wink and V-sign are appropriate | buttery gold, peach, warm white, powder blue |
| 小日向陽菜 | 20; very long blue-black hair; blue-violet eyes; blue flower bow and small silver hair pins | Calm, observant, gentle smile; hands together near the chest are appropriate | airy sky blue, pale lavender, cool white |

Do not transfer a hairstyle, eye colour, signature pose, or background palette
from one founder crop to another. This table is for crop and component QA; it
does not authorize a founder variation.

## Prompt recipe

Use this form only for a new, approved non-founder portrait. Add that
character's approved identity anchors to its own design record before using the
template; do not use the founder reference table as generation input. It is not
permission to create a founder variant. Replace only the bracketed fields;
retain the constraints verbatim.

```text
Use case: illustration-story
Asset type: square in-game idol portrait, mobile member card and detail view
Primary request: [CHARACTER] in a [EXPRESSION / STORY MOMENT] portrait.
Subject: [APPROVED NON-FOUNDER IDENTITY LOCKS], upper torso, single character only.
Scene/backdrop: [CHARACTER COLOUR WORLD], subtle bokeh or motif, no environment detail competing with the face.
Style/medium: polished contemporary anime idol illustration; fine clean linework; luminous hair; soft watercolour-like lighting; detailed white-and-powder-blue idol costume with lace, pale-blue ribbons, and a heart centre brooch.
Composition/framing: square 1:1; close waist-up portrait; face in upper half; chest bow visible; safe quiet outer edges; hands may enter the lower or side frame.
Lighting/mood: bright, kind, approachable; readable at small avatar size.
Constraints: preserve the specified character identity and shared costume language; exactly one person; opaque background; no text, UI, logo, watermark, border, or collage.
Avoid: photorealism, 3D, chibi, dark dramatic lighting, school uniform, full-body distant pose, duplicated limbs/fingers, a different founder's hairstyle or palette.
```

## Review checklist

1. Compare the output at full size against the current independent portrait
   and `character-selection-concept.png`; check face, hair silhouette, eye
   colour, accessory placement, costume language, and palette ownership.
2. Check at 56 x 56 and 160 x 160. The eyes, hair silhouette, and core colour
   must still distinguish the founder.
3. Confirm the image is square, contains exactly one character, has no embedded
   text/UI, and has no important detail within the outer 4% crop-safe edge.
4. Save a new revision beside the canonical file (for example,
   `hoshino-rina-summer-v1.png`). Do not overwrite a canonical portrait until
   the UI and visual review both approve the replacement.
