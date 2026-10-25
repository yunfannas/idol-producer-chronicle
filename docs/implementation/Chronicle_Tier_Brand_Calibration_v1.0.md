# Chronicle｜Historical Tier / Brand Calibration — Archived Reference

> **ARCHIVED / NON-RUNTIME (Chronicle 2026-10-24 decision)**：此文件保留作为开发者内部历史校准资料，**不是 Chronicle 实现要求或玩家界面设计**。Chronicle 不实现完整 E−…S / 0–10000 Tier 分段、Live/Music/Brand/Overall 评分流水线、跨团排行榜，也不评价本团或其他团在偶像界的地位。任何下文出现的“authoritative runtime calibration”仅指**原研究模型历史原文**，在 Chronicle 中已被本覆盖声明废止。需要事件规模/演出预期/Staff 能力时使用章节 Scenario 隐藏参数；只展示实际动员、粉丝、收入、作品和章节成果。请勿为这些输入恢复完整 Tier 系统。

**Historical local reference copy (2026-10-24)**. 下文包含完整的连续 0–10000 分段、12m Live/Music/Brand、场馆/活动与历史回归锚；实现无需读取外部研究仓库。下方英文原规范内容保留其完整数值语义。**历史校准锚不是剧情结果保底**；插值缺口必须明确 TUNABLE，不得用 tier 中点假装观测分数。

**Chronicle 覆盖**：Scenario opening 数据遵守该剧本时间截止；玩家经营后只用实际结算记录滚动更新。Fan 持久状态是 P/O/A_i/W_i（无 Core）。章节固定 R2/R3 与全局固定 R4 不因 Tier 上升自动解锁。R4/R2/R3 不允许玩家自由修改。此文件只规定评分，不赋予任何 Policy 编辑权限。

---

# Idol World Tier Calibration & Overall Scoring Spec v1.0

**Status:** authoritative runtime calibration for L3 world simulation  
**Date:** 2026-09-17

## 0. Precedence / conflict rule

This document is the authoritative runtime definition for group **Live / Music / Brand / Overall** scoring.

If older project documents say that Overall is a manual or non-arithmetic structural reconciliation, that text is superseded here. Older reviewed tier tables remain calibration evidence and may be retained for historical comparison, but runtime scoring uses the continuous model below.

Do not overwrite historical scenario-opening observations with later facts. Historical slices remain time-locked.

---

## 1. Common 0..10000 tier scale

Live, Music, Brand and Overall use the same continuous score scale.

| Tier | Score range |
|---|---:|
| E− | 0–299 |
| E | 300–599 |
| E+ | 600–899 |
| D− | 900–1199 |
| D | 1200–1599 |
| D+ | 1600–1999 |
| C− | 2000–2399 |
| C | 2400–2999 |
| C+ | 3000–3599 |
| B− | 3600–4199 |
| B | 4200–4899 |
| B+ | 4900–5599 |
| A− | 5600–6299 |
| A | 6300–6999 |
| A+ | 7000–7999 |
| S− | 8000–8999 |
| S | 9000–10000 |

S+ is an exceptional display label only (for example, a New National Stadium-class live achievement), not a normal persistent 0..10000 interval.

For Live and Music, do not replace a measured result with a tier midpoint. Convert the underlying calibrated metric to a continuous score inside the corresponding tier interval.

---

## 2. Live

### 2.1 Evaluation order

Live uses the trailing 12 months.

1. **Attributable ticket gross** — primary metric.
2. **Average / median actual attendance** — market-depth gate.
3. **Attributable show count / repeatability** — confirms that the level is sustainable.
4. **Peak venue / milestone live** — supporting evidence.

Show count does not promote a tier by itself. A high-frequency group can accumulate large annual gross without having the average draw required for the next tier.

Ticket gross is used as the standardized observable proxy. Normal idol live economics often add substantial merch / benefit-event revenue outside ticket sales; that hidden revenue is intentionally not reconstructed for every historical group.

NANIMONO is the calibration counterexample: unusual VIP / bundled-benefit ticketing can move benefit-event value into ticket revenue. The annual gross remains a real cashflow fact, but average actual attendance prevents it from mechanically inflating Live tier.

### 2.2 12-month ticket-gross anchors

