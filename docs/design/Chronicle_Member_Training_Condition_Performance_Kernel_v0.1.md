# Chronicle｜Member · Training · Condition · Performance Kernel v0.1

> **2026-10-24 更新后的权威覆盖**：`idol-data-lab/main@5499e7c5355b` 已将 03C/03E/03H 改为八色。本文件 §0 关于“03H仍是十色”和 §6 的 `SOURCE_PENDING`/旧十色公式**现已失效**；八色执行、Opp3、PE倍率、成长求和及最新测试请直接使用 [Eight-Color Palette · Performance Kernel v0.2](Chronicle_Eight_Color_Palette_Performance_Kernel_v0.2.md)。本文件其他成员属性、Training、Condition 和 Part/Impression 结构继续有效，直到更高版本替代。禁止实现本文件 §6 历史十色公式。

**状态**：公式抽取 / Implementation handoff（2026-10-24）。本文件把 `idol-data-lab` 已确认的游戏规则变成可实现的输入、持久状态、运算和测试。**不是 Runtime 已实现证明**。  
**适用**：所有 Chronicle 剧本、AI 背景团和玩家团；序章以 2013–2014 的实际成员/歌曲/日程为输入，不复制另一套序章专用表现公式。  
**权威冲突处理**：当前 Fan Market v0.2 与八色 Palette v2.0 覆盖早期三层 Core 与十色色轮；本文件**不会**把十色权重直接换成八个槽位。各条以 `LOCKED`（源有确定规则）、`TUNABLE`（形状确定、参数缺失）、`SOURCE_PENDING`（当前来源未找到最终公式）、`DEPRECATED` 标记。

## 0. 精确来源与继承顺序

| 领域 | 研究仓库来源 | 使用限制 |
|---|---|---|
| 17 Attr、Ability | `docs/member-attributes.md`；`tools/reality-data/attributeSchemaV2.mjs` | Ability 只是 Lab 汇总，不是现场 Performance |
| Training / Staff / Calendar | `docs/Idol_GPT_03G_Training_Schedule_Condition_v0.1.md`（merged design record）；`docs/Idol_GPT_03_Game_Design_v0.3.md` | 03G 已声明回并到 master；本文件提取其可核的明确数值 |
| Condition / Status | `docs/Idol_GPT_03D_Condition_Status_System_v0.1.md`；03G §9 | 03D 覆盖旧双疲劳；03G 保留更细活动负荷参数 |
| Palette Growth | `docs/Idol_GPT_03C_Member_Palette_Growth_v0.1.md` | **十色能力向量为旧 schema**；成长结构可参考，八色维度/容量必须迁移校准 |
| Live / Impression | `docs/Idol_GPT_03E_Live_Impression_System_v0.1.md` | 保留 Part→Impression 的因果结构；其十色与 Core audience layer **废弃** |
| Palette Performance | `docs/Idol_GPT_03H_Palette_Performance_v0.1.md` | 十色、Opp3、Key Part Contrast、PE 曲线都是**历史公式**；须先对齐八色 v2.0 再决定可复用部分 |
| Fan 接口 | `docs/Idol_Fan_Market_Model_v0.2.md` | 持久状态 P/O/A_i/W_i；不持久存 Core |
| 可携带旧规范 | `docs/idol_producer_portable_system_spec_v2.md` | 2026-09-16 快照；其手工 Overall、旧 Core、十色、TargetPerformancePalette 不是当前权威 |

> 已核对源文件本身的声明：03G 是 merged record，03F 是 superseded record；03H 覆盖旧 lambda，但仍是**十色版本**。因此不能仅按文件日期猜测最终八色算法。下列数值有来源但未获八色新权威复核的部分，单独标为 `PALETTE_MIGRATION_PENDING`。

## 1. Member 数据结构 `LOCKED`

