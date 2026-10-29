# Chronicle Runtime Implementation Pack v1.0

> **2026-10-29 World trend v0.3:** [World Palette Trend v0.3](Chronicle_World_Palette_Trend_v0.3.md) overrides older world-state assumptions. Raw eight-color Popularity drives Public/Otaku Impression; normalized Stripe is display-only. Seeded clustered events, Saturation memory, soft overheating and high-Saturation momentum damping k=0.15 are TUNABLE; short rare >50% shares allowed. World generator / fan conversion integration is still pending.

> **2026-10-29 vocal assignment refinement:** [Vocal Time-Slice Assignment v0.1](Chronicle_Vocal_Time_Slice_Assignment_v0.1.md) overrides the old automatic half-lineup relay/equal-seconds shortcut: explicit named singers per temporal slice, solo as one-person relay, real vocal seconds for Condition and Part Performance. Unison Pitch failures have a substantially smaller local impact (initial 0.25 multiplier TUNABLE) before ensemble averaging; this does not change the per-member seeded failure chance. Slice length 5s is a candidate, not LOCKED. Runtime unverified.

> **2026-10-29 integration handoff (proposed interfaces):** [Performance / Impression Integration Contract v0.1](Chronicle_Performance_Impression_Integration_Contract_v0.1.md) details member-owned Part Performance, failure isolation, seeded check/placement, World/Live update order, media reuse and 15 acceptance invariants. Exact member-vs-team vocal/dance normalization, World simulation coefficients and Ochi mode override remain explicitly OPEN; no runtime or regression completion claim.

> **2026-10-29 authority — Performance → Impression:** [World / Live Palette & Impression v1.0](Chronicle_EnvPalette_Performance_Impression_v1.0.md) supersedes old EnvPE-inside-Performance proposals. Performance = Technical + intrinsic Palette + Appeal + Familiarity; Public/Otaku Impression independently adjusts saved Performance using WorldPopularity and start-of-song LiveSat. TeamSat=50+TeamColor, LiveSat_next=.70*old+.50*SongColor, no LiveExpectation/Core; conservative audience coefficients TUNABLE. Personal failures never alter another member's Impression. Runtime not verified.

> **2026-10-29 Technical Performance v1.2 design authority:** [Technical Performance Curves v1.2](Chronicle_Technical_Performance_Curves_v1.2.md) supersedes conflicting *candidate numerics and failure-resolution rules* in v1.1: Song Appeal, ability–difficulty curves, unified song-level Vocal/Dance Difficulty and Pitch/Agility requirements, seeded failure check then duration-weighted random Part localization, repeating same-Part failures, diminishing per-path incremental penalties, and Ochi Sabi independent Pitch check without default +2 difficulty. All failures apply only to their assigned Part, not globally. Preserve v1.0 attribute-specific semantics and Palette v2.1; numerical coefficients remain TUNABLE, integration/runtime not verified. Condition v0.4 PF/VF multiplier contradiction is explicitly tracked in v1.2, not silently resolved.

> **2026-10-28 member profile UI authority:** [Member Profile UI & Trilingual Glossary v1.0](../design/Chronicle_Member_Profile_UI_Glossary_v1.0.md) locks Overall Ability, the five-axis and eight-color radar, collapsed-by-default 17 detailed attributes, song difficulty match labels, and Chinese/Japanese/English names (Breath ブレス, Power パワー, Agility 身体協調性, Teamwork チームワーク). This is presentation/spec only, not a runtime implementation claim.

 > **2026-10-28 archived candidate numeric curves (superseded where conflicting by v1.2):** [Technical Performance Curves v1.1](Chronicle_Technical_Performance_Curves_v1.1.md) parameterizes Breath/Rhythm baselines, Pitch/Agility probability and penalty, Tone/Power bonuses, StagePresence, low-Condition Attr effects, singing/dance combination, Familiarity and eight-part salience. These are **TUNABLE proposed values**, not historically calibrated nor runtime implemented; v1.0 attribute-specific semantics remain authoritative.


