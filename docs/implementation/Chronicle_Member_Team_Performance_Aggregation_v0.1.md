# Chronicle — Member / Team Part Performance Aggregation v0.1

**2026-10-29 | Integration proposal.** Structural constraints are DESIGN AGREED, normalization below is **PROPOSED / TUNABLE**, not user-frozen balance or implemented Runtime. Read with Vocal Time-Slice Assignment v0.1, Technical Performance v1.2, Palette v2.1 and World/Live Impression v1.0.

## 1. Core concept: own performance versus allocated contribution

Keep two distinct quantities:
- `OwnQuality[m, p, path]`: actual member's quality when performing that path (vocal/dance); never calculated by copying an averaged team score.
- `CreditedPerformance[m, p, path]`: own quality * allocation across time, normalized to the **Part duration** and simultaneous duty counts. Its sum yields TeamPartPerformance, without N-fold inflation.
- `MemberPerf[m,p]` is the sum of member's credited paths **for this shared Part-performance accounting**. A member-profile display of intrinsic quality should use `OwnQuality`, **not** compare this contribution-weighted number across different lineup sizes without contextualization.

For each Part p, divide time into atomic non-overlapping intervals bounded by all singer/ensemble/dancer membership changes and existing phrase/assignment slices. Let total authored sung time `T_v,p > 0` and dance-active time `T_d,p > 0`. Actual singing participants in interval i are `V_i` (relay: exactly one; unison: one or more). Actual dancing participants are `D_i` (may include nonsingers).

For member m, interval i, path a∈{vocal,dance}, compute `Q[m,i,a]` using the current technical/Palette/Appeal/Familiarity kernel, with member-specific errors and the selected local execution path. **Q is computed from m's own inputs only**; any shared arrangement/key Part coefficient must be frozen before the individual failure draws or be otherwise independent of other members' failure events. Every independent member's Q stays unchanged when A alone fails.

For ease of integration below, assume Part common exposure `E[p]`, and a **single** intrinsic Palette expression factor per eligible member interval applied as part of `Q`, not again post-aggregation. Any non-linear team-wide Palette factor whose value changes because of one member's failure would breach failure isolation and requires an explicit design exception.

## 2. Candidate exact aggregation (member-owned, team-conservative)

Let `w_v` and `w_d` be Part's current vocal/dance mixture weights (`w_v+w_d=1`), using existing kernel calibration; **do not invent a new locked weight here**.

```text
VocalCredit[m,p] =
  E[p] * w_v * sum_i(
      duration_i/T_v,p * indicator(m in V_i) * Q[m,i,vocal]/|V_i|
  )
DanceCredit[m,p] =
  E[p] * w_d * sum_i(
      duration_i/T_d,p * indicator(m in D_i) * Q[m,i,dance]/|D_i|
  )
MemberPerf[m,p] = VocalCredit[m,p] + DanceCredit[m,p]
TeamPerf[p] = sum_m MemberPerf[m,p]
```

These are **PROPOSED** exact accounting equations. In normal fully covered Parts, team path components equal the duration-weighted ensemble mean; increasing lineup size alone never increases the team score. In relay, each slice has one singer, so their duration shares add to one. In solo, the one singer owns the Part's entire vocal credit. In unison with N singers, each singer obtains 1/N of simultaneous vocal credit **but individual Q remains unaveraged and independently testable**. Dancers are distributed by actual dance interval participation count; nonsingers retain a separate dance credit if they perform dance.

**Coverage edge:** If `V_i` or `D_i` is empty, that interval has zero credit and a coverage flag; do not divide by zero, renormalize away missing seconds, or silently fabricate an absent duty holder. Part zero-vocal sections (intro/outro) have no vocal denominator/path; count only dance-active intervals and existing score exposures. If the existing song kernel represents no-dance or instrumental intervals differently, preserve those authored rules instead of forcing w_v+w_d over a nonexistent path.

**Allocation invariants:** sum_m credits = team Part result by construction, for each path separately. Because MemberPerf is built only from member Q, allocations and independently frozen shared coefficients, A's error leaves B's MemberPerf unchanged. TeamPerf drops by precisely the change in A's credit.

## 3. Worked fixtures (quality units, illustrative—not final Impression)

Ignore dance, exposure and Palette differences solely to expose allocation math, set `E=1,w_v=1`.