```ts
type MemberAttributes = {
  // physical
  agility:number; natural_fitness:number; stamina:number;
  // appearance
  cute:number; pretty:number;
  // performance
  pitch:number; tone:number; breath:number; rhythm:number;
  power:number; stage_presence:number;
  // mental / communication / creative
  wit:number; humor:number; talking:number;
  teamwork:number; fashion:number; creativity:number;
}; // 17 integers, each 0..20

type MemberSimulationState = {
  attributes: MemberAttributes;
  attributeExp: Partial<Record<CoreAttribute,number>>; // [-100,+100], core 8
  condition:number;  // 0..100
  morale:number; confidence:number; // 0..100
  vocalAbnormality:"none"|"mild"|"moderate"|"severe";
  physicalAbnormality:"none"|"mild"|"moderate"|"severe";
  fatigueDebt:number; // derived accumulating risk state; NOT second fatigue meter
  // member palette state: use current eight-color schema after migration
};
type CoreAttribute = "pitch"|"tone"|"breath"|"rhythm"|"agility"|"power"|"stage_presence"|"stamina";
```

- **Ability（0–100）仅作显示/校准**：`round(5×(0.30×singing + 0.30×dancing + 0.20×visual + 0.12×fan_engage + 0.08×media_appeal))`，各雷达轴 0–20；`singing` 由 pitch/tone/breath/rhythm 加权并乘 stage-presence 修正，`dancing` 由 rhythm/agility/power/natural_fitness 加权；确切轴内权重以属性代码/schema 为准，不能在本文件编造。现场不得用 Ability 直接代替 PartBaseQuality。
- `overall_rating` 是17项简单均值，仅诊断。禁止新增隐藏 `professionalism / ambition / sensitivity / work_rate / loyalty / determination / injury_proneness` 等旧属性。
- 人物性格、职业志向、Traits、团队关系属于独立状态，不要把它们混入17 Attr。
- `stamina` 决定体能消耗速度，不直接奖励首首歌曲技术质量；`natural_fitness` 参与恢复/风险与相关展示，不等于持久 physical fatigue。

## 2. Attribute EXP `LOCKED`

### 2.1 经验增长

对八项核心属性 a，训练/排练/现场表演累计：

```text
GrowthEXP_a =
  EffectiveHours × 1.0 × SourceFactor × AttributeDifficulty_a
  × FocusFactor_a × WitFactor × AgeFactor × TenureFactor
  × TeamTierFactor × CurrentLevelFactor_a × AbnormalityFactor_a

WitFactor = clamp(1 + 0.035 × (Wit−12), 0.75, 1.30)
AgeFactor = clamp(1.15 − 0.025 × (Age−18), 0.65, 1.15)
TenureFactor = 1.15 / (1 + 0.05 × TenureYears)
CurrentLevelFactor_a = 1 − 0.02 × max(0, Attribute_a−10)
AttributeDifficulty_a = 0.8 if a∈{tone,agility}, else 1.0
```

TeamTierFactor：E=.94、D=1.00、C=1.06、B=1.12、A=1.18、S=1.24，细分 +/- 约每半档 ±.02（**需要统一插值表**）。

| 真实活动 | SourceFactor | Focus |
|---|---:|---|
| 基础综合唱跳训练 | 1.0 | None：八项各1.05；单项 Focus：选中1.45，其他1.00 |
| Song Rehearsal | 0.5 | 全部1.00 |
| Live **实际 stage time** | 1.0 | 全部1.00 |

- 演出待机、移动、特典会时间**不**计作舞台训练；练歌一小时同时给熟练度和0.5×基础属性 EXP。
- `AbnormalityFactor_a` 只降低受伤相关成长，确切值 `TUNABLE`；不因伤病修改自然衰减公式。
- 每项 `AttributeEXP` 累积至 +100 / −100 时属性 ±1，EXP 归零，**不保留溢出**；属性边界 0–20。不能用 EXP 当作可无限增长的浮点属性。
- 不存在个人 Attribute Potential / Soft Cap。

### 2.2 自然衰减

```text
DecayEXP_a/week = 0.7 × max(0, Attribute_a−10)
NetEXP_a = ΣGrowthEXP_a − DecayEXP_a
```

例：Attr15 的周衰减为 3.5 EXP；Attr10 为0；Attr20 为7。Wit12、Age24、Tenure3年、D团、Attr约15，约4h有效唱跳暴露/周为原规范的**维持校准锚**，不是每个人硬性所需课时。

## 3. Formation Familiarity 与自动训练 `LOCKED`

每个 arrangement/version 持久化 `F∈[0,100]`，不是歌曲本体唯一全局熟练度；换阵型须记录 version 和熟练度损失。