> **2026-10-28 Condition/Recovery & Part authority:** [Condition / Fatigue / Part Kernel v0.4c](../design/Chronicle_Condition_Fatigue_Part_Kernel_v0.4.md) overrides old `A(E)`, `Wraw`, FatigueDebt-only, immediate-rest settlement, and old key-part defaults in this Implementation Pack. Condition/PF/VF **recovery settles once each morning**; abnormality baseline mild/moderate/severe = 4/12/28 qualified days at NF14/8h; special overnight sleep degradation applies. **Technical Performance equations are already imported** via [Technical Performance Kernel v1.0](Chronicle_Technical_Performance_Kernel_v1.0.md) plus [Performance/Palette/Assignment](Chronicle_Performance_Palette_Assignment_v1.0.md); do not invent new numeric Fit curves where source remains TUNABLE. Runtime integration not yet verified.



> **2026-10-26 最新覆盖规范：** [Fan Lifecycle × Cheki × Reputation Integrated Spec v1.0](Chronicle_Fan_Reputation_Integrated_Spec_v1.0.md)。本文件内「不实现 Tier / Reputation」以及所有新 O 必须立即建立 A、TIF 当天结局等历史禁令，**均已被新规范覆盖**。玩家仅显示综合 Reputation（出道后），内部 Live/Music/Brand 三分项；NPC 固定综合值。新规范为设计合同，**不代表 Runtime 已实现**。旧模块未冲突条款仍然有效。

> **2026-10-26 Fan 机制最新增量：** [Fan / SNS / Interest / Broad Cheki v1.5](../design/Chronicle_Fan_SNS_Interest_Cheki_Spec_v1.5.md) 覆盖与其冲突的直接 Live→P/O/A、固定 R1 trial 与固定新人 Cheki 参加率规则。[Interest Runtime v1.0](Chronicle_Fan_Interest_Runtime_v0.1.md) 已作为 Staff adapter 默认 `V15` 模式：旧 C0–C3 仅保留为显式兼容/历史回归夹具，不能作为正式路径。

**实施唯一入口（2026-10-24）** · 状态：**文档已整理、公式已抽取；不是 Runtime 已完成或测试已通过的声明**。实现 Agent **不需要，也不应依赖读取 `idol-data-lab`**；游戏所需已提取公式、约束、优先级和待校准缺口全部保存在 Chronicle 本目录。外部研究仓库仅用于未来**显式批准的版本升级**，不能在实现中临时找旧公式填空。

## 1. 权威文件与读取顺序

| 顺序 | 本地文件 | 必须实现的内容 |
|---|---|---|
| 1 | [Policy / Scenario / Workflows](Chronicle_Policy_Scenario_Workflows_v1.0.md) | R4 全游戏固定；R2/R3 章节固定；仅 R1 可调；剧本甄选、Staff、玩家交互 |
| 2 | [Member / Training / Condition](Chronicle_Member_Training_Condition_v1.0.md) | 17 Attr、8 EXP、Familiarity、单一 Condition、恢复/风险、Staff AP |
| 3 | [Technical Performance — attribute-specific](Chronicle_Technical_Performance_Kernel_v1.0.md) | Breath/Rhythm 连续基线；Pitch/Agility 概率失误；Tone/Power 正向加成；Stage Presence 最终系数；Stamina 负荷 |
| 4 | [Performance / Palette / Assignment](Chronicle_Performance_Palette_Assignment_v1.0.md) | 八色、Opp3、PE、关键段落 1/2/3、Env 单次作用、Part/Member/Team Impression |
| 5 | [Fan / Cheki / Finance](Chronicle_Fan_Cheki_Finance_v1.0.md) | P/O/A_i/W_i、特典会队列与实收、普通拼盘合同、财务唯一账本 |
| Appendix | [Tier / Brand Calibration — archive only](Chronicle_Tier_Brand_Calibration_v1.0.md) | **非 Chronicle Runtime 必需**；仅供开发者历史标定查阅，不实现完整 0–10000 Tier、跨团排行或行业地位评价 |
| 6 | [Chronicle Game Design v0.10](../design/Chronicle_Game_Design_v0.10.md) | 序章人物、具体日期、剧情里程碑、合同和验收；**若旧 UI/Policy 描述冲突，以本目录 1–5 优先** |

