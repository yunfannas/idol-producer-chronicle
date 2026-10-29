# Chronicle Technical Performance / Song Appeal / Part Resolution v1.2 — design specification (calibration pending)

> **2026-10-29 OVERRIDE:** [World / Live Palette & Impression v1.0](Chronicle_EnvPalette_Performance_Impression_v1.0.md) is authoritative for **Performance → Public/Otaku Impression**. Old EnvPE in PaletteExpression/Performance and shared Team Part Impression → Member Impression allocation formulas below are historical and overridden where conflicting. Intrinsic Palette `M(FinalPE)` applies within Performance once; World/Live environment only after Performance for Impression. Member Impression uses each member's own Performance and is unaffected by other members' failures. Conservative environment coefficients TUNABLE, runtime unverified.

**日期：** 2026-10-29  
**状态：** 已提交设计规范；数值 `TUNABLE`，**未实施 Runtime、未完成回归校准**。  
**文件路径：** `docs/implementation/Chronicle_Technical_Performance_Curves_v1.2.md`  
**作用：** 集中记录本轮对歌曲吸引力、技术执行、难度、Condition、Pitch/Agility、落ちサビ、连续失误、Part/个人贡献及玩家提示的讨论；给后续校准和实现提供可测试的候选规格。

> **状态标记**：`DESIGN-AGREED` = 交互/语义/结构已讨论确认；`TUNABLE` = 本轮同意“先用”的数值基准，**尚未校准冻结**；`INTEGRATION-PENDING` = 尚需消除跨 Part/Impression 的歧义或旧文档冲突；`EXISTING-LOCKED` = 复用原有 Chronicle 规范。本文件覆盖旧 v1.1 中冲突的技术基线、失误曲线与 Part 结算候选；v1.0 保留独立属性语义，v1.1 中不冲突的参数继续为 TUNABLE。旧文档仍保留供历史追溯。

## 0. 规范依据、优先级与范围

参照 Chronicle 现有：
- `docs/implementation/Chronicle_Technical_Performance_Kernel_v1.0.md` — 17 个基础属性各自运算角色，**雷达和 Overall Ability 不代替技术内核**。
- `docs/implementation/Chronicle_Technical_Performance_Curves_v1.1.md` — 旧数值**候选**，本草案替换其中第 2–3 节基准与失误曲线，但保留未冲突的 Tone/Power/SP/Condition/Familiarity 试验项。
- `docs/implementation/Chronicle_Performance_Palette_Assignment_v1.0.md` — Part→Team/Member Impression、DutyShare、PE、实际担当；该文书的**旧 Palette 色轮/语义已由** `docs/design/Chronicle_Palette_v2.1.md` **覆盖**，不要恢复其旧顺序。
- `docs/design/Chronicle_Condition_Fatigue_Part_Kernel_v0.4.md` — 200s 标准曲、八段 Part、单一 Condition、PF/VF 和次日恢复；Condition 负荷由该专门规范控制。
- `docs/design/Chronicle_Member_Profile_UI_Glossary_v1.0.md` — 五轴/八色双雷达、Ability 百分制、详细属性默认折叠、中日英术语。

**范围外**：不重做 Fan、Cheki、Finance、Palette v2.1 的语义、场馆/站位系统、未校准的 EnvPalette 桥接、真实曲目的 L2B 推断；也不改变内部 `breath`, `power`, `agility`, `teamwork` 字段。

## 1. 基本理念 `DESIGN-AGREED`

1. **Song Appeal 是歌曲本身的表现潜力**，与成员技术执行分开。难度通常提高 Appeal，但同一首高难度歌并不保证高实际表现。
2. **技术水平有绝对表现差异**：在可驾驭的歌曲上，能力 20 的技术执行应约为能力 8 的两倍（不含失误、Palette、状态等）；不能只看 `Ability−Difficulty` 的窄幅差值。
3. **超出个人技术能力才出现明显难度折损**；强者唱/跳 D18 不应仅因难度高就被额外减分，弱者做 D18 明显比 D8 更困难。
4. **Condition 经 Breath/Rhythm/Power 影响当天执行，同时歌曲难度提高体力负荷**；不得再乘一个笼统的全局“高难惩罚”。
5. **Pitch 与 Agility 是独立随机失误检定**，技术基础分和明显失误分开；超出要求不会给这两项额外正向奖励。
6. 关键段落（尤其落ちサビ）靠独立检定、实际担当和固有 Part 曝光体现风险/收益，不凭空加 `VocalDifficulty +2`。
7. 用户仅在选歌/制作阶段看到**歌唱/舞蹈六档匹配**；不提供精确 Performance/Impression projection。Live 前 Staff 使用状态、排练和异常给出风险提示，Live 后报告实际结果。

