# Chronicle — Vocal Time-Slice Assignment and Unison Failure v0.1

**2026-10-29 | DESIGN AGREED: explicit relay assignments, time-slice participant cap, solo-as-relay, strong unison error attenuation. Implementation choices and coefficient magnitudes TUNABLE; Runtime NOT implemented or tested.**

## 1. Normative intent and supersession
This spec supersedes the **old default relay = half the lineup; split Part seconds equally** shortcut and treats the earlier separately-modeled `lead` as a single-singer instance of the same scheduled-relay mechanism. It augments [Condition/Part v0.4c](../design/Chronicle_Condition_Fatigue_Part_Kernel_v0.4.md), [Technical Performance v1.2](Chronicle_Technical_Performance_Curves_v1.2.md) and [Performance/Impression integration v0.1](Chronicle_Performance_Impression_Integration_Contract_v0.1.md). No change to song's uniform Vocal/Dance Difficulty, total Part durations, Member/Team Performance isolation, or audience Impression pipeline.

## 2. Explicit chronological vocal assignments — DESIGN AGREED

For every Part with mode `relay` (including formerly `lead`):
- Arrange **explicit named member assignments** in chronological, non-overlapping vocal slices. Each slice names the one actual singer responsible for its interval. Ineligible or nonparticipating member IDs are invalid.
- Number of distinct singers in a Part cannot exceed the number of valid vocal time slices in the Part. A singer may occupy multiple slices; each slice has **one primary singer**, with no implicit additions. Player choices are preserved; Staff may fill unassigned slices using only eligible current song participants, respecting first/second/third priority where relevant. Do not silently replace legal player assignments.
- Solo = all slices of a Part assigned to **the same member**, equivalently a one-singer relay; the historical `lead` label is a UI/authoring preset, not a separate calculation kernel.
- `unison` is the explicit concurrent-choir mode. It has a set of singers singing simultaneously across each indicated interval; their own credited vocal seconds equal actual intervals sung. This is **not** transformed into a relay with one singer per slice.
- All actual performers continue dancing for their real eligible dance intervals regardless of vocal role.
- Part vocal duration is conserved: union of assigned singing intervals equals its authored sung duration (or else an explicit `unfilled`/rest/omission result, never silently fabricated singing). For relay, the sum of singer-specific vocal seconds equals the filled Part seconds. For unison, this sum can legitimately exceed duration, since multiple people sing concurrently.

### Slot length and maximum people — PROPOSED / TUNABLE

A simple default is **5-second vocal slices**, with the final shorter remainder slice when a Part duration is not divisible by 5. The maximum **distinct** relay singers for an isolated Part of length `T` is `ceil(T / slotSeconds)`, also capped at the actual eligible song participants. This yields:

| Part duration | At 5s per slice | Max distinct relay singers (subject to eligible lineup) |
| ---: | ---: | ---: |
| 20s | 4 | 4 |
| 25s | 5 | 5 |
| 30s | 6 | 6 |

This 5s granularity is an **implementation proposal**, not a previously agreed fixed song duration rule or a confirmed physiological singing limit. If later calibration favors 4s, 6s or phrase-boundary slices, change the slice layout/version and recompute per-member vocal seconds. Avoid changing merely to support a bigger group. Slice boundaries should preferably align to actual phrase boundaries if authored, preserving total duration.

### Proposed persistence schema

```ts
type VocalSlice = {
  partId: string;
  startSec: number; endSec: number;  // part-relative [start,end)
  singerMemberId: string;            // required for relay and solo; eligible
};
type PartVocalAssignment = {
  partId: string;
  mode: "relay" | "unison";          // solo represented by relay with one unique singer
  relaySlices?: VocalSlice[];
  unisonSingerIds?: string[];        // when all singers cover entire sung Part
  // Optional non-full unison intervals require separately authored interval data.
  version: string;
};
```

Require contiguous, sorted, non-overlapping slices for filled relay Parts; zero/negative lengths disallowed; resolved, not merely requested, assignments must persist for immutable Live results. If a member drops out, Staff must re-resolve duties and flag insufficient time/eligible singers, not alter fixed song duration or expand singer cap.

## 3. Actual seconds and Condition — DESIGN AGREED

For member m in Part p, `VocalSeconds[m,p] = sum(endSec-startSec)` across their assigned relay slices, or actual covered seconds for unison. `VocalSeconds[m,song]` sums across all real Parts, and enters the existing v0.4c `Wv = 1.9*(VocalSeconds/120)*(VocalDifficulty/12)`. No team-average shortcut when assignments exist. Dance load remains based on full actual dance participation; no phantom vocal seconds for staff recommendations that never sang.

Past fixture "8 member evenly rotated ⇒ 118.75s average" is **a particular schedule fixture, not a universal runtime constant**. Slot count makes the old "roughly half of lineup always relay" obsolete.

## 4. Performance by actual vocal time slice — DESIGN AGREED / NUMERIC OPEN

Every member's vocal performance is evaluated against their **own sung intervals**. Team vocal result aggregates duration-weighted actual slice outputs for relay:
```text
RelayVoicePartQuality = sum_s( duration_s * SingerVoiceExecution[s] ) / FilledVoiceSeconds
```
For solo, every slice has the same member so Team vocal execution follows that member's actual execution. For unison, evaluate the **actual concurrent singer set** and average their own outputs for the overlapping time span; do not sum scores across all singers to give larger teams free performance points.

