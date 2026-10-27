# Chronicle Fan / SNS / Interest / Broad Cheki — Integrated Spec v1.5

Status: **Design baseline / calibration candidate (2026-10-26)**. This is the authoritative *new-model delta* for Fan acquisition, personal SNS reach and Live sharing, four-week Interest, and broad tokutenkai conversion. It supersedes conflicting **runtime-design rules** in the earlier Fan–Reputation integrated spec, notably direct Live P→O, direct Live→A, fixed R1 1% trial, and fixed newcomer Cheki participation rates. **Not yet implemented in the formal Runtime**; old C3 seeded outputs must not be claimed as v1.5 regression results.

## 1. Design goals and persistent state

Persistent team Fan state: **P (Public persons), O (Otaku persons)**. For every active member i: **A_i** (durable member affinity equivalent persons), **W_i** (established supporters' repeat purchasing power), **I_P,i[4]** and **I_O,i[4]** (four age slots of distinct *within-member* expected interested persons). Store team official SNS Followers F_team and each member personal SNS Followers F_i separately from P/O; **Follower ≠ P/O**.

Members may share an interested person; sum of different members' I may exceed P/O and sum A may exceed O. Do not create fan IDs, fan cohorts, cross-member overlap matrix, primary-oshi, permanent group conversion pool or automatic cross-member normalization. Interest is in persons; fractional values are legitimate aggregate expectations.

- I_P,i: Public with an unfulfilled wish to meet member i in broad tokutenkai.
- I_O,i: existing Otaku with an unfulfilled wish to form a *new* relationship to i; exclude existing A_i habitual customers.
- 0 <= I_P,i <= eligible P; 0 <= I_O,i <= max(0,O-A_i) after weekly reconciliation; A_i <= O individually, while sum A_i can exceed O.
- Handle temporarily stale cohort P/O counts between Live and weekly settlement without prematurely truncating Interest. **No routine P→O Interest migration**: formal P→O occurs only through a successful broad tokutenkai conversion.

## 2. Event chronology, conversion invariant

1. Read opening P/O/A/W and Interest; compute event attendance.
2. If Live: settle team and per-member actual Performance / Impression; generate new member Interest from satisfied Team-source exposures and targeted Member-source exposures. Existing targeted Interest must not be gated by Team Performance. Neither Live nor SNS/CD/external appearance creates O or A directly; those channels may acquire new P, Followers and Interest.
3. If broad tokutenkai is provided (same day or at a later independent event): generate P and O first-trial requests from available I and actual attendance; regular repeat requests from A/W separately. Use real queue/service capacity and budget accounting.
4. Only completed broad-tokutenkai service with successful relationship conversion creates A. For first trial from Public it also moves P→O; trial from existing O only adds member A. A transaction can form a member relationship without inventing a second O.
5. Event social posts/earned media affect later reach and Interest (weekly SNS settlement); never retroactively change current Live attendance.

**Hard invariant**: `new_O_live = new_A_live = 0`. All `new_O` and `new_A` are attributed to actually completed broad-tokutenkai services. P→O has **no independent fixed probability route**. Purchases/reservations (e.g., CD handshake tickets) may book financial receipts in advance; O/A only at actual service.

Broad tokutenkai includes Live cheki, standalone post-concert sessions, CD handshake/signing, online interactions with verifiable completed services, etc.; define their service seconds, products, fees and capacity individually.

## 3. Attendance and Interest demand

For an ordinary Live with possible tokutenkai, for s∈{P,O}:
`p_attend,s = clamp(p_base,s + Δp_interest,s * hasCheki + Δp_liveFormat,s + Δp_location,s, 0, p_cap,s)`.
Existing baseline candidate p_base: P taiban 0.012 / one-man 0.07; O taiban 0.12 / one-man 0.32. Use **additive probability-point corrections**, do not stack all factors as unbounded multiplicative boosts. Group Rep influences awareness/event reach and must not be double-counted in downstream success. If no broad tokutenkai, **Δp_interest,s = 0**.

`H_s = Σ_i I_s,i / max(N_s,1)`; individual-member Interest pools are not deduplicated for group attendance. Candidate response `Δp_interest,P = 0.08 H_P/(0.5+H_P)`, `Δp_interest,O = 0.04 H_O/(0.5+H_O)` (tunable). Draw total group P and O attendance exactly once.

Standalone group tokutenkai may use `N≈O*p_O + P*f(H_P)`, with f(0)=0; member-limited tokutenkai uses only that member's A/W and Interests. Member first-trial *expected requests*: `D_s,i ≈ I_s,i,available * p_attend,s * F_access` with `F_access=1` if open, 0 if closed; actual paid eligibility/price/budget, voucher and shared queues constrain completions. Do not introduce a second fixed 1%/20%/30% trial gate. Distinct audience attendance and service accounting cannot exceed real capacities; repeated purchases do not create repeated A.

### Live-interest creation

Audience motive is event-local **Team-oriented** or **Member-oriented** (including Cheki-only intent), not a persistent fan segment. Team-oriented new-interest *volume* responds to actual Team Perf; distribution responds to actual Member Perf, Appearance and exposure share. Member-oriented existing target interest remains available even after weak Team Perf, with at most modest member-specific Live adjustment. Already-O trials for non-affiliated members accumulate I_O; pre-existing A/W handles habitual consumption separately. Actual Member Perf must not be replaced by static Stage Presence in the final kernel.

## 4. FIFO interest life cycle

Per member, keep separate I_P,i[4] and I_O,i[4]. Each slot records weekly-created unfulfilled expected *persons*. Unfulfilled new Interest is not immediately discounted. Completed-and-successful conversions consume corresponding Interest **proportionally across the four slots**:
`I_s,i[k] ← I_s,i[k] * (1 - C_s,i / Σ_j I_s,i[j])` with C clamped to available Interest. This is proportional **redemption**, not FIFO-oldest redemption. Unserved request retains Interest; completed service without new A may preserve a service-satisfaction-dependent share.

At week boundary, oldest expired slot **defaults to lost**. Effective SNS, Live and external work exposure can renew a fraction and enqueue it in newest slot. At average SNS activity, **renewal target 50%**; with no qualifying exposure 0%; exposure-based renewal may have finite cap, e.g., 70% candidate. Do not add separate weekly fixed natural Interest churn or a second four-week-fulfilment penalty. Weekly new Interest enters newest slot after expiry/renewal bookkeeping and is not immediately expired. Population attrition and per-member saturation must be reconciled without cross-member dedup or arbitrary A creation.

The prior rolling four-week `served/demand` fulfilment rate remains a **report/diagnostic KPI**, not an extra decay multiplier. No-cheki weeks are genuine zero service weeks, not omitted observation periods.

## 5. Broad tokutenkai conversion and sales

- First-trial W is **event-local W_trial baseline 1**, independently modified by that day's Member Performance and actual tokutenkai satisfaction; no automatic addition of W_trial to persisted W. Post-service satisfaction may authorize *additional* purchases only if queue time/remaining budget and actual service support them; never count unserved revenue.
- Completed service relationship-success candidate baseline **80%**, adjusted using **Fan Service 75% + Appearance 25%** and limited wait/service-experience effects. These are tunable; no direct reuse of Live satisfaction as interaction-quality proxy.
- Established A_i/W_i customers generate regular paid consumption independently of I. First-time paid transactions must not be simultaneously booked as a regular A/W purchase.
- Voucher **does not change W_trial** and does not generate Interest. Issuing a limited number of vouchers from predicted first-time visitors supplies a small amount of **extra free service seconds/queue demand**, no voucher service revenue, and may form A only if service occurs. Distinguish extra-free-service versus price-discount semantics; baseline is extra-free-service.
- Group P→O without persistent conversion pool: `ΔO = min(estimated distinct Public actually served, Σ_i ΔA_from_P,i)`; `ΔP = -ΔO`. Member A additions remain legitimate for multi-oshi, and duplicate-O overcount of multiple first-member successes may need an event-local future correction. Do not add permanent fan IDs/overlap matrix solely for this. Track effective distinct Public served at group level as event-local count/estimate.

## 6. Weekly SNS: followers, reach, P and Interest

SNS is a **shared weekly exposure pipeline**. Every week it can increase (a) individual/team Followers, (b) previously unknown audience becoming P, (c) I_P/I_O to specific members, and (d) expired FIFO renewal. These are distinct outcomes of the same reach, not independent invented audience populations; avoid double booking new P.

- Persistent F_i and F_team; start near zero for complete newcomers, higher only with documented personal history. Prologue-end **rough calibration reference**: members ~2k to a little above 10k Followers with visible dispersion, not guaranteed or manually assigned.
- Posts follow staff schedule and execution (Condition / Confidence) and diminishing effectiveness. Relative post-exposure function normalized at 4 posts/wk:
  `E(n)=(1-exp(-0.25*n))/(1-exp(-1))`, `E(0)=0`.
  Post-effective reach uses `R_posts = R_4 * E(n)` plus exposure sources; do not apply E a second time to conversion probability.
- Normal personal SNS share/recommendation structure (calibration candidate):
  `B_share=0.25*(P+3*O)/(P+3*O+500)`.
  Apply P/O-driven amplification to **share/earned reach only**, not to all views/followers; group Reputation affects discovery/recommendation, not SNS quality, and avoid applying a second Rep multiplier to Live-aftereffects.
- Content **quality drives effective-reach→Follow conversion**, not reach itself:
  `Q_i,c,w=clamp(1+B_i,c + S_i,w + T_i,c, 0.70,1.30)`,
  `p_follow,i,c = 0.05 * Q_i,c,w`.
  `B` is a mapping of existing expression/mental, communication and Appearance attributes with content-dependent weights; `S=0.06*(Confidence-50)/50+0.04*(Condition-50)/50` as a proposed dynamic correction; `T` is an **extra bonus** from matching trained Trait (not part of the base weighted average), candidate +2/+4/+6% for junior/intermediate/senior, combined bounded +8%. No stand-alone Professionalism state. **Do not invent missing concrete attribute keys**: actual Staff Runtime currently holds mainly vocal/dance/stagePresence; final B/S/T must use authoritative expanded Member schema when available. The experimental Stage Presence-only proxy is not the intended rule.
- `ΔF_i = R_i,nonfollowers * 0.05*Q_i - unfollows`; no fixed +N Followers/week. Following a member does **not itself** imply becoming P or acquiring an A.
- Weekly P acquisition uses unique previously-unaware reached audience and recognition probability; existing candidate `p_recognize = 3.5%` plus audited quality adjustment. New Public may simultaneously gain Interest for the source member, counted once in P.
- `ΔI_P,i^SNS` comes from effective reached existing P, attributed newly acquired P, and member-weighted official posts, with saturation factor `max(0, 1 - I_P,i / max(P,1))`. A candidate existing-P reach→new Interest coefficient is 2.7%, new-P source-member initial Interest 35%; **not fixed +2 interest persons/week**. Existing O can form I_O for non-affiliated member. Use already touched existing Interest for renewal before granting additional new people in the same member pool.
- Baseline expiry renewal around 50% at average SNS activity; bounded small additional Live/external/official exposure boost (candidate **at most +5 percentage points**), not full re-scaling of all reach, which previously led to overrenewal.

## 7. Live attendee sharing (v1.5 conservative baseline)

Live Performance → live audience reactions → attendees post/share → first-circle follower impressions → optional **one additional** limited repost layer → deduplicated unique effective reach → (a) member Followers, (b) P recognition, (c) attributed member Interest for current P/new P. No direct P→O/A and no effect back onto already-settled event attendance.

**v1.5 conservative candidate inputs** (not empirical platform measurements):
- Average attendee SNS Followers: Public **200**, Otaku **350**, external **200**.
- Probability to share: Public **6%**, Otaku **16%**, external **2.5%**; actual current-event Member Perf / expected Member Perf boundedly adjusts willingness to share. Event-local share intensity uses actual member Impression and exposure allocation, not static Stage Presence. Do not multiply member performance again after crediting share behaviour.
- First-circle follower viewing rate **30%**, unique/effective reach fraction **65%**.
- Second-circle repost probability **1.2%**, mean secondary account Followers **180**; keep one additional repost layer with dedup, not unlimited viral cascades.
- Estimated non-follower audience **65%** for follower conversion; **18%** unknown-to-group fraction in conservative earned reach for P acquisition, cross-member unique retention **65%**.
- Unknown group viewer→Public recognition base **3.5%**; reached existing P→new member I_P **2.7%**; new P→source-member Interest **35%**.
- Shares/earned reach should avoid counting the same attendees' direct Live interest again, and deduplicate new-P recognition across channels at **group level only**. Member Interest is never cross-member deduplicated for attendance.
- Personal SNS baseline follower conversion **5% × content quality**, while Live reaction exposure can use channel-appropriate content quality/appeal with a single bounded conversion, not stacked bonus multipliers.
- Event quality, distribution of member Impression, official spotlight, Live scale and genuine personal external work are legitimate causes of member-specific exposure differences. Never manufacture an external appearance when none is scheduled.

## 8. Latest independent synthetic calibration (NOT production)

Staff 9-person prologue, ~82 weeks, synthetic 100 seeds, v1.5 **conservative** sharing scenario:
- Final **P≈747, O≈284, ΣA≈293, remaining ΣI_P≈192**.
- v1.4 sharing-only: P≈715, O≈270, ΣA≈279, remaining ΣI_P≈172.
- More aggressive v1.5 scenarios: medium P≈777/O≈298; high P≈799/O≈320.
- Follower spread in this synthetic scenario roughly 3,862–6,400, which is narrower/lower than historical *aspirational calibration reference* of 2k–10k+; **do not force the target by adding fixed followers**.
- Earlier synthetic scenarios where O≈280 were obtained via tuned input assumptions; this does not constitute an independent historical validation. The v1.5 synthetic script still used Member Perf and personal attributes **proxies**, and did not use the formal actual 5-minute Cheki queue, event-grade realistic external work, or fully differentiated social account activity. Keep P/O target **soft**, not an optimization objective overriding mechanics.

## 9. Implementation migration and mandatory regression

1. Define weekly Member/team SNS Followers and weekly audit: own content count/quality, unique reached followers/nonfollowers, team referrals, P/O shares, actual event earned reach, new F, P and Interests, expired/renewed Interest. Avoid one content type being counted in several independent reach systems.
2. Define I_P/I_O 4-slot persistence and weekly append/expiry/renewal transaction; model weekly calendar age exactly, including weeks without tokutenkai.
3. Move Live→O and Live→A formally to Live→Interest; only broad-tokutenkai actual completed service allows new O/A. The R0 dynamic Live converter, old direct R1 `existingOtakuLiveAffinityProbability`, old 1% existing-O Cheki trial, newcomer fixed paid/voucher participation **must not execute in v1.5 formal mode**. Keep Legacy only for **explicit** regression/compatibility mode; no silent fallback.
4. Reconcile SNS new P with existing Live external reach and independent event sharing once. Never invent audience from spare venue capacity. Propagate actual Performance and location/event-kind exposure snapshots into weekly earned reach.
5. Cohesive 5-min queue budget, voucher free seconds, completed-service conversion, and first-trial W_trial bookkeeping; no booked extra paid service without queue time.
6. Assertions: no Cheki→no new O/A; no served new visitors→no new O; Σ A_i can exceed O; each A_i ≤O; no premature I_P clipping on identity changes; no same-member Interest > eligible population; no negative Interest or budget; no cross-member artificial normalization; venue/queue bounded; FIFO proportional removal and 4-week expiry; zero SNS/external/Live exposure→no fixed Followers growth; zero posts→zero post-driven reach; only paid completed services create paid cheki revenue.
7. Compare **same seeds** against frozen current C3 baseline for roster sizes 3/5/8/9/15, with/without broad tokutenkai, normal and strong SNS, member quality variance, standalone CD/handshake, headline Live followed by delayed cheki, graduation, and high overlapping member interest. Report final P/O/ΣA, A/O, F_i distribution, I old/new/expired/renewed, Gross/Net Cheki, voucher costs, attendee sources, queue fulfilled/abandoned, conversion yield, and independent revenue tests.

**Implementation status**: design spec and synthetic calibration only. No claim that TypeScript Runtime, historic calibration or tests were changed by this document.
