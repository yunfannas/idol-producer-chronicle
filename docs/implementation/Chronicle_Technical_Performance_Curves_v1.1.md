# Chronicle Technical Performance — continuous curves v1.1 (candidate calibrations)

**2026-10-28 — TUNABLE NUMERIC PROPOSAL, not historical fact and not yet runtime implemented.** Complements (does not replace) the attribute-specific semantics of [Technical Performance Kernel v1.0](Chronicle_Technical_Performance_Kernel_v1.0.md), the [Performance/Palette/Assignment Kernel](Chronicle_Performance_Palette_Assignment_v1.0.md), and [Condition/Fatigue/Part v0.4c](../design/Chronicle_Condition_Fatigue_Part_Kernel_v0.4.md). This document supplies concrete, versioned, bounded continuous functions for the *previously unspecified numeric degrees of freedom*. Numbers are candidate defaults for deterministic simulation/approval, not LOCKED existing constants. Do not substitute aggregate Ability for attributes.

## 1. Helpers and condition-effective attributes

```ts
clamp(x, lo, hi) = Math.min(hi, Math.max(lo, x))
sigmoid(x) = 1/(1+Math.exp(-x))
effectiveConditionPenalty(C) = 0.06 * clamp(70-C, 0, 50) // C100/70:0; C50:1.2; C30:2.4; C20/below:3.0
Breath_eff = clamp(Breath - effectiveConditionPenalty(C) - vocalAbnormalityPenalty,0,20)
Rhythm_eff = clamp(Rhythm - effectiveConditionPenalty(C) - physicalAbnormalityPenalty,0,20)
Power_eff = clamp(Power - effectiveConditionPenalty(C) - physicalAbnormalityPenalty,0,20)
```

Semantics: **only Breath/Rhythm/Power are normally Condition-sensitive**. Pitch, Tone, Agility, Stage Presence unchanged by normal low Condition. Anomaly penalty is *type-specific* and may not trigger an additional general Condition deduction. Proposed technical anomaly penalties `none=0, mild=0, moderate=1.0, severe=2.5` applied to corresponding activity; vocal to Breath and physical to Rhythm/Power. Existing medical eligibility and execution limits remain primary. **Vocal abnormality must not penalize the physical Dance Rhythm input**; use `Rhythm_eff_sing = Rhythm - conditionPenalty - vocalTechnicalPenalty` and `Rhythm_eff_dance = Rhythm - conditionPenalty - physicalTechnicalPenalty`. This distinction is necessary even though character has one Rhythm attribute.

## 2. Continuous technical baseline (singing and dancing)

For a continuous difference `m=attribute_eff-PartDifficulty`, define:
```text
B(m) = clamp(1 + 0.035*m/(1+abs(m)/10), 0.70, 1.30)
SingingBase = 0.50*B(Breath_eff - PartVocalDifficulty)
            + 0.50*B(Rhythm_eff_sing - PartVocalDifficulty)
DanceBase = B(Rhythm_eff_dance - PartDanceDifficulty)
```
This is a saturating *ratio around 1.0*, not ability points. Difficulty and actual individual attributes are on 0–20. `B(0)=1`. At differences −8/−4/0/+4/+8: B≈0.844/0.900/1.000/1.100/1.156. Attribute 12 performs difficulty12 at baseline1.0; above difficulty improves with diminishing returns, and below difficulty underperforms without instant failure.

## 3. Pitch / Agility continuous failure curve

Respect established approximate anchors: margin +3 <0.5%, +2≈1%, +1≈3%, 0≈7%, −1≈15%, −2≈30%, −3≈50%:
```text
m = Pitch - PitchRequirement       // pitch check
m = Agility - AgilityRequirement   // agility check
pFailure(m) = 1/(1+exp(2.586 + 0.86*m + 0.07*max(0,m)^2))
pFailure = clamp(pFailure,0,1)
FailurePenalty = hasStableSeededFailure ? 0.12 : 0
```
No failure-check bonus for positive margin. Proposed fixed penalty = **0.12 technical ratio points per matching failed check**, TUNABLE. Separate seeded checks per `saveSeed/liveId/songId/arrangementVersion/partId/memberId/checkType`, never reroll after reload. Multiple repeated error chances require explicit singing-note/granularity contract, not unbounded per-second trials.

## 4. Tone and Power: only nonnegative additive technical bonus

