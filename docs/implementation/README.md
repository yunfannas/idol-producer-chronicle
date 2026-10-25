# Chronicle Runtime Implementation Pack v1.0

**实施唯一入口（2026-10-24）** · 状态：**文档已整理、公式已抽取；不是 Runtime 已完成或测试已通过的声明**。实现 Agent **不需要，也不应依赖读取 `idol-data-lab`**；游戏所需已提取公式、约束、优先级和待校准缺口全部保存在 Chronicle 本目录。外部研究仓库仅用于未来**显式批准的版本升级**，不能在实现中临时找旧公式填空。

## 1. 权威文件与读取顺序

| 顺序 | 本地文件 | 必须实现的内容 |
|---|---|---|
| 1 | [Policy / Scenario / Workflows](Chronicle_Policy_Scenario_Workflows_v1.0.md) | R4 全游戏固定；R2/R3 章节固定；仅 R1 可调；剧本甄选、Staff、玩家交互 |
| 2 | [Member / Training / Condition](Chronicle_Member_Training_Condition_v1.0.md) | 17 Attr、8 EXP、Familiarity、单一 Condition、恢复/风险、Staff AP |
| 3 | [Performance / Palette / Assignment](Chronicle_Performance_Palette_Assignment_v1.0.md) | 八色、Opp3、PE、关键段落 1/2/3、Env 单次作用、Part/Member/Team Impression |
| 4 | [Fan / Cheki / Finance](Chronicle_Fan_Cheki_Finance_v1.0.md) | P/O/A_i/W_i、特典会队列与实收、普通拼盘合同、财务唯一账本 |
| 5 | [Tier / Brand Calibration](Chronicle_Tier_Brand_Calibration_v1.0.md) | 完整 0–10000 Tier 表、rolling 12m、票房/动员 gate、Brand gains/decay |
| 6 | [Chronicle Game Design v0.10](../design/Chronicle_Game_Design_v0.10.md) | 序章人物、具体日期、剧情里程碑、合同和验收；**若旧 UI/Policy 描述冲突，以本目录 1–5 优先** |

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
| Tier | Live/Music/Brand/Overall 0–10000, rolling event history | monthly scores/tiers, rep gains/decay |
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
  → Part Impression → Team / Member Impression → Condition cost/EXP
  → Completed Live outcome (immutable, unique liveId)
  → ticket/ordinary goods contract ledger
  → per-member Cheki queue → actual units → gross/share/cost ledger
  → immediate interaction feedback + event fan momentum
  → weekly fan resolution (P/O/A/W; once)
  → monthly tier/brand + finance/report/snapshot
```

**Event transaction rule**：合同 `OFFERED/ACCEPTED` ≠ Live `COMPLETED`；未完成不得有 Live 收入。必须先处理待决 `OFFERED`，同一天多个事件逐个记录；月报按**事件日期**聚合，不能用已扣下月费用的现金倒推上月期初。

## 4. 参数登记册：哪些能编码，哪些必须单列配置

| Domain | `LOCKED` 公式/规则 | `TUNABLE / INTEGRATION_PENDING`（不可冒充权威） |
|---|---|---|
| Attributes | 17项；8 EXP、Wit/Age/Tenure/level、weekly decay、Familiarity维护 | Ability 五轴内部精确权重；Tier +/- 插值；异常 EXP 折扣 |
| Condition | 单一 Condition；A(E)、Wraw/song；恢复/睡眠；FatigueDebt | Stamina/NF 全域插值、异常风险 BaseRisk、StatusFactor 标定 |
| Palette | 8色语义/归一化；BasePE；Opp3；key bonus cap12；PE multiplier；8色 Load/Capacity | **Env×PE 的单次合并函数**、Env World/Live动态、成长 LiveTier/Venue/Role 系数、历史八色回归 |
| Performance | BaseQuality×aesthetic×PartExposure×ArrangementExecution；DutyShare 无 standing；Expected 四输入 | Technical Fit、PartExposure、ArrangementExecution、观众层权重、Expected 因子/alpha |
| Fan | P/O/A/W、购买力 A×W、周 momentum、毕业处理 | P→O、O→A、W变化、流失、multi-oshi overlap、EventFactor/PublicTrial、竞争 |
| Cheki | 1000/2000双档、20% gross佣金、每粉5s overhead、60min基线、真实容量/ledger | 商品时长/耗材、购买选择/复购/放弃、临时延长 |
| Live/Finance | 普通拼盘 15%/N + 25%目当池、特殊合同、现金唯一性 | 目当缺失 fallback、到场概率、预算/借款具体校准 |
| Tier/Brand | 0–10000全表、Overall .45/.30/.25、rep 0.9875、TIF/重大 Live规则 | Live/Music 连续插值、Brand结构维护、特殊场馆/稀疏数据边界 |
| Policy/Scenario | R4全局固定、R2/R3每章固定、仅R1可调、Audition仅剧本 | **每章**具体 R2/R3 参数由 Scenario 数据提供，不得生成通用玩家编辑器 |

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
| I08 | 现场表现 | MemberImpression 只按实际 DutyShare；不存在 StandingExposure |
| I09 | Fan/Cheki | 允许 ΣA_i>O；2000元商品不是两张1000；佣金按 gross 20%；5秒换粉 |
| I10 | 财务 | 免费商场0收费收入；5/24出道门票0/场租0；特殊活动不套普通拼盘 |
| I11 | 月度评分 | Overall round(.45 Live +.30 Music +.25 Brand)；分段按本地完整表 |
| I12 | 重放/读档 | 同 liveId 不重复扣Condition/EXP、发粉、收Cheki或记现金 |
| I13 | Calendar | 周三定期自动；同日多场不遗漏；OFFERED 不被自动推进越过 |
| I14 | 长期游戏 | 每章 R2/R3 固定、R4全局固定；仅R1可改；剧情机会不因成就被擅自生成 |

## 6. Agent 交付与验收

1. **只读取本目录 1–5 + 本地 Game Design v0.10**，禁止把研究仓库作为实现依赖。
2. 在 PR 中提供：本地公式→代码函数/字段的映射、`LOCKED/TUNABLE/NOT_IMPLEMENTED` 清单、seeded regression fixtures、逐模块单测、端到端 3/5/9/15 人序章回归。
3. 不得把设计文档提交视为 Runtime 完成；每个缺口需显式 issue/测试标记。当前仅完成文档迁移，**未声称运行测试**。
