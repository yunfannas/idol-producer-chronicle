# Chronicle — Performance → Impression / World & Live Palette v1.0

**2026-10-29 | DESIGN-AGREED architecture; TUNABLE conservative calibration; Runtime NOT verified.**

## 0. Authority and supersession
This spec overrides the **old proposed EnvPE / EnvPalette inside PaletteExpression and Performance** pathways in `Chronicle_Performance_Palette_Assignment_v1.0.md` and any conflicting material in Technical v1.2. Preserve Palette v2.1 semantic mapping, PE/Key Contrast and M(PE), independent-member local failures, Condition/Part, and underlying technical algorithms. Existing legacy documents remain for traceability. No additional World/Live palette multiplier may be applied after Impression or in Fan conversion.

## 1. Two-stage immutable boundary — DESIGN-AGREED

1. **Performance** evaluates the actual performance itself. Compute each member's part-local Singing/Dance technical quality (including Condition, failure events), Song Appeal, member Palette Proficiency → BasePE / key-part contrast → **one** `M(FinalPE)`, Part Exposure and Arrangement Familiarity, under the existing Technical v1.2 and Palette v2.1 kernels. Produce `TeamPerf[part]` and `MemberPerf[member,part]` from their respective actual contributions. **No WorldPopularity, WorldSaturation, LiveSat, audience split or media response enters Performance.**
2. **Impression** evaluates audience response to already determined Performance. Read WorldPopularity and existing LiveSat **at song start**; compute per-color environmental coefficients for Public and Otaku, song-palette-weighted averages, then multiply corresponding Team/Member Performance **once**. Public and Otaku are the only audience groups: **no Core**.
3. Member failure isolation is invariant: a failure in A's part changes A's own part Performance (and may change TeamPerf of that part), never B's MemberPerf or MemberImpression, holding B's inputs and audience environment fixed.
4. Live recordings reuse the **captured original Live Performance** without inheriting onsite LiveSat; MV and TV recordings use the **same Performance kernel** with their recording-specific performers, duties, Condition, familiarity and seeded outcome. Each distribution channel derives its own Impression response later. Channel exposure/reach is separate from Impression quality; do not let current popularity retroactively change historical Performance.
5. A completed song's Public/Otaku Impression is calculated against its **pre-song** LiveSat; only after resolving that song do we update LiveSat for the next song. Never let a song cause its own saturation penalty.

Illustrative single-song equations (actual song resolution remains per Part):
```text
TeamPerf_p, MemberPerf_m,p = TechnicalPalettePartKernel(actual performers, song, part)
Env_L,c = WorldResponse_L(WorldPopularity_c) * LiveResponse_L(Excess_c)
SongEnv_L = sum_c (SongPalette_c * Env_L,c)     // sum SongPalette = 1
TeamImpression_L = sum_p (TeamPerf_p * SongEnv_L)
MemberImpression_m,L = sum_p (MemberPerf_m,p * SongEnv_L)
FinalTeamImpression = AudienceShare_P*TeamImpression_P + AudienceShare_O*TeamImpression_O
// Member response can aggregate analogously where needed, using own MemberPerf only.
```
This is **not** `EnvPE → M(EnvPE) → Performance`, nor `M(PE)*M(EnvPE)`. `M(FinalPE)` is the performance-layer Palette expression multiplier, not the environmental Impression coefficient.

## 2. World Palette: popularity & saturation — DESIGN-AGREED structure

Maintain one eight-color `WorldPopularity[c]` (0–100) and `WorldSaturation[c]` as world simulation state. **Only Popularity determines current audience acceptance.** Saturation changes the future *decay rate of popularity*; it never directly multiplies Impression or Performance. WorldPopularity updates from the popularity of **new works released by high-Reputation groups**, amplified by SNS spread, plus decay; model Chronicle background market through a **seeded statistical event generator** without requiring full external group music catalog simulation or fabricating attributed real events.