| Live tier | 12m attributable ticket gross |
|---|---:|
| E− | < ¥0.2–0.3M |
| E | ¥0.2–0.5M |
| E+ | ¥0.5–1.5M |
| D− | ¥1–3M+ |
| D | ¥5–10M |
| D+ | ¥10–25M |
| C− | ¥25–60M |
| C | ¥60–150M |
| C+ | ¥150–250M |
| B− | ¥220–350M |
| B | ¥350–550M |
| B+ | ¥500–800M |
| A− | ¥700M–1.1B |
| A | ¥1.0–1.6B |
| A+ | ¥1.5–2.5B |
| S− | ¥2.5–4.5B |
| S | ¥4.5B+ |

These are overlapping calibration ranges, not hard cuts.

### 2.3 Average-attendance gate

Working low/mid anchors:

- E−: single digits to a few tens
- E: ~10–40
- E+: ~30–80
- D−: ~80–150
- D: ~150–300
- D+: generally a few hundred
- C−: repeated evidence around ~600–1,200
- C: repeated evidence around ~1,500–3,000

The gate exists mainly to prevent annual gross from being inflated by unusual pricing, benefit bundling or very high event frequency.

### 2.4 Single-event venue anchors

These are **single-event scale anchors**, not automatic rolling Live tiers.

| Realized venue scale | Live anchor |
|---|---|
| Zepp-class / ~1–2k | C− |
| 2–4k hall | C |
| 5–8k | C+ |
| 9–12k | B− |
| 13–18k | B |
| ~20k arena | B+ |
| stadium entry | A− |
| large stadium / dome progression | A through S |
| New National Stadium-class | S+ exceptional |

A single Budokan-class show is a B−-scale event. Multiple tour dates repeatedly realizing the same scale are strong evidence that the group's rolling Live level is also at that tier.

### 2.4.1 Sparse-history repeatability floor

Historical replay often has incomplete ticket-gross / attendance coverage. Missing
coverage must not be treated as observed zero.

When trailing-12m commercial data are materially incomplete, realized own-live
milestones may provide a **conservative Live score floor**. This is a fallback for
missing observations, not an extra bonus on top of complete measured gross.

Qualifying event requirements:

- group-owned one-man / tour / anniversary / graduation live;
- venue scale is known;
- the event actually occurred;
- there is no evidence that the booking was mostly invitation / free-fill /
  extreme-discount attendance;
- at least partial attendance / sell-through / normal-ticket evidence exists, or
  the realized booking is otherwise strongly documented.

Working floors:

| Trailing-12m realized pattern | Minimum Live score |
|---|---:|
| one Zepp-class / ~1–2k event only | no automatic floor; support evidence only |
| two Zepp-class-or-larger own lives | 2000 (C− lower bound) |
| one Zepp-class plus one realized 2–4k hall | 2100 |
| two realized 2–4k halls | 2200 |
| repeated 5–8k realized events | 3000 (C+ lower bound), subject to review |

A stronger directly measured ticket-gross / attendance score always wins. A
clearly contradictory low paid-attendance result can suppress the fallback.

This rule exists to avoid a systematic historical bias where a group with
documented repeated large one-man events is scored below the scale implied by
those events only because fine-grained ticket accounting is unavailable.

### 2.5 Price / attendance treatment

For Live commercial strength, actual ticket revenue is used. Low ticket prices therefore reduce Live strength **fully** through the observed gross.

For Brand venue gain, price and attendance are only mild realization discounts; see §4.4.


### 2.6 Industry-wide disruption smoothing (COVID-era rule)

A market-wide disruption may reduce all groups' realized Live opportunities at
the same time. The simulator should reflect that loss, but must avoid treating
temporary external restrictions as an instantaneous collapse of underlying group
strength.

For the COVID disruption window, Live is still allowed to fall, but the observed
rolling score is blended with the pre-disruption structural level:

```text
live_score_effective
  = round(
      disruption_weight * live_score_observed
      + (1 - disruption_weight) * live_score_reference
    )
```

Where:

- `live_score_observed` is the normal trailing-12m score from gross /
  attendance / repeatability after actual restrictions.
- `live_score_reference` is a slowly decaying pre-disruption structural Live
  reference.