```text
DecayDebt_week = 0.02 × F_previous
if performed_in_previous_week: DecayDebt_week *= 0.5

ExposureHours = actual_song_rehearsal_hours + actual_stage_song_hours
RawFamiliarityGain = 6 × ExposureHours
MaintenancePaid = min(RawFamiliarityGain, DecayDebt_week)
RemainingGain = RawFamiliarityGain − MaintenancePaid
FamiliarityGrowthFactor = max(0.15, 1−F/120)
FamiliarityAttrFactor = 0.5 + 0.5×TeamCoreAttrAvg/14
F_next = clamp(F_previous − (DecayDebt_week−MaintenancePaid)
               + RemainingGain×FamiliarityGrowthFactor×FamiliarityAttrFactor, 0,100)
```

以上最后一行是**实现用的等价展开示意**；来源明确“先偿还 decay debt，再成长”，但同周多次训练的积分/取整、跨周时点仍需测试冻结。不得把一次小时同时重复用于两次 familiarity growth。新 arrangement 的初始 F/改动损失曲线尚未锁定。

Staff 按固定优先级排训练：
1. 维持 Active Song List 中歌曲的 Familiarity（按顺序）；
2. 维持每名成员八项 Attribute（先抵扣 Live/排练已赚 EXP）；
3. 按歌曲顺序增长 Familiarity；
4. 剩余时间增长 Attribute。

- 训练以 0.5h 为最小 slot；每名成员分别计算维护需要，再尽量合并相近需求者；玩家只定 Training Policy / Active Song / Focus，不逐人手排。
- `Training Intensity`：Conservative 目标 projected Condition≥65；Normal≥55（默认）；Aggressive≥45。预计 Condition<25 原则上不安排非必要训练；疲劳时优先削减增长，再考虑维护。
- Review Meeting 不增加 Familiarity；真正排练/演出才增长。

## 4. Condition、恢复、异常 `LOCKED` 结构

### 4.1 唯一体能状态

```text
Condition_new = clamp(Condition_old − Cost_activity + Recovery, 0,100)
Cost_activity = Duration × Intensity × PersonalLoad × StaminaMod
```

仅存一条 `Condition`；Vocal/Physical 是各自的 `none/mild/moderate/severe` 异常枚举。普通 Condition 降低主要影响 Breath/Power/Rhythm/稳定性，不把全场 Impression 粗暴乘同一折扣；Stage Presence 不因普通低 Condition 直接减分。

### 4.2 逐曲 Live 负荷（03G 的细化公式）

```text
E = 100 − Condition
A(E) = 0.62 + 0.0025×E + 0.75/(1+exp(−(E−67)/10))
Lv = 1.5 × (VocalDifficulty/12)^1.5
Ld = 1.5 × (DanceDifficulty/12)^1.5
Wraw_song = 2 + Lv + Ld
ConditionCost_song = Wraw_song × StaminaMultiplier × A(E)
```

Stamina14→StaminaMultiplier=1；**其他 Stamina 的精确曲线未在当前抽取文件锁定**。每首歌结束后立即更新 Condition；下一首重新读取当前能力/异常。MC、休息、换装、unit未出演可以恢复。

特典会：`Wraw_tokuten = 0.08 × completed_interactions`（源使用20秒/interaction参考）；**Chronicle ¥1,000/¥2,000 产品的真实服务时长可以不同**，不得按“每张=一次20秒”无条件推算交互次数。

### 4.3 非 Live RawLoad/h（03G）

| 活动 | RawLoad / h |
|---|---:|
| 基础综合训练、Song Rehearsal、Dance Lesson | 3.0 |
| Vocal Lesson、Formation-only | 2.0 |
| Recording / 高强度录音 | 1.5 / 2.5 |
| MV、长时间站立活动 | 1.5 |
| Photoshoot、Variety/TV | 1.0 |
| Livestream、Talk、Radio | 0.6 |
| 城际 Rail/Bus、长途 Bus/Economy Flight、恶劣移动 | 0.4 / 0.7 / 1.0 |

异地远征当天可额外 +1.5 raw overhead（条件性）。所有活动占实际 Calendar 时间；Travel 不是 free break。

### 4.4 恢复与睡眠