- **25s relay, A:5s Q=1.2, B:15s Q=0.9, C:5s Q=1.1:** A credit .24, B .54, C .22, TeamPerf=**1.00**. B loses .30 in its own 15s slot: B credit becomes .36, team=.82, A and C unchanged.
- **20s solo, A Q=1.2:** A credit=1.2; TeamPerf=**1.2**; all others zero vocal credit.
- **30s 9-person unison, all Q=1.0:** each member vocal credit=1/9, TeamPerf=**1.0**, not 9.0. One A incurs base Pitch execution decrement .30, with candidate unison coefficient .25 ⇒ A Q falls to .925 (if no floor). A credit falls by .075/9=**.00833**, TeamPerf=.99167; B's Q and credit remain 1/9. In identical solo, decrement=.30 without unison attenuation.
- **Partial unison:** if 15s sung by four members and next 15s sung by one lead, each of first four receives 0.5/4 of its own Q and lead receives 0.5 of its own Q, unless the lead is also among first four, in which case its credits add.

**Caution:** `Q` may not be directly linear in effective execution or in unit '1.0' because the full performance kernel includes nonlinear transformations. The example deliberately treats the .30 error as a direct decrement to Q *only to test allocation*, not as the definitive end-to-end effect of Pitch failure.

## 4. Time resolution, error localization and palette

- Exact singer assignment and song section boundaries come from Vocal Time-Slice Assignment v0.1; proposed default five-second slices, phrase-aligned where authored.
- The main Pitch failure is drawn once per performing member/song and assigned to an actual sung **Part**, weighted by actual singing seconds; optionally assign it to one of that member's actually sung intervals within Part, weighted by duration (PROPOSED). Apply local incremental error only to the chosen path, member, interval; do not propagate to other intervals unless an explicit part-wide error scope is approved. Ochi default solo extra Pitch check remains Part-fixed.
- Member's own source Q for assigned interval includes intrinsic eight-color Palette skill and the relevant actual duties/key contrast. Do not apply WorldPopularity or LiveSat before TeamPerf / MemberPerf is determined; do not independently change the intrinsic Palette multiplier due to audience layer.
- Post-performance `MemberImpression[m,L,p] = MemberPerf[m,p] * SongEnv[L]`, `TeamImpression[L,p] = TeamPerf[p] * SongEnv[L]`. Same factor per layer and song, applied **once**. Public/Otaku have distinct World/Live response, but same Performance.
- **Do not double-count performance** if a legacy downstream song/team aggregation independently adds TeamPerf + sum MemberPerf: these are two views of the *same credited ledger*, not two additive impression sources.

## 5. Known interface issues still OPEN

1. **Meaning of personal display:** member's credited 1/N unison contribution is not her intrinsic singing quality or performance rating. UI/profile and fan-exposure models must use correct measure/normalizer; a 15-member unison should not make every member appear weak.
2. **Vocal versus dance weights `w_v,w_d`:** import existing Technical v1.2 mixture, do not invent hard 50/50. For different paths or Part types, ensure final normalization stable.
3. **Nonlinear Part-level factors:** the existing Palette FinalPE/Contrast, Song Appeal and Stage Presence must be placed once and not make B's personal credit sensitive to A's failure; confirm the exact order against the technical kernel.
4. **Member personal impression vs dedicated member visibility:** separate own-credit account and individualized audience attention, if Fan conversion requires it; not a backdoor to duplicate TeamImpression.
5. **Ochi changed to multi-singer relay/unison:** qualification/count for additional Pitch remains OPEN.
6. **Repeat singer within a Part:** confirm whether failed interval or entire Part of that member is affected. Local timing is consistent with user-approved precise slices but **is not yet locked**.
7. **Instrumental dance and missing voice coverage:** align no-vocal Part rules, subpart exposure, and explicit rest/missing-singer scoring with existing kernel.
8. **Performance numerical magnitude:** run 3/5/9/15 member, solo/relay/unison regression across ability levels, difficulty and PartExposure. Current simplified examples only verify conservation and isolation.

## 6. Acceptance checks

| ID | Check |
| --- | --- |
| AG01 | Sum of MemberPerf credits equals TeamPerf independently for vocal and dance |
| AG02 | 3/5/9/15 all-equal unison lineup produces equal TeamPerf (no N inflation) |
| AG03 | A Pitch failure changes A only and exact team's allocated share; B unchanged, in both Public/Otaku Impressions |
| AG04 | 25s relay assigned 5/15/5 gives 0.2/0.6/0.2 time shares |
| AG05 | Solo is one-member relay across all slices |
| AG06 | No participation means zero path credit, without leakage from TeamPartPerf |
| AG07 | A dancing nonsinger still receives dance contribution, vocal contribution 0 |
| AG08 | A failed/unfilled vocal interval yields zero coverage; cannot renormalize away omission |
| AG09 | Per-song snapshot and media replay freeze Performance; changing world/live changes Impression only |
| AG10 | Existing song-level Pitch/Agility failure draw count and selected Part remain unchanged by finer time slicing |
| AG11 | 0.25 unison Pitch attenuation applied locally once, not again after ensemble /N |
| AG12 | ExpectedImpression and fan conversion consume already resolved impressions without additive team/member double-count |

**Status: draft implementation candidate; no Runtime change or test execution claimed.**
