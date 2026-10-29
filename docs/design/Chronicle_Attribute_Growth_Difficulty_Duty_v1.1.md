# Chronicle｜Attribute Growth · Difficulty & Duty Gate v1.2

**Status:** DESIGN UPDATE (2026-10-29). This document supersedes the difficulty-neutral **Attribute EXP allocation** portions of `docs/implementation/Chronicle_Member_Training_Condition_v1.0.md` §2 and `docs/design/Chronicle_Member_Training_Condition_Performance_Kernel_v0.1.md` §2. The other training, EXP threshold, aging, scheduling and Condition rules remain unchanged. The numeric constants introduced below are **TUNABLE** until regression-calibrated; do not claim they are already implemented in runtime.

## Objective

- An already-high skill grows meaningfully only when actual repertoire and individual task expose the member to sufficiently difficult work.
- Easier repertoire gives *slow* EXP and can maintain existing skill with sufficient regular qualified activity; no ordinary member loses proficiency solely because her established repertoire is easier than her skill.
- No activity is not maintenance. Occasional appearance must not grant free full-week maintenance.
- Routine/comprehensive and focused technical lessons are also informed by the *member's actual average repertoire difficulty*, not treated as infinite high-difficulty practice.
- Do not introduce member PA, permanent soft cap, extra attributes, or an effect on fatigue-adjusted Pitch. Keep skill EXP separate from Arrangement Familiarity, Palette proficiency, and the L2 historical-rating inference process.

## Existing base EXP (unchanged)

For core attribute `a` in `pitch, tone, breath, rhythm, agility, power, stage_presence, stamina`:

```
RawEXP[m,a,s] =
 EffectiveHours[s] * SourceFactor[s] * AttributeDifficultyFactor[a]
 * FocusFactor[s,a] * WitFactor[m] * AgeFactor[m] * TenureFactor[m]
 * TrainingEnvironmentFactor * CurrentLevelFactor[m,a] * AbnormalityFactor[m,a]
```

Retain all factors and their definitions from v1.0; `AttributeDifficultyFactor = 0.8` for Tone and Agility, else 1.0. Song rehearsal `SourceFactor = 0.5`, live actual skill duty time `=5.0`, comprehensive training `=1.0`; do not count waits, travel, cheki or offstage time. Weekly natural decay: `DecayEXP[a] = 0.7 * max(0, Attribute[a]-10)`.

## 1. Effective challenge by attribute

For a song/session, use the member's **actual duty**, not the whole group's hardest song or nominal position.

- `Pitch, Tone, Breath`: use VocalDifficulty of actually sung passages, weighted by actual vocal duty time and importance. If only song-level difficulty exists, use song VocalDifficulty as a provisional proxy, explicitly flagged lower-confidence.
- `Rhythm`: use the time-weighted relevant Vocal/Dance rhythm demands of participated passages; with only song-level data, use the actual vocal/dance involvement weighted average of VocalDifficulty and DanceDifficulty, provisional.
- `Agility, Power`: DanceDifficulty for actually performed choreography; unused dance time contributes no dance-specific song EXP.
- `Stage Presence`: use performance / exposure responsibility, constrained by overall song difficulty; ordinary team presence alone is not equivalent to lead work. If no calibrated difficulty for stage expression exists, do **not** invent a high difficulty.
- `Stamina`: use *actual sustained physical/vocal workload and participation duration*, rather than automatically copying VocalDifficulty or DanceDifficulty. The existing workload/Condition mechanism remains the authoritative load source.

Part-specific challenge for technical attributes may be approximated from `song difficulty + actual part duty` until part difficulty data is available. Distinguish actual challenge from PartExposure or DutyShare for fan Impression: exposure is **not** automatically a technique multiplier.

**Missing difficulty**: use a conservative provisional baseline or leave challenge unverified; missing must not be interpreted as maximum difficulty. Record the provenance so future L2 calibration can refine this.

## 2. Growth challenge multiplier (TUNABLE initial shape)

Let `A = current Attribute[m,a]`, `D = effective task difficulty[m,a,s]`, `gap = A-D`.

```
ChallengeFactor(A,D) =
  1                                  if D >= A
  max(0.15, exp(-0.60 * (A-D)))       if D < A
DifficultyAdjustedEXP[m,a,s] = RawEXP[m,a,s] * ChallengeFactor(A,D_effective) * CompletionFactor[m,a,s]
```

This controls **growth above maintenance**, not basic maintenance. Examples: A15/D14→0.55; A15/D12→0.17; A18/D14→0.15. Difficult pieces do not automatically grant unlimited bonuses; higher-than-skill difficulty requires actually completing the duty to a credible technical standard and is subject to normal Condition, abnormalities and the existing training rules. The 0.15 / 0.60 coefficients are initial tunables.

## 2.1 Live vocal duty, chorus and verified completion (2026-10-29 revision)

**Design target only; not implemented in Chronicle Runtime.** This design aligns with the general Idol GPT 03K specification at `yunfannas/idol-data-lab/docs/Idol_GPT_03K_Attribute_Growth_Live_Duty_Coach_v0.1.md`.

Live has `SourceFactor=5.0` relative to same-skill, same-difficulty, same effective time ordinary comprehensive training (`1.0`); rehearsals remain `0.5`. The effective hours for **Vocal** are the sum of actual part durations and participation weights:

```
VocalEffectiveSeconds[m] = Sum_over_songs_and_parts(
 ActualSingingSeconds[m,part] * VocalParticipationWeight[m,part]
)
SoloWeight = 1.0
LiveOpenMicChorusWeight = 0.5
NotSingingWeight = 0.0
VocalEffectiveHours = VocalEffectiveSeconds / 3600
```