**正式 Fan 获客 / SNS / Audience Demand 设计 v1.1（新权威覆盖）**：[Chronicle_Fan_Acquisition_Audience_Demand_v1.1.md](Chronicle_Fan_Acquisition_Audience_Demand_v1.1.md) 明确 Twitter/YouTube/Blog 每周 X→P、Public 活动知晓与购票、独立外部 X 需求、按意向和 Impression 转 O、新规券转化合并。**覆盖旧 Fan v1.0 中 Public 固定到场率、空位补 X 与统一转粉率的旧规则；概率仍 TUNABLE。C0–C3 Runtime 已接入并以同 seed 100-run 审计，C4/C5 尚未启用。**

**Fan × Cheki 可运行数值基线（TUNABLE）**：[Chronicle_Fan_Cheki_Executable_Formulas_v1.0.md](Chronicle_Fan_Cheki_Executable_Formulas_v1.0.md) 已给出到场、单场多推重建、Gamma 购买预算、双档选购、共享排队、Fan 转化/流失、毕业与剧本新人 seed 的**完整第一版算法**。实现时必须读取；具体概率为初始校准值，不是历史事实。原 Fan 文档缺口由此文件填充，后续通过 seeded 5/9/15 人回归调参。

**序章 Fan Acquisition × Affinity × Cheki 正式 E2E 测试指南**：[Chronicle_Prologue_Fan_Acquisition_E2E_Test_Runbook_v1.0.md](Chronicle_Prologue_Fan_Acquisition_E2E_Test_Runbook_v1.0.md) 规定源码审计、固定序章 B-route、人数/场馆/免费券/共享队列/毕业守恒断言、20-seed smoke、100 paired-seed 对照、必须产出的数据与提交 Gate。**测试任务已成文，不代表正式 Runtime 已运行。**

**序章获客 / Affinity / 新规券设计与独立模拟交接（2026-10-25）**：[Chronicle_Prologue_Acquisition_Affinity_Cheki_Calibration_2026-10-25.md](Chronicle_Prologue_Acquisition_Affinity_Cheki_Calibration_2026-10-25.md) 汇总 SNS、朋友推荐、Taiban、Public 购票需求、成员多推与赠券经济闭环的讨论决议、独立夹具结果及正式 Runtime 回归要求；**TUNABLE 候选尚未合并为运行时参数，非 E2E 已通过声明**。

**新规免费券合同（C4）**：[Chronicle_Newcomer_Voucher_Contract_v0.1.md](Chronicle_Newcomer_Voucher_Contract_v0.1.md) 将合同授权的外部新规免费体验接入既有共享 Cheki 队列、周度 Fan momentum 与 Finance；默认 Staff 基准保持关闭，直到场次授权和数值校准正式批准。

**C1–C3 观众渠道诊断夹具**：[Chronicle_Audience_Channel_Diagnostic_v1.md](Chronicle_Audience_Channel_Diagnostic_v1.md) 将文档候选的 SNS 知晓、Public 购票、朋友结伴与外部观众分源写成可复现测试 Kernel；它不替换默认 B-route 的既有到场模型。

**首次回归记录**：[Fan_Cheki_Regression_2026-10-24.md](Fan_Cheki_Regression_2026-10-24.md) 记录中性 fixture、12周×20 seeds 的初始基线、唯一调整的集中参数和校准后结果；它不是正式 Scenario 数据。