## 2. 曲目属性及 Song Appeal `DESIGN-AGREED` 结构 / `TUNABLE` 数值

每首歌有独立 `VocalDifficulty`, `DanceDifficulty`，均 0–20。创作时系统生成 `SongAppeal` 0–100；无需直接依赖 L2B/真实曲目数据。当前采用待校准候选：

```text
D = (VocalDifficulty + DanceDifficulty) / 2
SongAppeal_raw = 35 + 65 * (D / 20) ^ 1.4
SongAppeal_UI = round(clamp(SongAppeal_raw, 0, 100))
```

`35` 是曲线截距而非强制最低歌曲分数，也不意味着游戏曲库常有难度 0 的歌曲。约 D8=53、D12=67、D16=83、D18=91、D20=100。例：V18/D16，平均17，Appeal≈87。对于难度生成、综合8约50出头而非50保底的目标，采用此候选，允许校准指数和截距。

**注意**：这是当前基础难度→Appeal 映射。没有讨论并冻结的作曲质量随机性、制作资源、歌曲风格、额外随机增减不能未经批准硬塞进公式。Appeal 是潜力分，绝非实际 Impression 的预测值或百分比完成度。

## 3. Condition 有效属性 `EXISTING` / `TUNABLE`

继续沿用 v1.1 中的技术候选函数，不将 Condition 误认为四项技术属性同时衰退：

```text
ConditionAttrPenalty(C) = 0.06 * clamp(70 - C, 0, 50)
Breath_eff = clamp(Breath - ConditionAttrPenalty(C) - VocalAbnormalityTechPenalty, 0,20)
Rhythm_eff_sing = clamp(Rhythm - ConditionAttrPenalty(C) - VocalAbnormalityTechPenalty,0,20)
Rhythm_eff_dance = clamp(Rhythm - ConditionAttrPenalty(C) - PhysicalAbnormalityTechPenalty,0,20)
Power_eff = clamp(Power - ConditionAttrPenalty(C) - PhysicalAbnormalityTechPenalty,0,20)
```

- C100 / C70：无基础属性损失；C50：−1.2；C30：−2.4；C20 及以下：−3。
- **Pitch / Tone / Agility / Stage Presence 不因一般低 Condition 直接降低**；异常需遵守其匹配类型，不叠加重复的全局扣分。
- 现有异常技术候选：none=0 / mild=0 / moderate=1 / severe=2.5；系数仍需校准。
- Stamina 只改变活动负荷/Condition 耗损；Natural Fitness 控制恢复，不直接加强首曲技术表现。
- **每首歌开始时**读取 C/异常快照，结算该曲技术和 Impression，然后按现有 Condition v0.4 计算该曲耗损并供下一曲使用；同首歌不能再因为计算的曲终 C 重新倒扣本曲技术。

**统一难度契约 `DESIGN-AGREED`：** 一首歌只有 `SongVocalDifficulty` 和 `SongDanceDifficulty` 两个歌曲级难度值；该曲所有 Part 共享对应数值。Part 的 lead/relay/unison、曝光和额外检定次数可以不同，但不修改本曲技术难度。

## 4. 技术连续基线 v1.2 `TUNABLE`，语义 `DESIGN-AGREED`

对每条实际技术输入属性 `A` 和对应 `D`，采用：

```text
AbilityBase(A) = 2 ^ ((A - 12) / 12)
DifficultyPenalty(A, D) = exp(-0.075 * max(0,D-A) ^ 1.15)
Execution(A,D) = AbilityBase(A) * DifficultyPenalty(A,D)

SingingBase = 0.5*Execution(Breath_eff, SongVocalDifficulty)
            + 0.5*Execution(Rhythm_eff_sing, SongVocalDifficulty)
DanceBase = Execution(Rhythm_eff_dance, SongDanceDifficulty)
```

用上述函数**逐项**代入 Breath/Rhythm，不允许先用五轴 Singing、Dancing 或 Overall Ability 作为 A。此形式符合：A≥D 时无难度折损；A20/A8 在同一双方都可驾驭的低难度下呈 2 倍；A8 遇 D18 强烈下滑。

| 单项属性 A \\ Difficulty D | 8 | 12 | 15 | 18 |
| ---: | ---: | ---: | ---: | ---: |
| 8  | .794 | .549 | .393 | .275 |
| 12 | 1.000 | 1.000 | .767 | .555 |
| 16 | 1.260 | 1.260 | 1.260 | 1.067 |
| 20 | 1.587 | 1.587 | 1.587 | 1.587 |

这里的 2 倍仅指 **未发生失误、未加 Tone/Power/SP/Palette 等项的基础技术路径**，不能解释为实际 Impression 或粉丝增长严格翻倍。

