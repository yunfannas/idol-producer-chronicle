# Condition / PF / VF / Abnormality v0.4 — unified calculation contract

**Frozen design decisions: 2026-10-28.** Applies to Chronicle runtime; idol-data-lab should treat this as the new forward-looking override of older contradictory Condition/Fatigue sections. Documentation and reference-calibration only; NOT a claim that runtime or historical saves were migrated or tests executed.

## 1. State and precedence

- **Condition C**: the **only** continuous current available energy, range [0,100]. Do NOT split physical/vocal condition.
- **Physical Fatigue PF** and **Vocal Fatigue VF**: persistent accumulations [0,100] produced **only while performing the corresponding activity below Condition 70**.
- **Physical/Vocal Abnormality**: separate discrete none/mild/moderate/severe outcomes **driven by their corresponding PF/VF**, NOT Condition independently. Threshold/risk function below is *provisional* rather than historically validated; do not silently treat as a tested incidence model.
- **Stamina** modifies actual Condition deduction; **Natural Fitness** affects recovery; no extra duplicate PF/VF cost as a second deduction from Condition.
- Per song: compute Performance from song-start states, calculate raw loads and Condition cost, estimate fraction q below threshold, update Condition and PF/VF together at **song end**, then next song starts with resulting state. MC/rest/recovery separately. Each training slot: 0.5h, same sequencing.
- All original Attr, Palette and technical Performance fit, Fame/Impression calculation and existing recovery constraints not overridden here remain in effect.

## 2. Standard song and singing seconds

| id | en UI | ja UI | zh UI | seconds | default mode |
| --- | --- | --- | --- | ---: | --- |
| opening_sabi | Opening Chorus | 頭サビ | 开头副歌 | 20 **optional extra** | unison |
| melo_1 | 1st Verse | 1メロ | 第一主歌 | 25 | relay |
| sabi_1 | 1st Chorus | 1サビ | 第一副歌 | 30 | unison |
| melo_2 | 2nd Verse | 2メロ | 第二主歌 | 25 | relay |
| sabi_2 | 2nd Chorus | 2サビ | 第二副歌 | 30 | unison |
| c_melo | Bridge | Cメロ | 桥段 | 20 | unison |
| ochi_sabi | Ochi Chorus | 落ちサビ | 转副歌 | 20 | lead |
| last_sabi | Last Chorus | ラスサビ | 最后副歌 | 30 | unison |

Intro 15s and outro 5s are *non-vocal*, yet both count for dance. All 7 standard parts exist in a song; opening_sabi exists only on some songs. Normal song: **180 vocal-section seconds + 20 non-vocal = 200 full dance seconds**; with opening_sabi: **200 vocal-section seconds + 20 non-vocal = 220 full dance seconds**.

All eight parts **may override default mode** to unison / relay / lead:
- unison: Attr and member Palette proficiency averaged over actual singing participants; each singer has full part vocal seconds.
- relay: Attr and proficiency averaged over actual relay singers; default Staff selects roughly half the lineup (ceil(N/2) for odd N), distributes part seconds equally among selected; excluded members have no vocal seconds for that part, but still dance if performing.
- lead: Attr and proficiency from the actual resolved single duty-holder only, their vocal seconds = full part seconds; first/second/third are replacement **priority**, not three simultaneous performers. Staff resolves vacant/ineligible slots from legal song participants. Players may choose lead for **any** part. No center/front/back/standing exposure subsystem; use existing PartExposureCoefficient and actual DutyShare.