- `disruption_weight` rises gradually as the market normalizes.

Working calibration:

| Phase | disruption_weight on observed Live |
|---|---:|
| 2020-03 to 2020-06 | 0.35 |
| 2020-07 to 2020-12 | 0.50 |
| 2021-01 to 2021-06 | 0.65 |
| 2021-07 onward | 1.00 |

The reference itself is not frozen forever. During the disruption window:

```text
live_score_reference_next
  = max(
      live_score_observed,
      floor(live_score_reference * 0.985)
    )
```

This lets a group drift down slowly even under external restrictions, while
preventing a one- or two-month collapse from erasing a previously demonstrated
market structure.

Important:

- this rule applies market-wide, not to selected groups;
- it only smooths Live; it does not directly protect Music or Brand;
- genuine structural decline (member losses, repeated smaller own-lives,
  shrinking releases, weaker post-reopening demand) will still pull the group
  down as the reference decays and the observed weight rises;
- genuine growth during the disruption can still raise Live because observed
  Live is never capped by the reference;
- from 2021-07 onward, this special smoothing ends and normal trailing scoring
  fully resumes.

AKSB is a useful calibration case: its 2019 C−-class live structure should soften
rather than collapse immediately in early 2020. The market-wide Live smoothing
ends after 2021-06; any later weakness should therefore come from the group's own
realized Live / roster / market trajectory rather than a continuing COVID score
buffer.

---

## 3. Music

Music uses the trailing 12 months and combines physical sales and streaming with era-sensitive weighting.

Before streaming becomes structurally important, physical dominates. Streaming becomes increasingly important from the S5 era onward.

### 3.1 Physical sales

Primary metric: **12-month total physical sales**.

Release count is a mild downward correction: equal annual volume spread across more releases implies lower per-release market power.

| Releases in trailing 12m | Multiplier |
|---:|---:|
| 1 | 1.00 |
| 2 | 0.95 |
| 3 | 0.90 |
| 4 | 0.85 |
| 5+ | 0.80 |

Working 12-month physical anchors:

| Music tier | Physical sales anchor |
|---|---:|
| C− | ~20k |
| C | ~40k |
| C+ | ~80k |
| B− | ~120k |
| B | ~150–220k |
| B+ | ~220–320k |
| A− | ~320–450k |
| A | ~450–600k |
| A+ | ~600–800k |
| S− | ~800k+ |
| S | ~1.2M / sustainable million-class |

Lower tiers are calibrated using release existence, measurable external consumption and the same historical review tables when sales are too sparse for a stable numeric anchor.

### 3.2 Streaming

Streaming is persistent external consumption, not a one-month viral maximum.

Working lower anchors include:

- D−: ~2–5k monthly listeners
- D: ~5–10k
- D+: ~10–15k
- C−: ~20–50k
- C: ~40–50k+

Upper levels are calibrated from real contemporary examples rather than linear extrapolation. Current reference examples include CUTIE STREET around 1.077M monthly listeners as a B+ streaming reference and =LOVE around 1.4M as an S− reference.

### 3.3 Music to Brand breakout correction

Normal Music performance does not also add Brand.

If, within a six-month window, Music reaches at least two full tiers above current Brand, apply one percentage Brand bonus:

- +2 tiers: +8%
- +3 tiers: +12%
- +4 tiers or more: +16%

The same breakout window triggers once. This models rare trajectories such as early FRUITS ZIPPER or きゅるして, where exceptional consumption pulls recognition upward before Live fully catches up.

---

## 4. Brand / Reputation

Brand is the persistent group reputation state:

`group_reputation: integer 0..10000`

Monthly baseline:

`rep_next = floor(rep * 0.9875) + gains - penalties`

Monthly natural decay is therefore 1.25%.

### 4.1 Startup anchors

- no formal backing: E− midpoint, ~150
- small regular agency: D− midpoint, ~1050
- medium regular agency / established operation: D+ midpoint, ~1800
- large regular agency / strong producer launch: C midpoint, ~2700

### 4.2 TIF

- ordinary TIF appearance: +80
- TIF main/HOT appearance: +120
- first ordinary TIF: additional +100
- first TIF main/HOT: additional +300