## 5. Pitch / Agility 失误概率 v1.2 `TUNABLE`

```text
margin = Pitch - PitchRequirement  // vocal
margin = Agility - AgilityRequirement  // dance
pFail(margin) = 1 / (1 + exp(3.0 + 0.75 * margin))
```

| margin | +3 | +2 | +1 | 0 | −1 | −2 | −3 | −4 |
| ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| pFail | 0.5% | 1.1% | 2.3% | 4.7% | 9.5% | 18.2% | 32.1% | 50.0% |

- Vocal Pitch 和 Dance Agility 按各自责任、需求独立抽样。
- Attr≥requirement 时仍可有低概率失败；“过线不奖励”不等于“永不失误”。
- 上述候选覆盖 v1.1 的 `p≈7%` at margin0、`≈29.6%` at margin−2；旧测试锚须改为新回归期望，**不能同时执行两条概率曲线**。
- **整首歌曲统一难度**：一首歌只有一个 `SongVocalDifficulty` 和一个 `SongDanceDifficulty`，全 Part 共用；不允许按 Part 重定义 Vocal/Dance Difficulty。Pitch/Agility 的检定要求也按歌曲级读取，不存在 Part-specific Requirement。若既有 schema 使用独立的 `PitchRequirement` / `AgilityRequirement`，继续保留其歌曲级字段，不在本次无依据强制令它们等于 D。

### 5.1 检定数量与落ちサビ `DESIGN-AGREED` / integration

- 常规基准：每位实际参加演唱的成员，在一首歌内最多 **一次主要 Pitch 检定**；每位实际跳舞成员最多 **一次主要 Agility 检定**。
- 若成员未唱任何 Part，不抽其主要 Pitch 检定。**先进行每曲主要失误 Bernoulli 抽样；只有实际失败才按对应技术路径的参与秒数权重随机定位到一个实际 Part**。不得先为每 Part 逐一抽失误。其他 key-Part 的额外独立检定要有显式资格规则，不是每 Part 无限制抽一次。
- **落ちサビ `ochi_sabi` 默认 lead，且额外对实际 lead 担当进行一次独立 Pitch 检定**；该检定与歌曲主检定使用**相同的歌曲级 PitchRequirement**，不再默认 `SingingDifficulty +2`。若用户改变该 Part 模式为 relay/unison，额外检定的资格、人数和作用域仍需校准，不能自动将每人无限追加。
- 额外检定与该成员当曲主要 Pitch 检定属于不同 `checkId`，即使两次同样 requirement，也应独立随机结果。
- 其他高风险 key-Part 是否增设额外检定**尚未冻结**；默认不增设，待 Part 负担模拟后确定。

### 5.2 同曲多次失误 `DESIGN-AGREED` 形式 / `TUNABLE` 严重度

在同曲同成员的同一技术路径内累计实际发生的失误次数 `n`，按衰减决定**每次事件在其所属 Part 的局部扣分**：

```text
Penalty(n) = 0.30 * sum(k=0..n-1, 0.8^k)
           = 1.5 * (1 - 0.8^n)
// n=0:0; n=1:.30; n=2:.54; n=3:.732; n=4:.8856
PartPathExecution(m,p) = max(0.20, PartPathBaseWithBonuses(m,p) - sum(localIncrementalPenalties(m,p)))
```

唱与跳各有独立事件序号，不串联；`Penalty(n)` 只是累积严重度的数学表达，**不能直接作为全曲统一扣分**。首失误 -.30、第二增量 -.24、第三增量 -.192；路径有效执行倍率不低于 .20。`0.30`, `0.8`, `.20` 是当前待测候选，不是现实发生率结论。**不要**既在主歌路径扣一次，又在最终 Team/Member Impression 对同一失误后置扣第二次。

### 5.3 所有技术失误一律 Part-local；抽样后按参与秒数定位 `DESIGN-AGREED`

**已确认：先判断本曲是否产生 Pitch / Agility 失误，再随机决定发生在哪个实际参与的 Part；所有失误局部结算，不存在整曲直接扣分。** 以下四项定位与累计规则在本轮已获确认：