VocalSeconds(member,song) = sum of actual assigned singing seconds over all parts; the average across an 8-member evenly rotated standard song is **118.75s** (110s mandatory unison + 50s/8 for each 25s relay's total + 20s/8 lead; note unison: 30+30+20+30=110). Per-member actual seconds differ by assignment; never apply group average if concrete part assignment exists.

## 3. Live load → single Condition cost

Let T = full dance duration (200 or 220), D = DanceDifficulty, V = VocalDifficulty, v_m = vocal seconds actually attributed to member.

```text
Wd = 2.0 * (T/200) * (D/12)
Wv_m = 1.9 * (v_m/120) * (V/12)
Wbase_m = 0.5 + Wd + Wv_m
A(C) = 0.67 + 0.10 * clamp((70-C)/30, 0, 1)
Cost_m = Wbase_m * StaminaMultiplier(m) * A(C_before)
C_after = clamp(C_before - Cost_m + RecoveryDuringBoundary, 0,100)
```

Use **linear difficulty** (not difficulty^1.5); Condition feedback is limited to 0.67..0.77 (~15% maximum relative uplift). Apply stamina *before* deducting actual Condition. **Stamina 14 => multiplier=1**. The currently *proposed / regression-calibration* curve for other Stamina is `StaminaMultiplier(s)=1-0.06*(s-14)` for s=12/14/16 giving 1.12/1.00/0.88; DO NOT extend this unbounded linear form to all 0..20 without review/clamp and abnormal values. Natural Fitness does not modify song cost.

One-song calculations use **song-start C** for A(C); 1-song C cannot be reduced twice by PF/VF.

## 4. PF/VF triggered by low Condition only

Let q = fraction of **this song's load/duration** spent at estimated Condition <70, computed from straight-line interpolation between C_before and C_after (without rest). If start/end both ≥70 q=0; both ≤70 q=1; if crossing downward, q=(70-C_after)/(C_before-C_after), clamped to [0,1]. For an anomalous net recovery/upward crossing use actual load trajectory rather than net recovery endpoint. q is a **threshold exposure fraction only**, not a severity multiplier.

```text
deltaPF_live = 0.75 * Wd * q
deltaVF_live = 0.75 * Wv_m * q
PF_after = clamp(PF_before + deltaPF_live - PF_recovery, 0,100)
VF_after = clamp(VF_before + deltaVF_live - VF_recovery, 0,100)
```

Do **NOT** multiply PF/VF by G(C), A(C), or additional low-Condition severity. At same task load and q, PF/VF accumulates linearly independent of how far C falls below70. PF/VF affect future appropriate effective capabilities and abnormality risk; **do not charge their increase as a second Condition cost**.

## 5. Training and rehearsal

Use existing hourly RawLoad source table:
- combined singing/dancing, song rehearsal, dance lesson = 3.0/h;
- vocal lesson = 2.0/h;
- other tasks (recording, media, travel etc.) retain existing source-specific RawLoad rates until separately reviewed.

For each scheduled 0.5h slot:
```text
Wtrain = RawLoad_per_hour * hours
Cost_train = Wtrain * 1.25 * StaminaMultiplier * A(C_before)
C_after = clamp(C_before - Cost_train,0,100)
deltaPF_train = 0.50 * Wphysical * q
deltaVF_train = 0.50 * Wvocal * q
Wphysical + Wvocal = Wtrain
```
Activity load shares: combined training/song rehearsal PF:VF = 50:50; dance-specific 100:0; vocal-specific 0:100. q is same below-70 linear interpolation over that 0.5h slot. **Training Condition multiplier LOCKED = 1.25. Training PF/VF multiplier LOCKED = 0.50**; Live PF/VF multiplier LOCKED = 0.75. Do not multiply PF/VF by training Condition factor 1.25.

Existing staff training-policy guardrails remain: Conservative projected C≥65; Normal ≥55; Aggressive ≥45, plus avoid nonessential training at extremely low Condition.

## 6. Recovery, risks, and non-repeated costs

Retain existing Natural Fitness-based Condition recovery structure and non-overlapping calendar slots:
```text
PostTrainingRecovery >=1h then reserve 0.5h: 3.0 * NFMultiplier
PostLiveRecovery 0.5h: 4.5 * NFMultiplier
FreeBreakRecovery = 3*sqrt(minutes/15)*NFMultiplier
SleepRecovery = 22*(SleepHours/8)^0.8 * NFMultiplier
              *(0.9 + 0.002*Morale)
              *(0.90 + 0.40*((100-Condition_at_bed)/100)^2)
NF14 => NFMultiplier=1
```
PF/VF decay needs slow type-specific recovery and should not be equated with instant Condition recovery. Candidate sleep recovery `PF -= 2.0 * NFMultiplier`, `VF -= 2.5 * NFMultiplier`, once per eligible full sleep, remains TUNABLE. Never double-count the same sleep/free break.

**Abnormalities are consequences of their respective PF/VF**, not independent direct low-Condition rolls. Candidate risk bands (TUNABLE until tested): 0–19 no new event; 20–39 allow mild; 40–69 moderate risk; 70–100 severe risk. Prior proposed daily risk function `p = clamp(0.02*max(0,F-20)/20*RecentRelevantLoadFactor,0,0.15)` is a candidate only, **not locked nor validated**, and must use matching physical/vocal recent load. Persist risk checks and prevent double rolls. Already occurring abnormalities don't disappear just because PF/VF was restored; abnormality severity requires separate recovery. The earlier **single FatigueDebt / low-Condition direct abnormality** design is superseded.

## 7. Deterministic regression fixtures (no MC/recovery)

For comparison only: 8-person lineup; evenly rotated relay/lead; average equivalent vocal seconds=118.75 per member per standard song; C0=100 PF0=VF0=0; NF14; 200s songs; no MC/rest/after-live recovery. Suggested S12/14/16 multipliers 1.12/1.00/0.88. Values below are expected results from deterministic iterative calculation, rounded to 1 decimal:

| songs | V/D | S12 C | S14 C | S16 C | S14 PF / VF |
| ---: | --- | ---: | ---: | ---: | --- |
| 4 | 12/12 | 86.9 | 88.3 | 89.7 | 0 / 0 |
| 4 | 15/15 | 83.9 | 85.7 | 87.4 | 0 / 0 |
| 12 | 12/12 | 60.4 | **64.8** | 69.0 | **2.7 / 2.5** |
| 12 | 15/15 | 51.2 | 56.7 | 62.1 | 6.8 / 6.4 |
| 20 | 12/12 | 31.3 | 39.4 | 47.3 | 14.7 / 13.8 |
| 20 | 15/15 | 14.7 | 24.5 | 34.4 | 21.8 / 20.5 |

Main anchor: 12 songs D12 V12 S14 NF14 => Condition cost **~35**. Results are calculations of *proposed* closed-form formulas, not runtime execution evidence. Real individual member loads require actual per-song assignment and can differ from uniform average.

## 8. Supersession / integration checks

Overrides prior:
- 03D's **no PF/VF and FatigueDebt-only** design;
- earlier 03 Game Design v0.3 §7's **unconditional PF/VF activity accumulation**;
- Chronicle kernel v0.1's `Wraw_song=2+Lv+Ld` with `difficulty^1.5`, and its legacy `A(E)` low-C escalation;
- old key-part rule assigning first/second/third duty to multiple chorus/c-melo key-lines by default (all eight part types now choose mode, only ochi_sabi defaults lead).

Does NOT override unrelated real observations, data provenance, palette v2.1 axes, normal rest policies, member growth or the core distinction between Team and Member Impression.

**Implementation checklists**: code schema/fixtures migration (especially old key-part IDs and any saves), deterministic tests for C/PF/VF at 4/12/20, q crossing at70, per-member relay assignment, opening_sabi extra20, S14 normalization, training 1.25, training PF/VF .50, fatigue-triggered abnormalities, no repeated Condition subtraction. This document freezes intended design; pending tests must not be falsely marked passed.
