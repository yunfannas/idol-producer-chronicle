# Chronicle｜成员、训练、Condition 与 Staff 公式 v1.0

> **2026-10-29 ATTRIBUTE EXP OVERRIDE:** [Attribute Growth · Difficulty & Duty v1.1](../design/Chronicle_Attribute_Growth_Difficulty_Duty_v1.1.md) supersedes §2's difficulty-neutral EXP allocation. High attributes require sufficiently challenging work to grow efficiently; adequate qualified low-difficulty work maintains skills; routine/focused training inherits member-specific repertoire difficulty. Preserve §2's other base factors and ±100 thresholds. New numerical challenge/maintenance constants are TUNABLE and not yet implemented.

> **2026-10-28 override:** [Condition / Fatigue / Part v0.4c](../design/Chronicle_Condition_Fatigue_Part_Kernel_v0.4.md) supersedes this file's FatigueDebt-only/no-PF/VF state, old song Condition cost, abnormality risk, and immediate recovery timing. Actual Condition/PF/VF **daily recovery** at next morning; 4/12/28 qualified days for anomaly resolution (NF14, 8h normal sleep). Keep compatible sleep/NF formula, growth and training scheduling. Do not apply rest credits twice.


**实施级本地规范 · 2026-10-24**。不需要打开外部研究仓库。数值状态：`LOCKED` 已确定；`TUNABLE` 公式形状确定但系数未冻结。**未标 LOCKED 的数值不得当作权威默认值**。

## 实施覆盖与排除

- 17 项 Attribute（0–20）、8 核心 Attribute EXP、Morale/Confidence、单一 Condition、Vocal/Physical 异常；**不使用持久 PhysicalFatigue/VocalFatigue 或隐藏 WorkRate 等属性**。
- Chronicle **不模拟站位**；下文历史术语 `Arrangement Familiarity` 即“歌曲版本与关键段落的排练熟练度”，不是位置/center/front 加成。临时替补读取实际担当的熟练度，不继承第一候补的个人准备。
- `TeamTierFactor` 为源公式的历史名称：Chronicle 用 `TrainingEnvironmentFactor`（Scenario 隐藏参数，`TUNABLE`）替代；原 E–S 倍率表只供校准，不要求计算或显示 Tier。
- Training intensity 属于章节已确定的 R2/R3 运营配置，**不是**玩家每周可更改的自由 Policy。玩家可通过剧本授权的开局决策设定一次；Staff 按章节配置自动执行。
- 本文件包含已抽取的确定公式；`StaminaMultiplier`、`NFMultiplier` 完整插值、异常风险系数、BaseQuality Fit 曲线未锁定，统一见实施入口的缺口表。

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
  × TrainingEnvironmentFactor × CurrentLevelFactor_a × AbnormalityFactor_a

WitFactor = clamp(1 + 0.035 × (Wit−12), 0.75, 1.30)
AgeFactor = clamp(1.15 − 0.025 × (Age−18), 0.65, 1.15)
TenureFactor = 1.15 / (1 + 0.05 × TenureYears)
CurrentLevelFactor_a = 1 − 0.02 × max(0, Attribute_a−10)
AttributeDifficulty_a = 0.8 if a∈{tone,agility}, else 1.0
```

**历史校准锚（非 Chronicle Tier 表）**：原 E=.94、D=1.00、C=1.06、B=1.12、A=1.18、S=1.24。Chronicle 仅从 Scenario 读取 `TrainingEnvironmentFactor`，无跨团评级、无 +/- 插值要求；具体章值 `TUNABLE`。

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

## 3. Arrangement Familiarity 与自动训练 `LOCKED`

每个 arrangement/version 持久化 `F∈[0,100]`，不是歌曲本体唯一全局熟练度；换编排须记录 version 和熟练度损失。

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
| Vocal Lesson、Arrangement-only | 2.0 |
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
- Physical mild 不额外罚编排；moderate/severe 限制动作，替位/座椅导致 Arrangement 执行损失。不能把异常当第二个连续疲劳条。
- `Morale` / `Confidence` 均0–100，Live/事件即时更新，Policy/Role 长期漂移。长期成长 `StatusFactor=HealthContinuityFactor×MoraleFactor×ConfidenceFactor`，通常≈1.0，0.85–1.10是建议校准区间，不是固定 clamp。
- Weekly Status Report 汇总时间加权平均 Condition、最低 Condition、异常变化和 Morale/Confidence；**不得重新建立 Weekly Physical/Vocal Fatigue**。


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


## Chronicle 强制测试

1. 17 属性整数边界 0–20；8 核心 EXP 触发 ±100 后归零、不保留溢出；不得使用 Ability 直接计算演出。
2. Attr15 周衰减 3.5 EXP；Wit12 因子1；Age18 因子1.15；Tone/Agility 难度0.8。
3. 熟练度维护先抵扣 decay；上周演出减半 decay；同一排练时段不可重复计 EXP。
4. Condition 一条 0–100 状态；每曲实时扣除、恢复不重叠；疲劳风险每天早晨一次。
5. 9 人普通 Live 全员可参与，15 人按章节固定选拔策略；实际成员名单决定消耗与获得 EXP。
6. Staff AP、并行日程和临时工限制在超载时必须明确产生 conflict / proposal，不可凭空免费增加 Manager 并行能力。