```text
ToneBonus = min(0.12, 0.012 * max(0,Tone-10) * ToneRelevance)
PowerBonus = min(0.12, 0.012 * max(0,Power_eff-10) * PowerRelevance)
ToneRelevance, PowerRelevance ∈ [0,1], authored from arrangement (not palette axis tags)
SingingRaw = clamp(SingingBase - PitchFailurePenalty + ToneBonus,0.4,1.45)
DanceRaw = clamp(DanceBase - AgilityFailurePenalty + PowerBonus,0.4,1.45)
```
At maximum relevance: attribute 10/12/16/20 bonus 0/.024/.072/.120. No negative bonus, no Tone in Dance, no Power in Singing, no double-counted Palette/theme score.

## 5. StagePresence factor

```text
StagePresenceFactor(SP) = clamp(0.85 + 0.015*SP,0.85,1.15)
StageExecution = TechnicalExecution * StagePresenceFactor(SP)
```
SP 0/8/12/16/20 ⇒ 0.85/0.97/1.03/1.09/1.15. It affects technical stage expression **once**, distinct from Palette growth `PaletteCapacity = 0.5 + 0.01*SP^2`. Ensemble average member StageExecution **before** computing part means where appropriate; do not apply a second mean SP multiplier.

## 6. Combine voice and dance without double applying exposure

```text
TechnicalExecution(member,part) =
    0.50*SingingRaw(member,part) + 0.50*DanceRaw(member,part)  // when actually singing
TechnicalExecution(member,part) =
    DanceRaw(member,part) // when not singing; no phantom voice participation
```
Each participating member dances full song; vocal participation determined by part mode and credited seconds; when allocating stage performance at part level, evaluate all dancing members and actual vocal singers separately: `PartDanceExecution = mean(all participating dancers)`, `PartVoiceExecution=mean(actual singers)` if any, and `PartTechnicalExecution = .5*PartVoiceExecution+.5*PartDanceExecution` if voice exists, otherwise Dance only. Do not average only selected relay singers for dance. These .50/.50 are **candidate** production weights; individual member impression retains actual DutyShare, not zero-sum standing exposure.

## 7. Arrangement Familiarity and PartExposure: one-place-only

```text
ArrangementExecutionFactor(F) = 0.65 + 0.35*clamp(F,0,100)/100
// F=0,40,60,80,100 -> .65, .79, .86, .93,1.00
```
Apply **once after** BaseQuality and Palette expression; omit `ApplyActualBurdenAndArrangementStability` familiarity penalty if using the above. Keep replacement member's personal preparation separately, but **do not** apply a second identical F loss. Old F maintenance/growth is unchanged.

For existing eight segments provide **salience coefficients** as independent TUNABLE defaults (not a standing bonus):
```text
opening_sabi=1.10, melo_1=0.85, sabi_1=1.00, melo_2=0.85,
sabi_2=1.00, c_melo=1.10, ochi_sabi=1.35, last_sabi=1.20
```
PartExposureCoefficient(part)= `(part_seconds / 180)*salience(part)` for standard 7-section songs; if opening_sabi exists normalize by `200` instead of 180. Its 20s is extra. A song's raw total changes with optional opening only through added singing section and actual 220s dance, not an unbounded raw count. **Exposure is intrinsic segment weight, not a fixed solo/lead bonus**; lead/relay/unison change who is credited via DutyShare, not the intrinsic PartExposure. Any key-part contrast bonuses remain covered by Palette specs and must not be duplicated.

## 8. Example checks / boundedness

- baseline B(−8)=.8444, B(−4)=.9, B(0)=1, B(+4)=1.1, B(+8)=1.1556;
- pFailure(+3)=~.33%, (+2)=~.98%, (+1)=~2.88%, (0)=~7.00%, (−1)=~15.10%, (−2)=~29.61%, (−3)=~49.85%; matches earlier approximate anchors.
- normal SP12, attributes12, difficulty12, ToneRelevance=PowerRelevance=1, no failed checks => Singing=1.024, Dance=1.024, StageExecution=1.05472 (before Familiarity, Part, Palette).
- Low Condition impacts Breath/Rhythm/Power, but not Pitch/Tone/Agility/SP. Different matching anomalies affect only their matching execution path.
- The numerical curves above are deliberately **initial hypotheses**; acceptance requires numerical matrices by attribute 8/12/16/20 × difficulty 8/12/15/18, probabilistic seeded failure rate tests, long Live with Condition and v0.4c recovery, and member/team impression regression. Do NOT claim completed runtime.