1. **按参与时长加权定位**：成功抽到 Pitch 失误时，只在该成员有**实际演唱秒数**的 Parts 之间加权选择；成功抽到 Agility 失误时，只在该成员有**实际舞蹈参与秒数**的 Parts 之间加权选择。各 Part 权重为其对应技术路径实际参与秒数，不使用整曲平均、PartExposure 或是否 key-Part 作为定位权重。`w(member,part,path)=actualSeconds`; `P(part|failure)=w / Σ eligible w`。没有有效参与 Part 时该路径跳过检定，严禁定位到不存在的职责。
2. **允许重复命中**：同一成员、同一首歌、同一路径的不同失败事件可以随机定位到**相同 Part**；不作去重、排斥抽样或强制分散。同一 Part 上各次局部扣分相加，然后执行该 Part 的路径下限 `max(0.20, …)`。
3. **同一路径按全曲实际失败序号递减**：首次 `−0.30`，第二次 `−0.24`，第三次 `−0.192`，第 n 次 `−0.30×0.8^(n−1)`。这里只共享 **ordinal** 以决定当次严重度，不共享/施加任何整曲扣分。Singing 与 Dance 序号相互独立。
4. **落ちサビ可双重命中**：普通 Pitch 失误**也可以**随机定位到实际演唱的 `ochi_sabi`；默认落ちサビ Lead 的专门 Pitch 检定若失败，**固定定位**在 `ochi_sabi`。两次检定相互独立；可以都失败、同时命中落ちサビ并累计局部损失。落ちサビ不默认增加 `VocalDifficulty +2`。

#### 定位例子

一位成员实际在第一主歌演唱 10 秒、第一副歌 30 秒、落ちサビ 20 秒、最后副歌 10 秒（合计 70 秒），则**已确定发生一次普通 Pitch 失误的前提下**，定位概率分别是 `10/70=14.3%`、`30/70=42.9%`、`20/70=28.6%`、`10/70=14.3%`。这不是四个独立失误概率；全曲发生失误概率仍由上游的一次主检定决定。

若本曲主要 Pitch 失败和落ちサビ专门 Pitch 检定均失败，并且普通失误也定位到落ちサび，则两次扣分在**同一落ちサビ Singing 路径**按实际 Part 时间与事件稳定排序累计 `0.30+0.24=0.54`。若普通失误定位第一主歌，则第一主歌 `−0.30`，落ちサビ `−0.24`（按实际 Part 发生顺序），其他 Part 均不扣分。**以上累计仅限本曲该成员对应技术路径**。

#### 不重复结算的实现契约

- Pitch 事件只影响实际演唱者**被定位 Part**的个人 Singing Execution；Agility 事件只影响实际跳舞者**被定位 Part**的个人 Dance Execution。其他 Part、其他成员的技术路径不直接扣分。
- 先对每次检定生成**独立稳定结果**；仅失败时再运行独立稳定的 Part 定位随机流。Part 分配依本曲**实际**任务秒数，先冻结 Lineup/ResolvedDuty/Arrangement；选项和 UI 顺序不影响 RNG。
- 对所有命中的失败事件按所定位 Part 的**歌曲播放时间顺序**排序，若落在同一 Part 则按稳定 `checkId` 排序，再分别给 Singing/Dance 的失败事件编号。不能因代码遍历先处理“普通检定”就默认它必是首错；当普通失败定位在落ちサビ之后时，落ちサ비额外失败可能先获得 `−0.30`。
- 对每个 `(memberId,partId,path)`：`LocalPath = max(0.20, UnfailedLocalPath − Σ[eventIncrementalPenalty])`。同一个 Part 重复命中允许扣到下限，但不从其他 Part 或整曲分数补扣。
- 各 Part 的声乐取**该段实际歌者**局部路径结果，舞蹈取**该段实际舞者**局部路径结果；之后通过一次 PartExposure、DutyShare、Palette 和熟练度链聚合 Team/Member Impression。不可在 SongAppeal、全曲 Impression、MemberImpression 或 Fan 阶段对同一事件二次扣分。对未唱成员不直接施加他人 Pitch 失误。

推荐事件数据（示意，检查概率曲线/Requirement 的数值仍为 `TUNABLE`）：

```ts
type LocalFailureEvent = {
  liveId: string; songId: string; arrangementVersion: string;
  memberId: string; path: "singing" | "dance";
  checkId: string; checkScope: "primary" | "ochi_extra";
  partId: string; // REQUIRED: result of duration-weighted placement or fixed ochi
  ordinalInSongPath: number;
  incrementalPenalty: number;
};
const failures = [];
for (const member of actualSongParticipants) {
  // One primary per eligible path; fail-roll first, duration-weighted placement second.
  for (const path of ["singing", "dance"]) {
    const parts = actualParticipatingParts(member, path);
    if (!parts.length) continue;
    if (seededFail(member, path, "primary")) {
      const partId = seededWeightedPick(parts, p => actualSeconds(member,p,path),
        independentPlacementSeed(member,path,"primary"));
      failures.push({memberId:member.id,path,checkScope:"primary",partId});
    }
  }
  if (isActualDefaultOchiLead(member) && seededFail(member,"singing","ochi_extra")) {
    failures.push({memberId:member.id,path:"singing",checkScope:"ochi_extra",partId:"ochi_sabi"});
  }
}
for (const memberPathEvents of groupByMemberAndPath(failures)) {
  const sorted = sortByPartTimelineThenStableCheckId(memberPathEvents);
  sorted.forEach((event,index) => {
    event.ordinalInSongPath=index+1;
    event.incrementalPenalty=0.30*Math.pow(0.8,index);
    addLocalPenalty(event.memberId,event.partId,event.path,event.incrementalPenalty);
  });
}
// Clamp each local member/part/path once; then aggregate Part -> Team/Member.
```