```text
WorldPopularity_next[c] = clamp(WorldPopularity[c] + NewWorkTrendInput[c]
                         - TrendDecay(WorldPopularity[c],WorldSaturation[c]), 0,100)
NewWorkTrendInput[c] = AggregatedNewWorkPopularity[c] * SNSAmplification[c] // schematic
```
Reputation-weighted event sampling, SNS reach, decay coefficients, decay cadence and initial distributions are **TUNABLE / INTEGRATION-PENDING**. Use game-consistent reproducible seeds, clear chapter cutoffs, and no lookahead to future real-world events.

## 3. Live Palette: ephemeral saturation only — DESIGN-AGREED

`TeamColor[c] = 100 * normalizedTeamPalette[c]` and `SongColor[c] = 100 * normalizedSongPalette[c]` (each eight-color vector sums to 100). `TeamSat[c] = 50 + TeamColor[c]` is the **no-penalty threshold**, not an immediate performance bonus or immutable max storage limit.

At song-start `S_pre[k,c]` is stored/current LiveSat:
```text
Excess[k,c] = max(0, S_pre[k,c] - TeamSat[c])
// Calculate Impression now, using Excess and current WorldPopularity.
S_pre[k+1,c] = 0.70*S_pre[k,c] + 0.50*SongColor[k,c]
```
- `0.70` decay and the fact that updates occur *after* current-song Impression are **design-agreed**.
- `0.50` per-song saturation input is a **TUNABLE working value**.
- Initial `LiveSat[c]=0` at start of each Live; no stored `LiveExpectation`, no persistent `Core`, no unbounded past-set accumulation. Recurrence is a decaying-memory mechanism, not a separate three-song sliding window; older songs decay geometrically.
- At the start of a song, if `S_pre<=TeamSat` for a color, that color suffers **zero** saturation penalty. If `S_pre>TeamSat`, the penalty increases with positive Excess and grows slightly faster as Excess increases (power exponent >1 candidate).
- For repeated pure-color songs, the successive *pre-song* LiveSat values are 0, 50, 85, 109.5, 126.65... For a uniform-eight-color team, TeamColor=12.5 and TeamSat=62.5, so the first two identical pure-color songs have no penalty and the third faces Excess=22.5. Do not confuse start-of-song values with post-song saturation.
- Same `LiveSat` and `TeamSat` for the live; Public vs Otaku have different response functions, **not** separately stored LiveSat.

## 4. Conservative numeric Impression parameters — TUNABLE

Use the following simple starting anchors, not historical facts or locked balance. Each color c and audience L ∈ {Public, Otaku}:
```text
WorldResponse_L(W) = clamp(1 + worldSlope_L*(W-40), minWorld_L, maxWorld_L)
Excess_c = max(0, LiveSat_c - TeamSat_c)
SaturationPenalty_L(Excess) = min(penaltyCap_L,
    penaltyAt25_L * (Excess/25)^1.15)   // 0 when Excess=0
LiveResponse_L(Excess) = 1 - SaturationPenalty_L(Excess)
Env_L,c = WorldResponse_L(WorldPopularity_c) * LiveResponse_L(Excess_c)
SongEnv_L = sum_c SongPalette_c * Env_L,c
```

| TUNABLE coefficient | Public | Otaku | Calibration intent |
| --- | ---: | ---: | --- |
| `worldSlope` | **0.005** | **0.0025** | Public more sensitive to World Popularity |
| `minWorld` | 0.80 | 0.90 | Bound low world acceptance |
| `maxWorld` | 1.30 | 1.15 | Bound high world acceptance |
| `penaltyAt25` | **0.12** | **0.20** | Conservative per-layer loss at 25 excess (less than earlier 0.20/0.35 proposal) |
| `penaltyExponent` | 1.15 | 1.15 | Mildly increasing marginal penalty |
| `penaltyCap` | 0.60 | 0.70 | Prevent negative coefficients |

