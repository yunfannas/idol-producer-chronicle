# Chronicle World Palette Trend v0.3 — seeded market trend and saturation

**2026-10-29. DESIGN-AGREED architecture; independently tested candidate numerics TUNABLE; game Runtime NOT implemented or verified.**

## 1. Authority / separation

- This document supersedes the older illustrative 0–100 normalized WorldPopularity/WorldPalette assumption in [World/Live Palette and Impression v1.0](Chronicle_EnvPalette_Performance_Impression_v1.0.md) only for **World generation, state representation, and trends**.
- The [Performance → Impression](Chronicle_EnvPalette_Performance_Impression_v1.0.md) split remains authoritative: WorldPopularity has no effect on member/team **Performance**, only audience-specific **Impression**. WorldSaturation only changes *future* World trend behavior. Onsite LiveSat is separate and read at song start.
- Color order: **R O Y G A B V P**, following Palette v2.1. No Core audience layer.
- Neither the world simulator's eight raw values nor their sum is force-normalized during evolution. No fixed 5–8-year loop, predetermined rotation or forced comeback.

## 2. Eight-color world state — DESIGN AGREED

```ts
type WorldPaletteTrend = {
  weekIndex: number;
  popularityRaw: Record<Color, number>;  // R_c: independent intensity, not sum-to-100
  saturation: Record<Color, number>;     // S_c: long memory, bounded [0,100]
  momentum: Record<Color, number>;       // trend inertia, TUNABLE numerical engine
  trendFocus: Color | null;              // clustered event generator; may change
  rngStateOrCounter: string;             // deterministic save/replay
};
type DerivedWorldUI = { stripe: Record<Color, number> };
stripe_c = sumR > 0 ? 100 * R_c / sumR : 12.5; // uniform fallback if all zero
```

**Only raw `R_c` enters WorldResponse for Impression**. UI may show `stripe_c`, and classify **<10% not popular; >16% popular; >22% viral / 大火** (all relative categories), neutral stripe 12.5%. An apparent dominant stripe does not by itself imply massive absolute Popularity. Never use `stripe` as the WorldResponse input or save it as independently mutable simulation state.

Each new save seeds eight initial popularity, saturation, momentum and trend focus **independently in phase** (correlations allowed through global event budget). Generated history may contain old/current waves; avoid synchronizing all eight new saves at the same phase. Seeded weekly events must be reproducible under loading/skipping weeks. World state is global to the scenario, not one state per idol/group.

## 3. Event model / market competition — DESIGN AGREED shape, TUNABLE numbers

Simulate **small events frequently, large events rarely and exceptional hits very rarely**, as statistical proxy for high-Reputation groups' new popular works and SNS amplification. No requirement to instantiate individual historical NPC releases, or invent attributed real titles.

Candidate reference frequencies from the **16-save × 12-year** prototype: ordinary **~41.8/year**, large **~2.03/year**, exceptional **~0.27/year**, as measured outcomes, **not fixed required yearly quota**. The proto used **~72%** local event concentration on focus color/neighborhood; all figures TUNABLE.

- `trendFocus` creates clustered event color selection, with neighboring colors benefiting; allow random alternative colors and sudden breakthroughs.
- Focus transitions favor relatively under-saturated, less-overheated alternatives, but **no deterministic wheel rotation**, fixed periodic schedule or required coverage.
- Event intensity, frequency, reputation proxy and SNS spread use bounded random draws (possibly heavy-tailed), not one deterministic event each period.
- Limited overall positive event pressure; individual colors retain independent growth/decline and non-identical cycles.
- Keep event shock distinct from stored momentum: an exceptional current event may temporarily overcome high saturation and produce **rare short-lived >50% Stripe**. Do not hard-cap Stripe at 40/50%.
- No lookahead, only already-produced week state; one update per calendar week, idempotent event ledger.

## 4. Saturation / trend / feedback — DESIGN AGREED mechanisms, TUNABLE coefficients

WorldSaturation per color reflects **cumulative exposure plus recent trend acceleration (memory/boredom)**, recovers when exposure falls, and can receive a **soft global-overheating component** from elevated sum of raw R. It never directly acts as an Impression multiplier. Saturation is clipped to [0,100].

```text
sumR = sum_c R[c]
overheat = max(0, sumR/R_total_target - 1)   // target scale TUNABLE
S_next[c] = clip(S[c] + localExposureGain(R,c)
                + recentAccelerationGain(max(0,R[c]-R_prev[c]))
                + globalOverheatFeedback(overheat,c)
                - naturalRecovery(S[c],R[c])
                - highSatRecovery(S[c]), 0,100)
```

Candidate high-Sat recovery from the prior independent prototype:
```text
highSatRecovery(S) = 0.09*max(0,S-87) + 2.5*(S>=99 ? 1:0)
```
This prevents indefinite saturation at 100; **TUNABLE**, never treat as a guaranteed maximum duration. Modest global feedback and faster saturation when a leading color becomes overheated are candidate mechanisms; prior ablation found simply pushing more saturation has sharply diminishing benefit near the 100 cap.