MemberPartPerf uses the member's **own** local singing/dancing output and credited seconds; it must not use damaged TeamPartPerf × DutyShare. Thus a Pitch failure by A changes A's own vocal contribution and may reduce TeamPerf, never B's independent MemberPerf/Impression.

**Unison error attenuation:** a single singer's Pitch failure is substantially less audible in a chorus than in solo/relay. Apply its attenuation to **the failing singer's local vocal-error component before unison aggregation**; do not change the Bernoulli success/failure probability because of mode, and do not re-penalize other singers. Suggested first test value `unisonErrorPenaltyMultiplier = 0.25` (TUNABLE; 75% reduction relative to isolated solo error). Relay/solo default multiplier 1.00; then normal unison ensemble mean attenuates the single failure further for TeamPerf. Do **not** apply the 0.25 factor again after averaging or to the entire vocal base/Palette/Part.
```text
EffectiveErrorDelta(m,p) = BaseIncrementalErrorDelta * (
  isUnisonAtErrorLocation(p,m) ? 0.25 : 1.00
)
// Base deltas remain 0.30, 0.24, 0.192... per member/song/path,
// each on the actual affected Part and respecting local execution floor.
```
The factor 0.25 is intentionally proposed rather than locked; tune using visible-error realism and 3/5/9/15 member chorus. **Open:** how to assign a single whole-Part-local Pitch failure to a specific slice when the same member has multiple separated vocal slices. Current model can attribute it to one actually sung slice using its duration-weighted location (proposed), and reduce only that member's local vocal output for that interval. Never spread its loss to other members or other Parts.

Agility failures remain member-/Part-local with the established independent dance error path; the requested unison mitigation applies to **vocal Pitch errors**, not to every dancer's Agility error without a separate design decision.

## 5. Key part / Ochi Sabi / assignment semantics

- `ochi_sabi` defaults to one-member solo (relay slice array all held by resolved Lead), no +2 difficulty. Default single-singer Ochi retains the previously agreed extra independent Pitch check targeting Ochi. A normal song-level Pitch failure can also randomly target it; duplicate hits permitted.
- **OPEN:** If the player changes Ochi to relay with multiple unique singers or unison, whether and how the independent Ochi check applies. Do not automatically draw an additional check for every singer.
- first/second/third key duty are fallback priorities for a given required **slice/single-singer slot**, not people singing in parallel. The resolved actual singer and each interval must be persisted.
- Palette Key-Part Contrast reads the correct actual responsible singer(s) and the real duration-weighted duty shares, not all listed priorities. Intrinsic PartExposure stays tied to Part, not to member count or standing.
- The song-level primary Pitch check draws per member (only if any real vocal interval) and, on failure, chooses a Part proportionally to their real vocal seconds. Agility follows real dance seconds. Member's failure effect is strictly local and uses the vocal mode of the actual target interval.

## 6. Deterministic acceptance cases

| ID | Expected |
| --- | --- |
| VA01 | 25s relay Part with 5s slices allows at most five distinct singers; six is rejected |
| VA02 | 20s relay with all slices assigned to A is solo; A credited 20s, others 0s vocal |
| VA03 | 25s relay A=5s,B=15s,C=5s ⇒ their vocal seconds exactly 5/15/5, team voice weighted correspondingly |
| VA04 | Full 30s unison with 9 members ⇒ each gets 30 vocal seconds, ensemble quality is mean not ninefold sum |
| VA05 | A Pitch fails in a 9-person unison ⇒ only A personal vocal contribution changes, team effect diluted by 0.25 then ensemble /9; B impression unchanged |
| VA06 | Same A failure solo ⇒ full local base error delta (before floor); no collective unison reduction |
| VA07 | Both A and B failing in chorus affect only their respective personal contributions, then correctly aggregate team |
| VA08 | Condition Cost uses each singer's actual allocated seconds, not default half-group fractions |
| VA09 | Player changes first-choice singer; live resolves actual assigned interval, keeps player priority and eligible checks |
| VA10 | Saved replay preserves exact slices, errors and performance; changing arrangement version requires recalculating snapshots |
| VA11 | Ochi solo extra check still exists without +2 difficulty; overridden modes do not silently multiply extra checks |
| VA12 | Palette Key Contrast averages real key duty holders by relevant duration; no standing/Center bonus |

## 7. Outstanding calibration

- 5-second granularity, phrase alignment and uneven slot lengths;
- unison Pitch penalty reduction `0.25` and interaction with already-existing 1/N ensemble averaging;
- exact individual vocal/overall performance scaling to avoid cross-team-size bias, while preserving independent personal results;
- error placement within a repeated singer's time slices and local effect on whole-Part vs slice result;
- Ochi mode override eligibility for extra Pitch;
- UI language keys for singing assignment editor and explanation of per-member vocal seconds.

**Status:** rules above are design handoff. All TUNABLE / OPEN items require tests; nothing asserts runtime implementation or calibrated outcomes.