If the group's first TIF appearance is already main/HOT, apply the first-main bonus only; do not also add the first-ordinary-TIF bonus.

Thus:
- first ordinary TIF = 80 + 100 = 180
- first TIF main after earlier ordinary appearance = 120 + 300 = 420
- first-ever TIF already on main/HOT = 120 + 300 = 420
- later main/HOT = 120

### 4.3 Benchmark festivals / self-hosted multi-group events

Benchmark festivals currently include IDORISE, @JAM EXPO and 関ケ原.

- benchmark appearance: +25
- benchmark main/upper: additional +25
- no first-benchmark bonus
- self-hosted multi-group event / 主催対バン: +10 per event

Self-hosted events measure scene influence rather than the group's own one-man drawing power.

### 4.4 Venue Brand gain

Ordinary small one-man lives do not directly add Brand. Meaningful Zepp-class and larger events do.

`VenueBrandGain = VenueBaseGain * sqrt(AttendanceRate * PriceFactor)`

For Brand:
- AttendanceRate is capped at 1.
- PriceFactor is capped at 1.
- both are square-root discounted, because Brand is about whether the venue scale was meaningfully realized, not only the exact commercial return.

This rule applies even when the ticketing model is unusual. For example, NANIMONO should still receive the Brand value of a realized TDC/Kanadevia Hall-class event after attendance/price adjustment, regardless of whether VIP or ordinary tickets bundle benefit-event value.

#### 4.4.1 Completion base gains

Venue completion gains are explicit runtime values:

| Realized own-live scale | VenueBaseGain |
|---|---:|
| Zepp-class / ~1–2k | +120 |
| 2–4k hall | +180 |
| 5–8k | +250 |
| 9–12k / Budokan-class | +350 |
| 13–18k | +500 |
| ~20k arena | +650 |
| stadium entry | +900 |
| dome / large-stadium class | +1200 |
| New National Stadium-class | +1500 |

These are Brand gains, not Live-score substitutions. A group may receive the
Brand value of a realized milestone even when its rolling Live score remains
lower.

Repeated realized large own-lives may each grant completion gain. This is
intentional: repeated ability to operate at that scale is itself persistent
scene recognition. Natural monthly Brand decay prevents old venue history from
remaining permanently additive.

#### 4.4.2 First milestone announcement bonus

Large-live **first milestone announcement bonuses** are credited when announced
because these events are commonly announced six to twelve months in advance.
Completion gain is separately credited on the event date.

| First announced scale reached | Announcement bonus |
|---|---:|
| Zepp-class / ~1–2k | +50 |
| 2–4k hall | +75 |
| 5–8k | +100 |
| 9–12k / Budokan-class | +150 |
| 13–18k | +200 |
| ~20k arena | +250 |
| stadium entry | +350 |
| dome / large-stadium class | +500 |
| New National Stadium-class | +650 |

The announcement bonus applies only to the first time the group reaches that
scale band or higher. Re-announcing the same scale does not repeat the first
milestone bonus.

Budokan working calibration therefore remains:
- first Budokan-class announcement: +150;
- actual Budokan-class completion: +350 × realization factor.

A single Budokan remains a B−-scale live event, not proof that the group itself has B− rolling Live.

### 4.5 Television / media milestones

First important music-show appearance, first Music Station, first Kohaku and similar milestones are credited on actual broadcast/appearance, not announcement, because their lead times are short.

Persistent radio, group variety, recurring web programs and similar ongoing exposure produce monthly reputation flow. Their main purpose is to offset natural decay rather than repeatedly create milestone bonuses.

### 4.6 Structural Brand maintenance from fan market

Brand is not maintained only by discrete festival / TV / venue events.

The second maintenance layer is the group's persistent market structure, using
the authoritative fan state from `Idol_Fan_Market_Model_v0.2.md`.

Principle:

- discrete industry events create Brand breakthroughs / gains;
- agency / producer / operator support can maintain an initial industry position;
- a durable Otaku/Public market can maintain Brand after the breakthrough;
- member graduation should not apply a guessed fixed Brand penalty. Graduation
  changes affinity, Otaku retention, purchase power and later observed market
  outcomes; Brand then responds to the resulting market structure.