```text
PostTrainingRecovery (≥1h 后预留0.5h) = 3.0 × NFMultiplier
PostLiveRecovery (预留0.5h) = 4.5 × NFMultiplier
FreeBreakRecovery = 3 × sqrt(minutes/15) × NFMultiplier

SleepRecovery =
  22 × (SleepHours/8)^0.8 × NFMultiplier
  × (0.9 + 0.002×Morale)
  × (0.90 + 0.40×((100−Condition_at_bed)/100)^2)
```

NaturalFitness14→NFMultiplier=1；NF10≈.75、12≈.87、16≈1.17、18≈1.35、20≈1.50（当前离散锚，完整曲线 `TUNABLE`）。睡眠、免费休息不能重复占同一时段。

### 4.5 FatigueDebt 和异常风险

```text
MorningCondition = Condition_after_sleep
Gain = max(0, 70−MorningCondition)
Recovery = 1.5×max(0, MorningCondition−70)
FatigueDebt_next = max(0, FatigueDebt_previous + Gain−Recovery)

P(abnormality_type) =
  BaseRisk × LowConditionRisk × RecentRelevantLoad × PersistenceMod
```

- 每个早晨风险检查一次，读取 FatigueDebt、近期声带/身体负荷及已有异常；源仅锁定**风险因子结构**，概率系数 `TUNABLE`。
- Vocal mild 影响 Breath/Power；moderate 高音/长solo受限；severe 需替唱/垫音等应急。
- Physical mild 不额外罚阵型；moderate/severe 限制动作，替位/座椅导致 Formation 执行损失。不能把异常当第二个连续疲劳条。
- `Morale` / `Confidence` 均0–100，Live/事件即时更新，Policy/Role 长期漂移。长期成长 `StatusFactor=HealthContinuityFactor×MoraleFactor×ConfidenceFactor`，通常≈1.0，0.85–1.10是建议校准区间，不是固定 clamp。
- Weekly Status Report 汇总时间加权平均 Condition、最低 Condition、异常变化和 Morale/Confidence；**不得重新建立 Weekly Physical/Vocal Fatigue**。

## 5. Performance → Impression（结构 `LOCKED`，数值 `TUNABLE`）

### 5.1 单一因果链

```text
CurrentCondition + abnormalities
  → EffectiveAbility by vocal/dance part
  → BaseQuality_p = Fit(EffectiveAbility_p, PartDifficulty_p, AssignmentBurden_p)
  → PaletteExpressionMultiplier_(audience,p)
  → RawPartImpression_(audience,p)
  → FormationExecutionFactor_p
  → FinalPartImpression_(audience,p)
  ├─→ TeamImpression_(audience) → TeamImpression → Satisfaction
  └─→ MemberImpression_(member,audience) → member exposure / fan momentum
```

Vocal Fit 主要用 Breath/Rhythm/Pitch/Tone；Dance Fit 主要用 Rhythm/Agility/Power；合唱使用**实际参与者平均执行**，不能由最强成员代替全团。Fit 的具体难度差曲线和 AssignmentBurden 尚未锁定。

### 5.2 Part / Team / Member 公式

```text
RawPartImpression[L,p] =
  BaseQuality[p] × PaletteExpressionMultiplier[L,p] × PartExposureCoefficient[p]

FinalPartImpression[L,p] =
  RawPartImpression[L,p] × FormationExecutionFactor[p]

TeamImpression[L] = Σ_p FinalPartImpression[L,p]
TeamImpression = Σ_L AudienceShare[L] × TeamImpression[L]

MemberImpression[m,L] =
  Σ_p FinalPartImpression[L,p] × DutyShare[m,p] × StandingExposure[m,p]
```

- `PartExposureCoefficient` 是 part 重要度/可记忆度；`StandingExposure` 是成员 center/front/mid/back、spotlight 等；两者不可混成一个参数。
- MemberImpression **不要求** Σ成员 = TeamImpression；成员出口不是团队分数的零和拆账。
- 03E 中 L=Public/Otaku/Core 属于**旧分层标签**。在当前 Fan v0.2 中，至少使用 Public、Otaku 两个**当前观众/响应层**；成员 affinity 可以细分 Otaku 的当场响应，但**不能新建持久 Core**。具体层权重 `SOURCE_PENDING`。
- `EffectiveExposure` 用于 Fan 接口；**不得**在 Fan 阶段再次施加 WorldTrend/LivePalette/ColorContribution 等第二套审美增益。若最新八色模型另有明确接口，以新模型为准并标记差异。