**第二轮压力回归（已验证）**：[Fan_Cheki_Stress_Regression_2026-10-24.md](Fan_Cheki_Stress_Regression_2026-10-24.md) 覆盖热门成员容量、多推共享时间、Live/互动成长响应的确定性测试夹具；不修改原中性参数与持久 Fan 数据结构。

**12周经营集成夹具**：[Chronicle_Operating_Simulation_v1.md](Chronicle_Operating_Simulation_v1.md) 将 Staff、Performance→Fan、成员级 Cheki 与 Finance 接到同一条确定性回归路径；它明确列出尚待迁移到持久 Calendar Runtime 的边界。

**成员规模与表现校准**：[Chronicle_Operating_Simulation_v2.md](Chronicle_Operating_Simulation_v2.md) 记录固定市场、规模化支持与成员级 Performance 三组 12 周 × 20 seed 对照；它复用 Fan v1 的 `.05 × Q_i`，以临时实际曝光样本驱动 `O→A_i`，不新增长期 Fan Cohort。

**Staff 决策与周度玩法夹具**：[Chronicle_Operating_Simulation_v3.md](Chronicle_Operating_Simulation_v3.md) 在冻结 v2 数值基线的前提下，验证 Staff 的阵容/训练/额外明确合同提案、AP 冲突和周度确认接口；不迁移正式 GameState、Calendar 或存档。

**Live 评论生成 Kernel**：[Chronicle_Live_Review_Generator_v0.2.md](Chronicle_Live_Review_Generator_v0.2.md) 从已结算的 Live 证据确定性生成 Otaku/Public/Media 日语评论；不参与 Fan、Performance、Cheki 或 Finance 结算，待报告存档契约正式协调后再接入。v0.1 保留为已替代的初版设计记录。

**Chronicle 展示与数据裁剪规则（LOCKED）**：不提供 Idol World Tier 表、Overall 评分、行业 Top50、跨团排名、其他团或本团的行业地位评价 UI/API。其他团仅以有必要的活动参演者、剧本人物和竞争日程出现。内部可保留少量由 Scenario 提供的活动难度、资源/曝光权重，但不得因此要求建立完整行业 Tier 或全团评分库。第五份 Tier 文档是历史校准附录，**不属于必读实施规范**。

**实现级优先级**：本 `README` 的冲突禁令 → 同目录专项规范 → Chronicle Game Design 剧本/合同 → 旧 `docs/design/Chronicle_*Kernel_v0.x` 历史提取。历史提取仅作追溯，不能推翻本目录。任何字段或公式若本目录标为 `TUNABLE/INTEGRATION_PENDING`，不得通过阅读旧文档“猜一个锁定值”。

## 2. 统一数值与数据契约

| 子系统 | 持久状态 / 类型 | 结算出口 |
|---|---|---|
| Scenario | `chapterId`, `scriptFlags`, `eventId`, `cutoff`, `R4_global`, `R2/R3_chapter`, `R1_runtime` | 授权决策、事件与本章固定运营规则 |
| Member | 17×int[0,20], 8×EXP[-100,100], Condition/Morale/Confidence[0,100], 2 abnormality enum, fatigueDebt, palette8[0,100] | 真实训练/负荷/排练经验 |
| Song | normalized SongPalette8, part structure, arrangementVersion, Familiarity[0,100], ordered key duty assignments | 已冻结的本曲 performance inputs |
| Live | `liveId`, contract, actualLineup, setlist, audience, resolvedDuties, `ExpectedImpression` | immutable actual outcome, ticket ledger |
| Fan | `P,O,A_i,W_i,O_unassigned`; **无 persistent Core** | weekly fan resolution, member purchase demand |
| Cheki | liveId/memberId/productId units, seconds, queue, commission, costs | actual sales, fan engagement, finance entry |
| Progression | 章节目标、真实动员/收入/粉丝/作品/演出机会、Scenario 隐藏难度和资源基准 | 玩家看到具体经营结果与章节评价；不计算/显示完整行业 Tier、跨团排名或本团行业地位 |
| Finance | idempotent cash/expense/asset/loan entries | report + opening/closing cash |