At low live-idol tiers, Otaku is the main fan-market support. Public is usually
small and should have only a minor Brand effect.

Around stable C- / the lower edge of major, Public begins to matter materially.
At C and above, Public can become a major Brand-maintenance input.

Working fan-market anchors are maintained in the fan-model spec. Important
calibration examples include:

- strong D+ / brief C-: about 1.5k-2.5k O, Public usually below O;
- stable C- / Jams anchor: about 3k O and 5k P;
- typical C: about 4k O and 20k P;
- Takane-style case: about 3.5k O but ~50k P, i.e. C-level Otaku with unusually
  broad Public reach;
- AKSB 2019: brief C- event structure with about 2k+ O and only ~1k-3k P, so the
  position is less structurally durable.

These are calibration anchors, not direct tier gates.

Fan state is also a cross-check for Live and Music. When direct historical
material is incomplete, it may supply an inferred attendance / sales range, but
direct observed market data always takes precedence.

### 4.7 Idol reputation

Individual idols also use the same 0..10000 semantic reputation scale.

Newcomers normally begin below the current group tier and may catch up over roughly 2–3 years of sustained activity. Total idol tenure is the strongest default prior; current-group tenure controls how much of the current group brand transfers to the idol.

High-reputation members joining a lower-reputation group can create a small one-time group-reputation transfer. Normal graduation is not a scandal penalty but removes the member's future ongoing contribution.

---

## 5. Continuous dimension scores

The simulator stores/calculates:

```yaml
live_score: integer       # 0..10000
music_score: integer      # 0..10000
brand_score: integer      # group_reputation
overall_score: integer    # 0..10000
```

Live and Music scores are obtained by mapping their calibrated raw metrics to the common tier range and **interpolating within the interval**.

Examples:
- barely clearing C− should score near 2000, not automatically 2200;
- a result close to C should approach 2399;
- a Live attendance gate may cap/reduce the score implied by ticket gross;
- Music release-count correction is applied before the final physical score is mapped.

---

## 6. Overall

Runtime Overall is:

`overall_score = round(0.45 * live_score + 0.30 * music_score + 0.25 * group_reputation)`

Weights:

- Live: 45%
- Music: 30%
- Brand: 25%

Map the result back through the common 0..10000 tier boundaries to obtain `tier_overall`.

The raw `overall_score` is also the canonical within-tier ranking value, so groups in the same displayed tier can be ordered without an additional manual ranking layer.

Reviewed historical tier assignments remain useful validation/override evidence, but when all three continuous component scores are available, the formula above is the authoritative runtime result.

---

## 7. Runtime output

A group monthly snapshot should expose at minimum:

```yaml
tier_scores:
  live_score: integer
  music_score: integer
  brand_score: integer
  overall_score: integer

tiers:
  live: tier
  music: tier
  brand: tier
  overall: tier

live_12m:
  ticket_gross_jpy: number
  avg_actual_attendance: number
  attributable_show_count: integer

music_12m:
  physical_sales: integer
  physical_release_count: integer
  streaming_metric: nullable number

reputation:
  group_reputation: integer
  monthly_decay_rate: 0.0125
```

This keeps historical replay, autonomous AI groups, scenario-opening snapshots and post-opening simulation on one scoring system.

---

## 8. Historical calibration canaries

The continuous model must reproduce known historical scale transitions without
group-specific Overall overrides.

### AKSB 2019

AKSB is a required low/mid-tier canary:

- a realized Zepp Tokyo-class one-man followed shortly by a realized
  Nakano Sunplaza-class one-man must not be flattened into isolated one-off
  bookings when historical ticket accounting is incomplete;
- under §2.4.1, the repeated realized pattern is sufficient for at least a
  conservative C− Live floor while both events remain in the trailing window;
- each realized venue also contributes Brand through §4.4;
- the first TIF main/HOT event receives the normal §4.2 first-main gain;
- the resulting continuous Overall should be able to cross C− naturally if Music
  is not materially below the surrounding D+/C− structure;
- later contraction must still be able to return the group to D+ as the rolling
  Live window weakens and Brand decays.

If a replay still reports AKSB's historical peak as D+ or below after these
inputs are present, treat that as a scoring/input bug to investigate rather than
adding an AKSB-specific tier override.