**已消除的歧义**：Pitch/Agility 主检定在定位前读取歌曲级 Requirement；落ちサビ额外 Pitch 检定读取**同一首歌相同的 PitchRequirement**。随机定位只决定失误发生在哪里，不改变本次检定的难度或概率。**仍待定**：落ちサビ被玩家改成 relay/unison 时，哪些成员需要额外检定。

**DutyShare 待集成**：团队 Part 平均的质量变化与每个成员被归因的个体质量要区分，避免把某成员 Pitch 事故当作未唱成员自身的 Pitch 失误。本规范不添加新的奖励/惩罚乘数。

### 5.4 随机确定性

原 v1.0 seed 契约：`saveSeed/liveId/songId/arrangementVersion/partId/memberId/checkType`。新检定可能同曲同成员同类别多次，需要**显式 `checkId`/`checkIndex` 区分**，否则重复检定会重复取得同一随机数。

推荐稳定键：`saveSeed/liveId/songId/arrangementVersion/memberId/path/checkScope/partId/checkIndex`。每场实际解析成员/Part 后冻结；同一存档、同一安排读档/重放结果严格相同。改版本时需明确随机序列兼容性，不能在无关 UI 操作后重新抽样。

## 6. Tone / Power / Stage Presence / 熟练度 `TUNABLE` 复用

旧 v1.1 中未被本轮取代的候选继续保留：

```text
ToneBonus = min(0.12, 0.012*max(0,Tone-10)*ToneRelevance)
PowerBonus = min(0.12, 0.012*max(0,Power_eff-10)*PowerRelevance)
StagePresenceFactor(SP) = clamp(0.85 + 0.015*SP, 0.85, 1.15)
ArrangementExecutionFactor(F) = 0.65 + 0.35*clamp(F,0,100)/100
```

- ToneBonus 仅 Singing；PowerBonus 仅 Dance；不可从歌词 Palette/theme 机械推出 Relevance。
- StagePresence 倍率乘一次；不能对每个成员算完后又对 Part 总分乘团队平均 SP。
- 旧 v1.1 `SingingRaw = clamp(...,0.4,1.45)` 等上下限**与本轮 A20 基础1.587和路径底线0.20不一致**，拟被 v1.2 替代；**新上限尚未定**。不得保留旧 `max1.45` 截断 A20 的表现，也不能声称已获批准的无上限实现。
- Familiarity 技术执行损失只出现**一次**；Palette key contrast 使用自身既有的熟练度依赖，不作为同一种技术损失重复扣分。

## 7. 各段演唱舞蹈组合、PartExposure、DutyShare

### 7.1 曲长及八段 `EXISTING-LOCKED`

标准 200s：intro15 + outro5（无歌唱、仍舞蹈）+ 必备歌唱段落180s：

| Part | 时长 | 默认模式 | 候选显著性 v1.1 |
| --- | ---: | --- | ---: |
| melo_1 | 25s | relay | .85 |
| sabi_1 | 30s | unison | 1.00 |
| melo_2 | 25s | relay | .85 |
| sabi_2 | 30s | unison | 1.00 |
| c_melo | 20s | unison | 1.10 |
| ochi_sabi | 20s | lead | 1.35 |
| last_sabi | 30s | unison | 1.20 |
| opening_sabi (optional extra) | +20s | unison | 1.10 |

有 opening_sabi 时总舞蹈时长220s、歌唱段时长200s。所有 Part 模式可按编排覆写 `unison/relay/lead`，但不能凭空出现 standing/center/front/formation 数值奖励。

```text
PartExposureCoefficient(p) = (part_seconds / vocal_section_seconds) * salience(p)
// vocal_section_seconds = 180 (standard), 200 (with opening)
```

这是 v1.1 候选，**未归一化成 1** 的重要性系数；是否将 intro/outro 的舞蹈贡献计入对应 Part 另需测试，不能简单因不唱而抹去舞蹈表现。

### 7.2 参加成员与 technical combination `TUNABLE`

```text
SingingRaw(m,p) = SingingBase(m,p) + ToneBonus(m,p) - applicablePitchFailure(m,p)
DanceRaw(m,p) = DanceBase(m,p) + PowerBonus(m,p) - applicableAgilityFailure(m,p)
StageExecution(m,p,when_singing) = StagePresenceFactor(m) *
    (0.5*SingingRaw(m,p) + 0.5*DanceRaw(m,p))
StageExecution(m,p,not_singing) = StagePresenceFactor(m) * DanceRaw(m,p)
```

