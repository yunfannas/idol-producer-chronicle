# Chronicle — Performance / Impression Integration Contract v0.1

> **2026-10-29 vocal attribution override:** [Vocal Time-Slice Assignment v0.1](Chronicle_Vocal_Time_Slice_Assignment_v0.1.md) specifies named singers per slice, solo as one-member relay, duration-derived duty shares, and reduced unison Pitch-error impact. It supersedes older automatic relay membership and equal division where conflicting; quantitative slice size and unison attenuation remain TUNABLE.

**2026-10-29 — IMPLEMENTATION HANDOFF / DESIGN AGREED constraints + PROPOSED implementation details; NOT runtime proof or calibration.**

## 0. Scope and precedence

Read alongside:
- [Technical Performance v1.2](Chronicle_Technical_Performance_Curves_v1.2.md): song uniform difficulty, part-local errors, singing/dance, Appeal, Condition.
- [World/Live Palette and Impression v1.0](Chronicle_EnvPalette_Performance_Impression_v1.0.md): **Perf first, Public/Otaku Impression afterward**.
- [Palette v2.1](../design/Chronicle_Palette_v2.1.md): 8-color order, PE, member proficiency.
- [Condition/Part v0.4c](../design/Chronicle_Condition_Fatigue_Part_Kernel_v0.4.md): song part structure, real singing seconds, after-song cost, recovery.
- [Performance/Palette/Assignment v1.0](Chronicle_Performance_Palette_Assignment_v1.0.md): actual duty priorities, key contrast, Part Exposure, historical formulations; superseded **only** where incompatible with newer documents.

This document specifies **interfaces, event resolution order, invariants and test requirements**. It does not claim the proposed normalizations or persistence fields have already been approved. Explicit status: **LOCKED DESIGN**, **PROPOSED IMPLEMENTATION**, **TUNABLE**, **OPEN**. Old equations `MemberImpression = TeamPartImpression * DutyShare`, `EnvPE → M(EnvPE) inside Performance`, and old 0.75/0.50 fatigue factors are **not valid current execution paths**.

## 1. Required two-stage result contract — LOCKED DESIGN

```text
actual lineup + legal duty resolution + song arrangement + frozen song-start Condition
  → per-member, per-Part Vocal/Dance execution (independent failures, local deductions)
  → member-owned Part contributions, song Appeal, internal Palette expression M(FinalPE)
  → audience-invariant MemberPerf[m,p], TeamPerf[p] (one performance result)
  → Public/Otaku SongEnv from WorldPopularity & pre-song LiveSat (weighted by SongPalette)
  → MemberImpression[m,L,p] = MemberPerf[m,p] * SongEnv[L]
  → TeamImpression[L,p] = TeamPerf[p] * SongEnv[L]
  → aggregate by Part, audience, actual audience shares as existing outlet requires
  → AFTER current song settles: Condition/PF/VF and LiveSat update
  → event report, once-only fan momentum, exposure and ledger transitions
```

**Guardrails:**
1. No `WorldPopularity`, `LiveSat`, Public/Otaku, `WorldSaturation`, `LiveExpectation` or other viewer-channel keys in Performance input.
2. Only Public/Otaku. Do not restore persistent Core layer.
3. MemberPerf is calculated from the **member's own** singing and/or dancing contribution for the Part, never the team Part result after averaging other members' failures. If A fails Pitch/Agility at Part p, B's MemberPerf and MemberImpression remain identical with all other inputs held constant; TeamPerf[p] may change.
4. No failure penalty, Palette factor, World/Live environment or Condition cost is applied twice.
5. A song's Impression reads **pre-song** LiveSat and WorldPopularity snapshot, then song completion updates LiveSat exactly once. Recorded historical Performance cannot change due to future world trends.

## 2. Member Part quality, Team quality and DutyShare — LOCKED semantics / PROPOSED interface

A Part may have a subset of actual singers and all actual performing dancers. For every actual member and Part, store two **separate** execution contributions:
- `vocal`: only when the member actually sings this Part; includes Breath/Rhythm/Tone/Pitch check and voice-specific Condition/abnormality.
- `dance`: for each performing dancer, even if not singing; includes Rhythm/Power/Agility and physical abnormality.
- `credit`: actual singing seconds/dance participation and assignment mode (unison/relay/lead); a first/second/third candidate is **not** an additional singer.