**Anchor:** WorldPopularity=80, LiveSat=0 ⇒ Public WorldResponse = **1.20**, Otaku = **1.10**. A saturation-free song obtains this Env value if its weighted component colors have W=80. Both values may exceed 1. All saturation penalty coefficients here are **proposed conservative starting points**; tune after seeded scenarios, not pretend user approved precise numbers. Otaku is *more* sensitive to Live Saturation while Public is *more* sensitive to World Popularity.

Sample with W=80 per relevant color:
| Excess | Public Env | Otaku Env |
| ---: | ---: | ---: |
| 0 | 1.200 | 1.100 |
| 10 | 1.150 | 1.023 |
| 25 | 1.056 | 0.880 |
| 40 | 0.953 | 0.777 |

These are direct Impression-layer factors, **not additional PE**, no extra attribute growth or Condition effect.

## 5. Media & audience scopes

- **Onsite Live:** shared song/part/member Performance snapshot, separate Public and Otaku `SongEnv` from live start-state Saturation; then update same LiveSat state.
- **Live recording / clips:** reuse saved `Performance` even if the audience watches later or the original concert's LiveSat had been high. Do **not** initialize a fake onsite LiveSat for replay. Audience-response function for distribution uses a neutral live saturation factor (=1) until a separately approved media-specific environment model exists. May use time-of-view current WorldPopularity; count viewers/reach separately.
- **MV / music show recording:** resolve same Performance kernel on recording day, save fixed result; later impression uses distribution audience parameters (onsite LiveSat inapplicable). Do not assume recordings have identical performance to a concert.
- Existing fan/affinity conversion consumes audience-specific Impression and reach/exposure without another WorldPalette / LivePalette multiply. No additional Core cohort.

## 6. Tests and acceptance

1. Neutral World response W=40 and S<=TeamSat ⇒ `SongEnv_P=SongEnv_O=1`; Performance unchanged.
2. W=80 and S=0 ⇒ Public 1.20 and Otaku 1.10 for each pure-color song (when that color W80).
3. For each audience and color, S≤TeamSat ⇒ no saturation loss; immediate crossing positive leads loss; strictly increasing Excess increases loss until capped. Otaku penalty > Public penalty at same excess before caps.
4. Uniform team eight-color distribution and three repeated pure-color songs: song-start LiveSat 0/50/85; no penalty first/second, third penalized.
5. Mixed song SongEnv = song-color weighted average of its eight environment factors; sums and upper/lower bounds finite.
6. Freeze Performance: changing WorldPopularity, audience shares or LiveSat does NOT change Team/Member Perf. Changing A's pitch failure cannot alter B's member Perf or Impression (same environment snapshot), though TeamPerf changes.
7. Live recording uses original saved Perf; replay with later WorldPopularity changes Impression only, not Perf. MV with its own input resolves a different Perf via same kernel.
8. Sequence: no current-song self-penalty; update saturation exactly once per completed song, replay/load/idempotence.
9. No hidden Core, LiveExpectation, double PE application, duplicate Fan trend bonus, color mismatch, or old ten-color order.
10. WorldPopularity random events are seeded, bounded, generated from high-Rep popular new works and SNS spread, and WorldSaturation affects only subsequent trend decay.
11. Preserve team/membership duty boundaries and all existing legal/medical constraints.

## 7. Open calibration and implementation gaps

- World event arrival rate, work popularity distribution, reputation and SNS response, color growth & WorldSaturation decay;
- confidence intervals for Impression/Fan response under 4/12-song and mixed-palette setlists;
- exact distribution-channel Impression coefficients/reach model; neutral LiveSat is an interim compatibility policy;
- whether any key-part contrast or audience response receives future channel-specific customization: **not in v1.0**.
- Runtime integration and test results not yet verified. All coefficients in §4 are `TUNABLE`.