以上仅为**无重复计算的个人表达形式**；Part Team 结果须分别统计 actual singers 与所有 actual dancers，不能拿 relay 的唱歌子集代替全体跳舞者。`.5/.5` 是技术组合候选。任何 `applicable...Failure` 必须依据 §5 已确定的 **抽样后参与时长加权定位、逐 Part 局部扣分** 结算，最终确保一个错误不会被每 Part 叠加为超出预期的损失。

- **unison**：真实歌唱者平均 VocalExecution；每人获得完整该段歌唱秒数。
- **relay**：只统计实际轮唱者的 VocalExecution；所唱秒数按真实分派，未唱成员仍跳舞。
- **lead**：单一实际 duty holder 获完整该段歌唱秒数；不得将 first/second/third 候补误认为三人同时唱。
- Part 的技术表现与 Palette 由**实际参演者**和**实际 duty**决定，非 roster 中最强者或未上台者。

### 7.3 Impression 出口及防重 `EXISTING-LOCKED` 结构

```text
RawPartImpression[L,p] = BaseQuality[p] * PaletteExpressionMultiplier[L,p]
                        * PartExposureCoefficient[p]
FinalPartImpression[L,p] = RawPartImpression[L,p]
                           * ArrangementExecutionFactor[p]
TeamImpression[L] = sum_p FinalPartImpression[L,p]
MemberImpression[m,L] = sum_p OwnPartContribution[m,L,p]  // MUST NOT use shared damaged team Part total
```

- `DutyShare` 基于该成员实际承担的 solo/relay/unison 演唱和舞蹈份额（实现细节仍需校准），没有站位加成。**个人 Impression 必须取该成员自己的局部技术结果，而不是从包含别人成败的 Team Part Impression 再乘 DutyShare。**
- `PartExposure` 是段落**固有**显著性；**独唱不是另一个随意叠乘的 ExposureBonus**，而由 DutyShare 的实际归属体现。
- 任意 Part 的 Pitch/Agility 失败只改变出错成员该 Part 的对应声乐/舞蹈贡献；Team Part 由各实际参演者对应分量聚合。**其他成员的个人 Impression 不因该失误降低**，无论他们是否参与该 Part 的舞蹈、合唱或其他职责。错误仅进入来源成员个人贡献和团队对应 Part，一次结算，不在 Team/Member 出口额外扣分。
- 与八色 Palette 一体化遵循 Palette v2.1；Env×PE 在旧集成文件中仍是待桥接项，不把 `M(PE)` 和 `M(EnvPE)` 重复相乘。
- `TeamImpression` 与所有成员曝光之和**不必被强行设置为同一数**；若未来引入个人可观察性，应在 DutyShare 合同中明确定义，避免无解释的重复记账。

### 7.4 个人失误隔离不变量 `DESIGN-AGREED`

- For every failure event `(m,p,path)`, holding all other inputs and seeded draws constant: `MemberImpression[j ≠ m]` MUST remain unchanged. A failing member's `OwnPartContribution[m,L,p]` changes only for the affected path in Part `p`; their other Parts do not change.
- `TeamImpression[L,p]` may decrease because the actual participant ensemble quality changes. Do not distribute this reduction back to innocent members through a shared `FinalPartImpression × DutyShare` formula.
- `PaletteExpressionMultiplier[L,p]` may be shared across participants as an aesthetic multiplier; the failure event itself MUST NOT change the Palette multiplier or any other member’s independent execution. Compute individual vocal/dance component quality first, apply the single agreed common Palette/audience/part factors to each person's own credited contribution, then aggregate Team and Member outputs on their defined, non-zero-sum bases.
- Unit test: with A singing solo and B dancing in `ochi_sabi`, one A Pitch failure lowers A and Team's part impression but leaves B's `MemberImpression` exactly unchanged. Repeat for relay and unison where B sings correctly, and for A Agility failure during a shared dance part.

## 8. 难度与 Condition / PF / VF 的长期联动

歌曲难度先提高 Wd/Wv 负荷：

```text
Wd = 2.0 * (T/200) * (DanceDifficulty/12)
Wv_m = 1.9 * (VocalSeconds(m)/120) * (VocalDifficulty/12)
Wbase_m = 0.5 + Wd + Wv_m
A(C) = 0.67 + 0.10 * clamp((70-C)/30, 0, 1)
ConditionCost_m = Wbase_m * StaminaMultiplier_m * A(C_before)
```