### 5.3 Expected Impression 与满意度

```text
ExpectedImpression = VenueBase(VenueSize)
  × TierFactor(TeamTier) × SlotFactor(SlotType) × SetlistFactor(N_songs)

SetlistFactor(N) ∝ N^alpha, 0<alpha<1
SatisfactionRatio = TeamImpression / ExpectedImpression
```

- Expected **开演前冻结**；TeamTier、SlotType、歌曲数、VenueSize 是仅有的四个结构性输入。票价、Brand、MC、VTR、换装、Season 不再另行乘进 Expected。
- VenueBase/TierFactor/SlotFactor/alpha 和满意度 UI 映射 **TUNABLE**；Expected 必须正数并对零歌/取消场次做显式分支。
- World/Live审美环境只在 `PaletteExpression` 阶段应用一次；MC/VTR/换装可调整审美饱和度、Condition，不直接加 Impression。

## 6. 八色 Palette v2.0 迁移门禁 `SOURCE_PENDING`

**发现的版本冲突**：03E（2026-09-15）规定普通 Part=Team Palette、Key Part=个人 Palette，并给颜色关系 bonus；03H（2026-09-16）改为十色歌曲方向×参与者 Developed Palette 均值，加 Opp3 对向 contrast bonus；03G/portable 快照还留有旧 `TargetPerformancePalette/lambda`。它们**相互冲突**，且都早于当前八色 v2.0。不能择一当八色权威。

已确认可保留的抽象职责：
- Song Palette 是歌曲本体只读审美方向；L2B→L3按 cutoff 过滤。
- Member Developed Palette 是**非归一化能力**，不是 Assigned Member Color；成员色是培养/形象方向。
- Team Palette 表示团队长期审美语言；Formation/Part/Lead 决定实际承担者与曝光。
- 技术质量和审美表达分离，审美只乘一次进入 Impression；场次结束后传递给 Fan Market v0.2。
- 成员 Palette 成长存在 Stage Presence capacity、Age/Tenure/Wit learning、StatusFactor、停用衰减/ColorMemory reactivation 等机制，但十色 `PaletteLoad=sum_{10}`、Opp3 和具体倍率在八色下**不能无条件照搬**。

**历史公式（仅设计档案，不执行）**：
```text
Load_old(x)=0.03*(x/20)^1.7, x<=20
Load_old(x)=0.03+((x−20)/60)^2, x>20
Capacity_old=0.5+0.01*StagePresence^2
CapacityFactor_old=1−0.15*r^6 (r<=1), else 0.85*exp(−3.8*(r−1))
PE_old=dot(SongPalette_10, AvgMemberDeveloped_10) + KeyPartContrast_10
Multiplier_old=0.4+0.6*(PE/45)^1.2 (PE<45), else 1+(PE−45)/55
```

这些**只能作为回归候选**，不是八色实现指令；尤其不能把 `Opp3` 或十色严格对向表复制进八色。

**八色冻结前必须补齐**：颜色枚举/顺序、SongPalette 归一化/类型、Member/Team Developed 维度与容量、颜色距离/对向定义（若仍适用）、Part审美表达、Env审美环境、成长/遗忘、旧十色数据迁移策略，以及最少3个已审核歌曲/成员/团队黄金测试。若权威定义在其他分支/未归档设计稿，需先引入并记录 SHA，不能凭名称猜测。

## 7. Calendar / Staff 接口（提取已有可执行约束）

```text
1 timeslot = 0.5h = 1 AP
ManagerAP_total/week = 80 × manager_count
ManagerAP_usable/week = 80×manager_count − 4×active_idol_count
ConcurrentTeamSchedules <= permanent_manager_count
CoachAP/week = 80; UnusedCoachAP → same-role RP (1:1)
```