**Validated design direction:** decrease historical **momentum persistence** at high saturation, without cancelling immediate events:
```text
rho(S) = clamp(0.94 - 0.15*max(0,S-65)/35, 0.25, 0.94)
M_next[c] = rho(S[c])*M[c] + Noise[c] + 0.12*EventPulse[c]
R_next[c] = clamp(R[c] + GrowthFromMomentumAndEvents[c]
                  - TrendDecay(R[c],S[c]), R_floor, R_cap)
```
Here **k=0.15** is the agreed **TUNABLE conservative candidate** (not final balance). Other numbers (0.94, 65, 35, 0.25 and 0.12) are from independently simulated prototypes and remain **TUNABLE**. The precise `GrowthFromMomentumAndEvents` and `TrendDecay` implementations belong to a reproducible implementation/fixture; these schematic equations are **not** a license to invent missing functions and claim runtime parity.

**Rare >50% Stripe peaks are acceptable if brief.** Evaluate *duration/frequency*, not absolute maxima. Long-lived color monopoly and synchronized multi-color overheating remain failures. Weak/slow color regeneration and pile-up at the R lower floor are known issues to watch.

## 5. World response → Impression — existing TUNABLE baseline preserved

Use **raw** R, not UI stripe. For each Public/Otaku layer L:
```text
WorldResponse_L(R) = clamp(1 + k_L*(R-40), min_L, max_L)
k_Public = .005; min_Public=.80; max_Public=1.30
k_Otaku  = .0025; min_Otaku=.90; max_Otaku=1.15
```
No WorldSaturation or normalized Stripe in this coefficient. WorldPopularity R=40 is neutral; R=80 gives Public1.20, Otaku1.10. Separate onsite LiveSat penalty has **0.12 Public / 0.20 Otaku at Excess25** and is multiplied *once* into each color's Impression environmental coefficient before SongPalette averaging, using the existing [World/Live Impression v1.0](Chronicle_EnvPalette_Performance_Impression_v1.0.md). No change to actual Team/Member Perf.

## 6. Experimental evidence / scope caveats

This v0.3 candidate followed iterative **independent Python model** tests, **not** Chronicle Runtime verification:
- Event clustering 16 saves ×12y: ~2.48 colors >16% at a time and ~1.04 colors >22%, max observed stripe ~51.2%; small sample.
- Ablation 100 saves ×25y: ~2.51 colors >16%, ~1.02 colors >22%, single-color Sat>=99 ~1.8% color-weeks; a rare max 62.4% still observed.
- Momentum damping paired 60 saves ×20y, first year ignored: **k=0.15 vs k=0** yielded fraction of color-weeks stripe>40% **0.0784% vs 0.235%**; stripe>50% **0.0091% vs 0.0177%**; Sat>=99 **0.54% vs 1.78%**; sumR>500 **3.56% vs 9.87%**. Max stripe was 61.5%, acceptable if infrequent/brief. k=0.30/0.45 were more restrictive but not preferred.
- Impression verification 24 saves ×12y (first year warmup) with k=0.15: without LiveSat penalty, Public world coefficient p05/median/p95 **0.815/1.018/1.270**, Otaku **0.908/1.009/1.135**. Raw popularity at minimum 3 for ≥5% of color-weeks is a **remaining world generator floor-pileup**, not an Impression tuning failure.
- **No representative 4-/12-song Setlist simulation with varying TeamPalette, AudienceShare and Fan Conversion was completed.** Do not claim an integrated balance pass. These numbers are reproducible prototype reports, not empirical Japanese idol market statistics.

## 7. Next implementation / calibration gates

**P0** reproducible world state updater with complete numeric coefficients, initialization distributions, event rates, and deterministic saved seed/week ledger. All eight colors should display plausible cycles without fixed period; include skip-week equals step-week and save/load regression.

**P0** fix/check raw R floor-pileup (minimum of 3 frequent in candidate), and verify it does not cause strange perpetual unpopularity. Avoid converting raw R to Stripe in Impression to hide issue.

**P1** 4-song Taiban and 12-song one-man mixed color setlists, with team-palette tolerance, random initial LiveSat, Public/Otaku exposure and audience compositions; tune too-low <0.6 Impression environments only if they occur at meaningful frequency in normal play.

**P1** connect Impression to attendance/feedback and fan-conversion economics: Impression is subjective quality × existing Perf, not audience count; no extra Palette multiplier in fan conversion.

**P1** materialize historical media Performance snapshot and independent release-time response; no live-specific Saturation on MV/video replay.

**P2** UI trend stripe, relative-label thresholds, chart histories without revealing perfect future forecasts; reproducible scripted starts for chapters.

**Status:** game specification updated, numeric formulas TUNABLE, no Runtime integration or regression claim.