该部分**引用** Condition v0.4，不在 Technical v1.2 重写或改变已存在的 Stamina/NF/睡眠/次晨机制。因 Condition 下降，后续歌曲 Breath/Rhythm/Power 下降；C<70 时对应 PF/VF 开始积累，次日可能产生匹配异常；PF/VF 的增长不能再次重复扣除 Condition。

**PF/VF 已勘误**：Condition v0.4a/b 的最新权威系数明确为 **Live 1.00 / Training 0.65**（均乘对应负荷和低 Condition 曝露占比 `q`，异常时另乘匹配的 `AbnormalityAccumMultiplier`）。旧 0.75/0.50 文字已在 Condition v0.4 原文件中修正；不改变 v0.4c 的次晨恢复/异常持续时间。

## 9. 玩家可见评价与中日英术语

### 9.1 Member 面板复用现有 UI Glossary `EXISTING-LOCKED`

- 常驻 Overall Ability(0–100)、五轴 Singing/Dancing/Visual/Fan Engagement/Media Appeal(0–20)、八色独立 Palette Proficiency(0–100)、Condition/Morale/Confidence；17项详细属性默认折叠。
- UI 日语 `Breath=ブレス`, `Power=パワー`, `Agility=身体協調性`, `Teamwork=チームワーク`；代码字段不变。
- Overall Ability 权重 30/30/20/12/8；面板雷达能力**仅供 UI 匹配**，实际技术执行用独立基础属性。

### 9.2 选歌／制作时的六档匹配 `DESIGN-AGREED`

```text
DeltaV = VocalDifficulty - member.SingingRadar   // 0..20
DeltaD = DanceDifficulty - member.DancingRadar  // 0..20
```

| 差值 Δ | 中文匹配 | 日语候选（未审校） | 英文候选（未审校） |
| --- | --- | --- | --- |
| ≤−5 | 简单 | 簡単 | Easy |
| −4..−2 | 较简单 | やや簡単 | Fairly Easy |
| −1..0 | 适中 | 適正 | Appropriate |
| +1 | 较难 | やや難しい | Somewhat Difficult |
| +2..+3 | 难 | 難しい | Difficult |
| ≥+4 | 超难 | 非常に難しい | Extremely Difficult |

Match 不随当日 Condition 跳级；Live 前由 Staff 结合 Condition、Familiarity、异常报告风险，不显示最终 Performance/Impression 投影区间。制作阶段显示确定 Song Appeal 和歌舞难度；Appeal 不是表演保证。

### 9.3 面向玩家的简短说明（建议）

> **能力**决定成员的基本演出水平与技术稳定性；**状态（Condition）**影响当前气息、节奏和动作表现，连续活动会消耗状态；**歌曲难度**同时影响发挥难易和活动负荷；**歌曲吸引力（Appeal）**表示作品的表现潜力，高难度通常有更高潜力，但必须有合适成员和充分排练才能发挥。歌曲制作页展示成员的歌唱/舞蹈难度匹配，不承诺演出分数。

## 10. Staff 自动安排与保护边界

- Staff 默认使用**实际 duty 相关属性**、歌曲/Part 难度、对应 Pitch/Agility requirement、Familiarity、Condition/异常、合法出演资格及候补顺序，判断风险；不得用 Overall Ability 直接替代技术要求。
- 当前建议（仍需校准）`margin>=+1` 风险较低；`0` 可接受；`-1` 警惕；`<=-2` 强烈建议避免关键高风险 duty，自动补救可建议换人/降编排/加排练，**但不可未经许可覆盖玩家指定且合法的第一候补**。
- 一般 Staff 不主动把成员安排到远超过其能力的 Pitch/Agility 职责；应与剧情/合同/医疗硬约束及 `ResolvedDuty` 第一/第二/第三候补保留规则一致。
- 该风险策略是 Staff 候选逻辑，不暗改已经确定的六档 UI 规则。

## 11. 具体回归测试与校准清单