**Proposed, not frozen normalization:** `OwnPartContribution[m,p] = VoiceOwn[m,p] + DanceOwn[m,p]`, where each own component is weighted by applicable voice/dance share and the same PartExposure, familiarity, appeal and internal Palette factors as TeamPerf. The exact scaling needed to avoid unison N-fold inflation is **OPEN**. Avoid creating per-member opaque `Perf` from `TeamPerf[p]*DutyShare`.

```ts
type MemberPartExecution = {
  songId: string; partId: string; memberId: string;
  vocalSeconds: number; danceSeconds: number;
  vocalExecution?: number; danceExecution?: number;
  vocalErrorIds: string[]; danceErrorIds: string[];
};
type PartPerformanceSnapshot = {
  songId: string; partId: string;
  memberPerfById: Record<string,number>;  // own-result, no cross-member failure leakage
  teamPerf: number;                      // ensemble aggregates actual participants
  exposureCoefficient: number;
};
type SongPerformanceSnapshot = {
  songId: string; arrangementVersion: string;
  memberPartExecutions: MemberPartExecution[];
  partResults: PartPerformanceSnapshot[];
  resultVersion: string;                 // immutable after settlement
};
```

**Test oracle:** create two fixtures identical except A Pitch fails on `ochi_sabi`. Assert:
- A's own `vocalExecution[A,ochi]` decreases; B's vocal/dance contributions unchanged;
- `teamPerf[ochi]` decreases, while `teamPerf[p≠ochi]` unchanged;
- `memberPerf[B,p]` and both `memberImpression[B,Public/Otaku,p]` unchanged everywhere;
- same-song SongEnv unchanged (failure does not modify SongPalette or saturation);
- post-song fatigue/Condition still follows the activity contract, not the random score loss.

## 3. Local failure RNG and part attribution — LOCKED structure / TUNABLE coefficients

Per member per song, Pitch and Agility have their own seeded **primary failure draw**. Pitch requires actual vocal participation; Agility requires dance participation. If a primary draw fails, independently choose the destination Part from that member's **actual corresponding path seconds**, weighted by positive duration; no part-by-part Bernoulli loop. Additional default `ochi_sabi` lead Pitch draw is independent and, on failure, targets that same Part (without default +2 Vocal Difficulty). Other additional checks are not auto-added.

A second failure can land on the same Part. Within each member-song-path, sort failures by target Part timeline and stable tie-breaker, then apply 0.30, 0.24, 0.192... **incremental local** penalties (TUNABLE sizes), with 0.20 path execution floor **per affected member-Part path**. The increasing severity number never becomes a song-wide score penalty.

**PROPOSED deterministic key schema:** `saveSeed/liveId/songId/arrangementVersion/memberId/checkType/drawKind/checkIndex` for failure draws and add `/placement` for failed-primary location. Do not use `partId` in a *primary* draw key before a Part has been selected; extra fixed-Part checks can include `partId`. Persist event ID, selected Part, draw kind, failure flag and applied incremental penalty in immutable resolved song outcome. Guarantee identical results on reload; do not reseed from wall clock or UI iteration order.

**OPEN:** extra independent Ochi Pitch check when user overrides Ochi lead mode to relay/unison; current guaranteed extra check is for default Lead's actual duty holder only. Also open: final upper clamp of technical execution (old 1.45 conflicts with ability20 baseline1.587).

## 4. World / live inputs and update timing — LOCKED structure

World: current 8-color `WorldPopularity` directly informs audience acceptance. `WorldSaturation` only affects future world-popularity **decay**, not current Performance, Impression or additional post-factor. Seeded statistical new-work events are generated from high-Reputation group popular releases with SNS amplification, not invented real historical song claims. World update cadence, distributions, starting values and decay function are **TUNABLE / OPEN**.

At each new Live, initialize `LiveSat[c]=0`. Team and song palette each sum to 100 on the eight fixed Palette v2.1 codes:
```text
TeamSat[c] = 50 + TeamColor[c]
Excess[c] = max(0, LiveSat_preSong[c] - TeamSat[c])
Env[L,c] = WorldResponse_L(WorldPopularity[c]) * LiveResponse_L(Excess[c])
SongEnv[L] = sum_c SongPalette[c] * Env[L,c]     // SongPalette proportions sum 1
LiveSat_afterSong[c] = 0.70*LiveSat_preSong[c] + 0.50*SongColor[c]
```
The 0.70 attenuation, TeamSat shape, pre-song lookup and post-song update are **LOCKED DESIGN**; saturation input 0.50, World/Live response slopes and caps are **TUNABLE**. Use the conservative Public/Otaku table from EnvPalette v1.0: **Public more World-sensitive; Otaku more LiveSat-sensitive**. All coefficients can yield `SongEnv>1`; it is not exclusively a penalty.