**通用不变量**：
- 所有日程、章节日期按 JST；时间推进不可跳过未决阻塞，不能遗漏同日多场。
- L3 历史开档先过滤时间截止，再形成开档状态；L4 玩家结果不能被未来现实资料覆盖。
- 每个 `liveId` 的结果、票务、Cheki、Fan momentum 和 Finance 账本必须幂等；Replay/Load 不重新掷随机数。
- 不显示隐藏 Performance/Impression 精确数值给玩家；报告显示可观察反应、到场、成员 Cheki 和本团收入。
- 不存在站位图、Center/Front/Back 乘数；不持久 Core；不使用十色；不使用双疲劳；R2/R3/R4 不开放自由编辑；Audition 仅 Scenario。
- Background 团用 Standard sparse state；玩家团用 Extended；两者使用同一规则/评分意义，不把背景历史 L2 推导每周重新叠加。

## 3. Runtime 结算顺序（不得跳步）

```text
chapter opening snapshot / cutoff → scripted policy & roster
  → Calendar + contract + Staff AP + legal/time checks
  → Staff resolves actual Live Lineup and Setlist
  → resolve first/second/third key duty candidates (else staff)
  → song-by-song: Condition/abnormality → technical Fit
  → BasePE + key contrast → EnvPalette once → PaletteMultiplier
  → Attribute-specific Vocal/Dance + StagePresence → Part Impression → Team / Member Impression → Condition cost/EXP
  → Completed Live outcome (immutable, unique liveId)
  → ticket/ordinary goods contract ledger
  → per-member Cheki queue → actual units → gross/share/cost ledger
  → immediate interaction feedback + event fan momentum
  → weekly fan resolution (P/O/A/W; once)
  → monthly observable progression + finance/report/snapshot
```

**Event transaction rule**：合同 `OFFERED/ACCEPTED` ≠ Live `COMPLETED`；未完成不得有 Live 收入。必须先处理待决 `OFFERED`，同一天多个事件逐个记录；月报按**事件日期**聚合，不能用已扣下月费用的现金倒推上月期初。

## 4. 参数登记册：哪些能编码，哪些必须单列配置

| Domain | `LOCKED` 公式/规则 | `TUNABLE / INTEGRATION_PENDING`（不可冒充权威） |
|---|---|---|
| Attributes | 17项；8 EXP、Wit/Age/Tenure/level、weekly decay、Familiarity维护 | Ability 五轴内部精确权重；章节训练环境倍率、异常 EXP 折扣 |
| Condition | 单一 Condition；A(E)、Wraw/song；恢复/睡眠；FatigueDebt | Stamina/NF 全域插值、异常风险 BaseRisk、StatusFactor 标定 |
| Palette | 8色语义/归一化；BasePE；Opp3；key bonus cap12；PE multiplier；8色 Load/Capacity | **Env×PE 的单次合并函数**、Env World/Live动态、成长 EventScale/Venue/Role 系数、历史八色回归 |
| Performance | Singing(Breath/Rhythm baseline, Pitch failure, Tone bonus)；Dance(Rhythm baseline, Agility failure, Power bonus)；StagePresence final；Palette×PartExposure×ArrangementExecution；DutyShare 无 standing | 各属性连续函数与失误概率曲线、Tone/Power bonus、StagePresence、PartExposure、ArrangementExecution、观众层权重、Expected 因子/alpha |
| Fan | P/O/A/W、购买力 A×W、周 momentum、毕业处理 | P→O、O→A、W变化、流失、multi-oshi overlap、EventFactor/PublicTrial、竞争 |
| Cheki | 1000/2000双档、20% gross佣金、每粉5s overhead、60min基线、真实容量/ledger | 商品时长/耗材、购买选择/复购/放弃、临时延长 |
| Live/Finance | 普通拼盘 15%/N + 25%目当池、特殊合同、现金唯一性 | 目当缺失 fallback、到场概率、预算/借款具体校准 |
| Progression / Scenario | 真实到场、票房、粉丝、作品、活动履历、章节达成条件 | 隐藏机会/邀约权重可由 Scenario 校准；**不要求** Overall/Tier 0–10000 评分、行业排行榜或 Brand 连续插值 |
| Policy/Scenario | R4全局固定、R2/R3每章固定、仅R1可调、Audition仅剧本 | **每章**具体 R2/R3 参数由 Scenario 数据提供，不得生成通用玩家编辑器 |