| ID | 验收对象 | 预期 |
| --- | --- | --- |
| TP12-01 | 技术矩阵 A=8/12/16/20 × D=8/12/15/18 | §4 表格允许舍入误差；A20 对 A8 在均能驾驭低难度时为 2 倍 |
| TP12-02 | 同曲 D18、A8 对比 D8、A8 | 高难执行显著降低；A20/D18 无额外难度惩罚 |
| TP12-03 | Appeal D8/12/16/18/20 | UI 分别约53/67/83/91/100；V18/D16 约87 |
| TP12-04 | Pitch/Agility 独立检定 Monte Carlo | m0~4.74%、m−2~18.24%；固定 seed 可重复 |
| TP12-05 | 单错、双错、三错 | 同一路径扣分 .30/.54/.732；路径底线 .20 |
| TP12-06 | Ochi lead | 默认没有 VocalDifficulty+2；主要 Pitch + 独立 Ochi Pitch，两个不同 checkId |
| TP12-07 | 任意 Part 单独失败 | 其他 Part 及无关成员的路径不受直接影响；实际所属 Part 局部结算 |
| TP12-08 | 主要 Pitch 失败但成员不唱某段 | 该段不承受 Pitch 失败；舞蹈贡献仍存在 |
| TP12-09 | 主要 Pitch 与 Ochi 双失败 | 主检定可能定位 Ochi，同段可重复命中并累计 .54；或各扣所属 Part；不得全曲扣 .54 |
| TP12-09a | 主要检定抽样后加权定位 | 10/30/20/10 秒的 Pitch 定位分布约 14.3%/42.9%/28.6%/14.3%；单次主检定总失败率不变 |
| TP12-09b | 重复命中与时间排序 | 同 Part 累计并遵守 .20 下限；若主要失误落在 Ochi 之后，Ochi 专门检定先算首次 −.30 |
| TP12-10 | 同一 live 重放/载入 | 失误事件、当场担当、Impression 结算完全稳定不重复 |
| TP12-11 | Condition C100/70/50/30/20 | Breath/Rhythm/Power 有效差值正确，Pitch/Tone/Agility/SP 不因低 C 直接降级 |
| TP12-12 | 多首歌按曲顺序结算 | 上曲负荷影响下一曲，不追溯影响已完成歌曲 |
| TP12-13 | 未唱的团员参与全曲舞蹈 | 其舞蹈和 Condition 负荷存在，VocalSeconds=0 时无主要 Pitch 检定 |
| TP12-14 | Relay、unison、lead 与替补 | 技术和曝光只归实际成员；Staff 候补按 1/2/3/fallback 解析 |
| TP12-15 | 歌曲制作 UI | 两列六档匹配来自雷达；Overall Ability/Condition 不影响该档，17项默认折叠 |
| TP12-16 | Palette + Part + Familiarity | 单次 Palette 倍率、单次技术熟练度折损；Ochi extra error 不额外扣 Team/Member |
| TP12-17 | Condition PF/VF 版本一致性 | 排查 v0.4 §4/§5 倍率矛盾并核对最新 override；未消除时不能宣称疲劳数值冻结 |
| TP12-18 | 旧曲线兼容 | v1.1 的 B(m)、−.12 失败、旧概率和旧 raw 上限不能无意混入 v1.2 |

## 12. 后续未定事项（禁止假装已冻结）

1. **落ちサび模式覆写**：歌曲和各 Part 使用统一 Vocal/Dance Difficulty、歌曲级 Pitch/Agility Requirement，主检定无需代表性难度；仅落ちサび改 relay/unison 时额外检定的资格和人数待定。
2. **新技术执行上界**：旧 1.45 clamp 不再适配 A20 基础 1.587，需确定是否仅非负下限以及高阶表现上限。
3. **曲目 Appeal 的最终系数** 35 / 65 / 1.4、技术指数和系数、失误严重度、Tone/Power/SP、Familiarity、Part salience，都需跨属性、跨时长回归。
4. **PF/VF 倍率已统一**：Live 1.00 / Training 0.65，按 v0.4a/b 与 v0.4c 执行；后续需校准概率与回归数据，但无倍率定义冲突。
5. **DutyShare 的声乐/舞蹈归属**：现有简化 `MemberImpression=Σ PartImpression×DutyShare` 尚需确保落ちサビ局部事故不会无差别损害未唱成员的个人归属；若需 voice/dance 分量，仍应保持 Team/Member 同一事实源，不另造奖励乘数。
6. **高风险 Part 的额外检定条件**：目前明确只有默认 lead 的落ちサビ加一次；其它 key Part 及覆写成 relay/unison 的行为待定。
7. **Staff 自动分配阈值、提醒文案、Part 曝光参数、EnvPalette 整合**尚未通过大样本校准。

## 13. 提交前检查清单（本轮全部暂不执行）

- [ ] 校正 §12 所述歧义，特别是所有 Part 的局部失败回归和 Condition 原文倍率冲突。
- [ ] 核对 v1.2 和 `Chronicle_Technical_Performance_Kernel_v1.0.md` 的 supersession 说明。
- [ ] 更新 `Chronicle_Performance_Palette_Assignment_v1.0.md` 中旧色轮/旧 Key 说明的明确覆盖指引（不要未经数据迁移直接全量替换）。
- [ ] 更新 Implementation README 读取顺序和验收矩阵的旧曲线、Condition、Part 条目。
- [ ] 跑技术矩阵、蒙特卡洛、多歌曲条件负荷、局部错误和 seeded 回放回归。
- [x] 按用户授权提交本设计 spec；Runtime 实装与数值回归尚待后续。