Actual sung parts must be accumulated across the entire setlist. The weight for harmony, call and substitution is separately tunable. Vocal `DutyShare` for fan Impression must not be reused blindly as singing participation. Simultaneous live singing can contribute to multiple members without artificially enforcing a zero-sum sum of vocal member-hours. Dance duty is independent; Rhythm should avoid double counting overlapping vocal and dance engagement. Exposure alone does not equal proficiency training time.

**Difficulty alone is insufficient for growth**: apply both skill-specific execution quality and genuinely achieved challenge:

```
D_effective[m,a,part] = min(TaskDifficulty[part], CrediblyExecutedDifficulty[m,a,part])
AdjustedEXP = RawEXP * ChallengeFactor(Attribute, D_effective) * CompletionFactor
```

Provisional `CompletionFactor` anchors: solid execution `1.0`; minor errors `0.7–0.9`; substantial failure `0.2–0.5`; no execution `0`. The factors and inference of `CrediblyExecutedDifficulty` are **TUNABLE**, not directly interchangeable with team Impression, satisfaction, or popularity. A member must not farm high-attribute EXP by attempting consistently unachievable parts. Only reduce the skill that actually failed; e.g. singing off pitch is not automatically failed dance technique.

Teacher-led vocal/dance lessons may introduce **documented higher-difficulty technical exercises** beyond the member's usual repertoire, but only for attended instructional time, with Coach/AP/calendar cost. Teacher employment or Focus selection alone is not a free difficulty bonus. Do not introduce staff skill/quality attributes.

## 3. Routine and focused lessons inherit repertoire context

For routine/comprehensive training and focused technical lessons, derive `D_training[m,a]` from the actual repertoire that the member rehearsed/performed or is assigned to learn, using **member-specific duty-weighted average challenge over the last 8 weeks** (including planned active songs in the current training cycle when actually scheduled). Do not use the group's maximum song difficulty, the hardest single solo, or unperformed material.

- When the training plan explicitly includes verified **skill-specific exercises at higher difficulty** (e.g. a documented vocal exercise or advanced dance lesson), their demonstrated difficulty can be used for the corresponding training slot. Merely clicking Focus is not proof of higher difficulty.
- `FocusFactor` (1.45 target vs 1.00 other attributes, or 1.05 no focus) remains as specified; `ChallengeFactor` is applied **once** after the base formula.
- If repertoire is missing, use provisional neutral `D_training = 12` (TUNABLE) and flag as estimated. Do not silently set difficulty equal to the member's attribute: that would bypass the high-skill gate.
- A member changing groups inherits actual attributes/EXP, but the training challenge context changes with the newly practiced repertoire. Re-evaluate the 8-week context as new activity arrives.

## 4. Maintenance floor and no-free-gain safeguard

Compute each attribute's weekly adjusted EXP from training, rehearsals and live. Accumulate `QualifiedHours[m,a]` only from **real, appropriate activity** engaging that attribute, bounded by actual participation. One activity hour can train several relevant attributes under existing source rules, but do not credit an attribute not exercised.

```
QualifiedFraction = clamp(QualifiedHours[m,a] / 4.0, 0, 1)
MaintenanceFloor[m,a] = DecayEXP[a] * QualifiedFraction
WeeklyGrowthEXP[m,a] = max(
    sum_s DifficultyAdjustedEXP[m,a,s],
    MaintenanceFloor[m,a]
)
NetEXP[m,a] = WeeklyGrowthEXP[m,a] - DecayEXP[a]
```

With >=4 hours/week of qualifying work, even easy songs maintain the existing skill (net >=0) but do not guarantee growth; with fewer qualifying hours, normal decay can occur. Four hours is a **TUNABLE calibration anchor**, not a new compulsory schedule. Dedicated training can satisfy the same floor; do not award maintenance once per song, part, or training type. High challenge can still grow normally through the sum of adjusted EXP.

Retain ±100 EXP level change with reset to zero (discard overflow) and attribute 0–20 bounds. The floor is calculated **once per attribute per week**, after all activities and before decay, so maintenance cannot double-count.

## 5. Safeguards and acceptance examples

1. A15, D12 for repeated fully qualified low-challenge songs: slow raw EXP; >=4 qualified h/week prevents natural decline; sustained growth above 15 is hard.
2. A15, D15 or D17 with actual qualifying responsibility: normal EXP and potential growth; no fixed PA.
3. A18, D14: challenge factor near floor; abundant easy work maintains, but is not an efficient path to 19.
4. Member who does not participate gets neither song-based EXP nor maintenance; zero qualifying hours with A15 gives net −3.5 EXP/week.
5. A member only singing does not receive dance-duty Agility EXP from a song; and vice versa. Team-level maximum song difficulty cannot lift every member equally.
6. Basic or Focus training on low-level repertoire also gates high skill growth; a genuinely advanced targeted exercise can override that slot's challenge if documented.
7. Old familiar songs may still gain Arrangement Familiarity independently of the skill gate; no second skill-EXP reward from the same activity.
8. No changes to Pitch under ordinary fatigue, Tier-based PA, role/identity, or historical L2 manual calibration.
9. Test 5x Live factor, solo 1.0, live chorus 0.5, across-song accumulation, completion gating and impossible-difficulty abuse; retain ordinary-fatigue Pitch semantics.\n10. Add deterministic unit/regression tests for difficulty gap, 4-hour maintenance cap, zero participation, per-member duty weighting, and training-only easy repertoire before declaring implementation complete.