**Tier 依赖消除**：凡下游旧公式使用 `TeamTierFactor`、`TierFactor`、`LiveTierRate` 或 Staff 的 `Tier+HC`，Chronicle 使用本章配置的训练环境、预期演出基准、场次规模和自动化等级（均 `TUNABLE` 或 Scenario-defined）；**不得为了这些输入重新实现完整 Tier**。

**执行要求**：任何尚未锁定的函数均须有显式 `ParameterStatus`、默认行为说明、测试和版本号；没有足够定义时报告 `NOT_IMPLEMENTED`。允许开发独立 LOCKED Kernel 与中性测试 fixture，**不允许把中性 fixture 当正式游戏参数**。

## 5. 最小跨系统验收矩阵

| ID | Test | 必须成立 |
|---|---|---|
| I01 | 2013-01 序章开始 | 不读2014以后发行曲目；15人面试/6AP；Audition不可手动发起 |
| I02 | Policy 变更 | R4 永远拒绝；R2/R3 本章拒绝；章节脚本可以更新 R2/R3；R1 合法 |
| I03 | 9人团普通 Live | 全员出演；无常规轮换；无站位加成 |
| I04 | 15人团轮换 | 先选 Lineup，再按1/2/3候补选key duty；未入选不可获舞台曝光 |
| I05 | Key contrast | yellow对向紫/红/粉按.25/.5/.25；Ochi上限+8、全曲key总cap+12 |
| I06 | PE→M | PE0=.4，45=1，100=2；Env=1退化原 PE（集成测试） |
| I07 | Live Condition | 逐曲扣/恢复，不建双疲劳；排练 EXP 和 Familiarity 不重复 |
| I08 | 现场表现 | Breath/Rhythm 连续、Pitch/Agility 只在不足时概率扣分、Tone/Power 正向 bonus、StagePresence 最终乘数；MemberImpression 只按实际 DutyShare；无 StandingExposure |
| I09 | Fan/Cheki | 允许 ΣA_i>O；2000元商品不是两张1000；佣金按 gross 20%；5秒换粉 |
| I10 | 财务 | 免费商场0收费收入；5/24出道门票0/场租0；特殊活动不套普通拼盘 |
| I11 | 月度进展 | 展示本团动员、收入、粉丝变化、歌曲/成员成长及章节目标；无完整 Tier 分段、跨团排名、本团行业地位评价 |
| I12 | 重放/读档 | 同 liveId 不重复扣Condition/EXP、发粉、收Cheki或记现金 |
| I13 | Calendar | 周三定期自动；同日多场不遗漏；OFFERED 不被自动推进越过 |
| I14 | 长期游戏 | 每章 R2/R3 固定、R4全局固定；仅R1可改；剧情机会不因成就被擅自生成 |

## 6. Agent 交付与验收

1. **只读取本目录 1–5 + Fan × Cheki Executable Formulas + 本地 Game Design v0.10**，禁止把研究仓库作为实现依赖。
2. 在 PR 中提供：本地公式→代码函数/字段的映射、`LOCKED/TUNABLE/NOT_IMPLEMENTED` 清单、seeded regression fixtures、逐模块单测、端到端 3/5/9/15 人序章回归。
3. 不得把设计文档提交视为 Runtime 完成；每个缺口需显式 issue/测试标记。当前仅完成文档迁移，**未声称运行测试**。