**Update order:** freeze per-song world and LiveSat inputs once, compute immutable Performance, compute both audience Impressions, then advance LiveSat and Condition/PF/VF **once**; every next song reads the new state. Do not let same-song state update leak into the current result. For concurrent/non-concert outlets, LiveSat is not applicable.

## 5. Recorded media and Fan interfaces — LOCKED boundaries

- Live recording and edited clips reuse original immutable Live Performance snapshot, NOT the concert Impression, and NOT concert LiveSat.
- MV / TV music performances use the same Performance kernel with actual recording circumstances, generating a separate immutable Performance snapshot; later distribution cannot reroll technical failures.
- Any replay or publication creates a channel-scoped Impression event using audience-specific response and audience reach. Current WorldPopularity may affect this event; no invented venue LiveSat. Default neutral Live response for media is a **provisional compatibility policy** pending explicit media coefficients.
- Do not postprocess channel Impression by applying `M(FinalPE)` again. Fan acquisition uses the resulting Impression and exposure/reach once. Impression alone is not a viewer count.
- Publication idempotence: media IDs and distribution event IDs must distinguish repeat posting from retrying the **same** post; replay of the same event must not trigger new reach/fan gains.

## 6. Concrete acceptance suite for code / PR

| ID | Invariant |
| --- | --- |
| PI01 | World and Live state changes alter Impression, never stored Performance |
| PI02 | A's failure in Part p changes no B member Perf/Impression, and no other Part |
| PI03 | Song Pitch draw failure is assigned only to an actual sung Part; Agility only actual danced Part |
| PI04 | Duplicate failures in same Part accumulate using stable time-index ordering and local path floor |
| PI05 | Ochi default Lead extra check binds to Ochi; no +2 difficulty |
| PI06 | 8-color vectors use current R O Y G A B V P index; no Core, no LiveExpectation |
| PI07 | WorldSaturation influences only future WorldPopularity decay |
| PI08 | SongEnv = weighted color response, Public/Otaku independent; no double M(PE) or after-Fan bonus |
| PI09 | Same pure-color song played twice under uniform team at beginning has no excess; third starts with 85 LiveSat |
| PI10 | End-song LiveSat update, repeated Load/Replay without repeated shift, and per-song frozen input |
| PI11 | 0.70 decay and 0.50 input fixed for regression fixture; 0.50 marked TUNABLE |
| PI12 | Media reuse original Perf but compute distribution-specific Impression |
| PI13 | 4/12/20-song Condition/PF/VF tests conform to latest v0.4a/b/c coefficients; no second Condition deduction |
| PI14 | Member scores for unison, relay and solo use own components, not an averaged damaged team Part result |
| PI15 | ExpectedImpression / Satisfaction receives resolved Team Impression once; no new World/Live multiplier |

## 7. Remaining decisions / no silent implementation

- **P0: Actual Member/Team Part normalization**: precise vocal/dance share in unison, relay, lead, and teams of size 3/5/9/15; keep own failure isolation, preserve team result independent of N inflation.
- **P0: Historical schema migration**: replace old shared-Team-Part-derived Member Impression outlet without changing save / economic data silently.
- **P1: World seeded simulator coefficients**: rates, Reputation sampling, new work palette source, SNS amplification, decay cadence and WorldSaturation decay formula; record explicit simulation assumptions.
- **P1: Media impression/reach**: channel-specific response and repost cadence; preserve performance snapshot.
- **P1: Ochi mode override and extra Pitch**: formal qualification when Ochi is no longer Lead.
- **P2: Staff auto-duty scoring and penalties**: rank without overriding legal player first choices.
- **TUNABLE balance**: Appeal curve, 0.50 LiveSat input, environmental per-layer slopes/penalties, PartExposure, technical upper clamp, relationship to actual audience weights.

**Status:** This is a complete executable handoff of already-agreed invariants, NOT a declaration that OPEN parameters are resolved or tests have run. In particular, the own-contribution normalization remains open instead of being replaced with a guessed weighted formula.