- 每名 Idol/专职 Coach/Producer 有独立 Calendar；Manager 由 AP 和并行线约束，不再维护个人日历。团队活动必须同时通过日历可用、AP、Manager 并行、专业人员、Condition 保护和预算。
- 特典会基础 manpower = 实际参与成员数；无特典会 Live 起始参考 `ceil(performing_idol_count/4)`，制作加人另算。临时工可补 manpower，**不能增加 Manager 并行线**。
- 自主 SNS/直播占成员时间与 Condition；如果是团队运营内容则同时占 Manager 资源。
- `R1/R2/R3/R4` 决策权限、Staff Automation Grade 以 `Idol_Producer_Policy_Rules_Spec_v0.1.md` 为准，不用 Staff skill/quality 假属性。

## 8. 运行时接口与原子结算

```ts
interface MemberKernel {
  advanceCalendarSegment(memberId:string, segment:CalendarSegment): StatusDelta;
  awardAttributeExp(memberId:string, source:TrainingSource, hours:number): AttributeDelta;
  applyWeeklyMaintenance(weekId:string): WeeklyMemberDelta;
}
interface PerformanceKernel {
  previewExpected(live:LiveContract): ExpectedImpression; // freezes pre-show
  resolvePart(ctx:LiveContext, part:Part): PartOutcome;
  finalizeLive(ctx:LiveContext, parts:PartOutcome[]): LivePerformanceOutcome;
}
interface LivePerformanceOutcome {
  liveId:string;
  teamImpression:number;
  memberImpression:Record<string,number>; // plus audience breakdown as needed
  satisfactionRatio:number;
  // actual effective exposure/role attribution for Fan Market v0.2
}
```

上述 TypeScript 是**接口建议**而非源文件已存在的导出。状态修改应产出按 `live_id / segment_id / week_id` 唯一的 ledger/outcome，重放幂等；一次 Live 的 Condition/EXP/Impression 不得二次结算。歌曲段落读取**上一段更新后的** Condition。Live Report 只展示允许玩家观察的事实，不泄露内部 Fit/Palette 数值。

## 9. Agent 验收测试（必须写成真实测试）

| ID | 验收 |
|---|---|
| M01 | 17 Attr 合法边界；Ability 汇总不参与 PartBaseQuality；废弃隐藏属性不存在 |
| M02 | Wit12→1；Age18→1.15；Attr15 decay=3.5 EXP/周；Tone/Agility 0.8 |
| M03 | 基础训练 None 1.05、单项 Focus 1.45；排练0.5、舞台1.0；演出待机0 |
| M04 | 属性跨 ±100 时 ±1 且EXP归零；不保留溢出；0–20 clamp |
| M05 | F=80上周演过→本周 decay debt=.8；没演过→1.6；maintenance先于增长 |
| M06 | Normal projected floor 55；排期时间冲突、Manager AP不足、并行不足有不同错误 |
| M07 | 逐曲 Condition 更新；MC恢复；次曲读取新 Condition；普通低 Condition 不直接统一扣 Stage Presence |
| M08 | FatigueDebt 高于阈值才增加异常风险；mild Physical 不破坏 formation；moderate+ 才影响 |
| M09 | TeamImpression 与 MemberImpression 分出口；成员曝光不要求零和；World/Env 仅乘一次 |
| M10 | Expected 开演前冻结；Satisfaction=Actual/Expected；MC/VTR不直接增加 Impression |
| M11 | Fan 输出为 P/O/A/W 动量，不产生 Core；十色/旧lambda/Opp3 **不能通过八色正式验收** |
| M12 | 同场读档重放不重复 EXP、Condition、Impression 或 Fan momentum |

## 10. 下一批需要审阅/锁定的公式

1. 八色 Palette v2.0 的真实权威文件/数据结构与十色迁移校准（最高优先）。
2. Part `Fit`、`AssignmentBurden`、`FormationExecutionFactor`、`PartExposureCoefficient` 的具体曲线。
3. `EnvPalette`（当前八色）随曲目/MC/观众层的动态公式。
4. StaminaMultiplier、NFMultiplier 连续函数；Vocal/Physical 异常风险/恢复概率。
5. Arrangement 更改造成 Familiarity 损失的曲线与排练时间取整。
6. Performance → Fan Market v0.2 的 P/O/A/W 变化与互动反馈（下一份 Fan/Commercial 文档）。

**交付边界**：已锁定的非 Palette 公式可以实现；八色核心表达缺少当前权威时，Agent 应报告 `SOURCE_PENDING`，**不得以旧十色公式假装完成全链路**。
