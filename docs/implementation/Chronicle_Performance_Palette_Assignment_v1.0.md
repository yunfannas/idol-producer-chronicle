# Chronicle｜Performance、八色 Palette、关键段落与轮换 v1.0

**Chronicle 独立实施规范 · 2026-10-24**。以下所有公式及测试在本仓库内完整给出；无需查阅外部研究文档。旧十色、TargetPalette/lambda、普通 part TeamPalette 与 key part MemberPalette 硬切换、Center/Front/StandingExposure、旧 dramatic bonus **全部禁止**。

**运算次序**：实际 Lineup → Key Duty 第一/第二/第三候补解析 → 当曲有效能力/Condition → Part 技术 Fit → 全体实际参演者八色 BasePE → Key Contrast + Familiarity → EnvPalette **单次**作用于歌曲审美表达 → PaletteMultiplier → PartExposure（段落固有）→ ArrangementExecution → Team/Member Impression → Satisfaction 与 Fan momentum。所有关键段落实际担当必须存档。

**公式状态**：八色、Opp3、Bonus cap、PE→Multiplier 是 `LOCKED`；Env 与 PE 的数值桥接、BaseQuality Fit、PartExposure、ArrangementExecution、AudienceShare、ExpectedImpression 具体参数是 `INTEGRATION_PENDING/TUNABLE`，不得编造为既有已冻结公式。

## 1. 八色语义和类型（`LOCKED`）

三个二元语义轴：
1. Vulnerable ↔ Confident
2. Cute ↔ Cool
3. Witness ↔ Co-action

| Color | Position | Cute/Cool | Audience |
|---|---|---|---|
| yellow | Vulnerable | Cute | Witness |
| pink | Vulnerable | Cute | Co-action |
| aqua | Confident | Cute | Witness |
| orange | Confident | Cute | Co-action |
| blue | Vulnerable | Cool | Witness |
| purple | Vulnerable | Cool | Co-action |
| green | Confident | Cool | Witness |
| red | Confident | Cool | Co-action |

**UI wheel**：`red → pink → orange → aqua → yellow → green → blue → purple → red`。  
**严格对向**：`yellow↔red`、`pink↔green`、`orange↔blue`、`aqua↔purple`。  
White/Black 不属于 gameplay palette，Drama 不是额外颜色；官方 White/Black **成员担当色**不得自动映射为某个八色。

```ts
type Color8 = "red"|"pink"|"orange"|"aqua"|"yellow"|"green"|"blue"|"purple";
type SongPalette = Record<Color8,number>; // nonnegative, normalized sum=1
type DevelopedPalette = Record<Color8,number>; // each 0..100, NOT normalized
```

`SongPalette` 是歌曲本体方向，L2B 由歌词中心论点和三轴推断；不是成员的审美熟练度。团队 catalog direction 是 L2B 的归一化曲库聚合；**Developed Team Palette** 是游戏世界的运行态，二者不能混用。

## 2. L2B → L3 时间边界（`LOCKED`）

```text
L2B song:
Japanese lyrics → central thesis → three axis decisions
  → normalized SongPalette[8]

L2B group catalog direction:
Σ_i SongPalette_i × popularity_local_i / Σ_i popularity_local_i
```

- `popularity_local` 是团内按排名/等级桶得到的相对权重，**不是播放量或跨团销量**；歌曲无 chart rank 时用对应 tier 的 unranked default；无法确定有效 tier 则保持未赋值并报告。
- L2B 全时代曲库聚合**不做 scenario cutoff**；L3 在 2013-01 等开档日**先过滤截止日前已存在/已发行的歌曲**，再重算相同加权方向，作为开档 Team Palette prior。不可让2014歌曲影响2013开档。
- L2B 八色语义锚（非标题硬编码）：Jams `君色花火`→yellow；AKSB `Eternal Blue`、`真夏のセレナーデ`→aqua；iLiFE! `会いにKiTE!`→orange；夜光性 `可惜夜プラネット`→purple。

## 3. Palette Execution：实际参与成员平均（`LOCKED`）

```text
AvgParticipantPalette[c] = average_{i in participatingMembers}(DevelopedPalette[i,c])
BasePE = Σ_{c∈8} SongPalette[c] × AvgParticipantPalette[c]
```

`BasePE∈[0,100]`。**全体实际参与者简单平均**，不是由 solo/center 独占，也不是 Team Palette、Assigned Member Color 或旧 `lambda_target` 计算。

- `participatingMembers` 是**本曲真正参加表演**的成员，不能默认整个签约 roster；无参与者时本曲不应进入有效 Performance 结算（实现防护）。
- 15人路线若某曲只有选拔成员上台，计算这些成员的均值；9人常规全员出演时用9人。
- Part Duty/Standing/Formation 仍通过技术 Fit、Key-Part Contrast 和 MemberImpression 生效，不再将它们用于篡改歌曲 SongPalette。

## 4. Key-Part Contrast（`LOCKED`）

### 4.1 Opp3 八色邻域

对任意原色 c，在色轮上找到其严格对向及对向左右各一个邻居：
```text
Opp3(c) = {left_neighbor(opposite(c)), opposite(c), right_neighbor(opposite(c))}
weights = {0.25, 0.50, 0.25}

Example: Opp3(yellow) = {purple, red, pink}
```

```text
EffectiveOpp(x) = max(0,x−35)/65

ContrastForColor[p,c] =
  0.25×EffectiveOpp(PartPalette_p[opp_left(c)])
+ 0.50×EffectiveOpp(PartPalette_p[opp_center(c)])
+ 0.25×EffectiveOpp(PartPalette_p[opp_right(c)])

ContrastFit[p] = Σ_c SongPalette[c] × ContrastForColor[p,c]
```

`PartPalette_p` 是**关键段实际负责成员**的 Developed Palette；2–3人 relay/unit 先按实际曝光比例加权平均再求 contrast。非 key part **没有**该 bonus。低于35的对向色熟练度不贡献 contrast。`ContrastFit∈[0,1]`。

### 4.2 可触发段落及上限

| Key Part | MaxBonus PE |
|---|---:|
| Opening Sabi（真正以Sabi开场） | +2 |
| 1Sabi key line | +3 |
| 2Sabi key line | +3 |
| Bridge / Cメロ | +5 |
| Ochi Sabi | +8 |
| Last Sabi | +6 |

普通 1A/1B/2A/2B 即使 solo 也**不触发**；不得因为 solo 自动标记 key part。

```text
FamiliarityFactor = FormationFamiliarity/100
KeyPartBonus[p] = MaxBonus[p] × ContrastFit[p] × FamiliarityFactor
TotalKeyPartBonus = min(12, Σ_{p is key} KeyPartBonus[p])
FinalPE = min(100, BasePE + TotalKeyPartBonus)
```

Key-Part 合计**最多+12 PE**，且不奖励同向色第二遍。Formation Familiarity 还在 Part/Formation 执行层影响稳定性；但**不再**使用 `lambda_target/lambda_effective` 修改 Song Palette。

## 5. FinalPE → Impression multiplier（`LOCKED`）

```text
if FinalPE < 45:
  PaletteMultiplier = 0.4 + 0.6 × (FinalPE/45)^1.2
else:
  PaletteMultiplier = 1 + (FinalPE−45)/55
```

| FinalPE | Multiplier |
|---:|---:|
| 0 | 0.40× |
| 20 | ≈0.63× |
| 40 | ≈0.92× |
| 45 | 1.00× |
| 60 | ≈1.27× |
| 70 | ≈1.45× |
| 80 | ≈1.64× |
| 100 | 2.00× |

**不要**在团队 Impression 或粉丝获客阶段再次施加同一个 PaletteMultiplier；不能把 PaletteMultiplier 与旧 `PaletteExpressionMultiplier_L,p` 无条件相乘。如何把单曲 PE 与 Live 的 audience-specific `EnvPalette` 合并为**一次**审美乘数，03H 未给出最终数值桥接函数（`INTEGRATION_PENDING`）。

## 6. Member Palette 成长：八色更新（`LOCKED` 结构）

```text
Load(x) = 0.03×(x/20)^1.7                    if x≤20
Load(x) = 0.03 + ((x−20)/60)^2               if x>20

PaletteLoad = Σ_{c∈8} Load(DevelopedPalette[c])
PaletteCapacity = 0.5 + 0.01×StagePresence^2
r = PaletteLoad / PaletteCapacity

CapacityFactor =
  1−0.15×r^6                    if r≤1
  0.85×exp(−3.8×(r−1))          if r>1

DeltaPalette[c] = Duration×LiveTierRate×VenueFactor×RoleFactor
                  ×LearningFactor(Age,Tenure,Wit)×StatusFactor
                  ×Direction[c]×CapacityFactor
Direction = (1−MemberColorWeight)×TeamPaletteDirection
            + MemberColorWeight×AssignedMemberColorVector
```

`MemberColorWeight`：地偶/live-idol=0.30，纯 major/mainstream=0.20。Stage Presence 决定容量，不决定学习速度；Wit 决定学习速度，不增加容量。停用颜色缓慢衰减、ColorMemory 较慢遗忘、再使用时可恢复。L3 缺乏可靠历史健康/心态证据，StatusFactor=1.00。

**八色后必须重跑历史人物回归**：虽然公式形式未改，求和从10色变8色会改变 LoadRatio；Rana SP15 约0.95、Iori SP20 约1.25 是目标锚而非已验证的新八色测试结果。不要机械迁移 White/Black 历史值或假装旧十色标定仍成立。


## EnvPalette 单次合并边界（明确未冻结数值桥接）

Env 影响**歌曲 Palette 表达**，不是最终 TeamImpression/MemberImpression/Fan 的独立后置倍率。每首歌开演前读取该观众层的 WorldPopularity、WorldSaturation、LiveSaturation/Expectation 并冻结 `EnvPaletteFactor[L,c]`；曲终更新 LiveSaturation，故曲序可以影响下一首歌。MC/VTR/换装仅能影响环境与恢复，不直接加 Impression。

已抽取的逐色结构：

```text
PaletteStrength[L,p] = Σ_c SongPalette[c] × EnvPaletteFactor[L,c] × PerformerPalette[p,c]
```

八色新核心同时锁定 `BasePE` 和 `KeyPartBonus`。两者的**精确数值桥接未冻结**。候选方案（**DESIGN_PROPOSAL，不可默认为 LOCKED**）：

```text
EnvBasePE[L] = Σ_c SongPalette[c] × AvgParticipantPalette[c] × Env[L,c]
EnvContrastFit[L,p] = Σ_c SongPalette[c] × Env[L,c] × ContrastForColor[p,c]
EnvPE[L] = clamp(EnvBasePE[L] +
    min(12, Σ_key MaxBonus[p] × EnvContrastFit[L,p] × FamiliarityFactor), 0,100)
PaletteExpressionMultiplier[L] = M(EnvPE[L])
```

必须先冻结 Env 的中性值/取值边界、按观众层/歌曲的冻结时点、是否作用于 Contrast、PE cap 与测试。**若 Env 未实现，只能将其显式标记为不完整（例如测试环境中 neutral Env=1），不可声称完整 Live Performance 已实现。** Env=1 时新桥接应严格等于八色 `FinalPE`；绝不 `M(FinalPE)×M(EnvPE)`。


## 5. Performance → Impression（结构 `LOCKED`，数值 `TUNABLE`）

### 5.1 单一因果链

```text
CurrentCondition + abnormalities
  → EffectiveAbility by vocal/dance part
  → BaseQuality_p = Fit(EffectiveAbility_p, PartDifficulty_p, AssignmentBurden_p)
  → PaletteExpressionMultiplier_(audience,p)
  → RawPartImpression_(audience,p)
  → ArrangementExecutionFactor_p
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
  RawPartImpression[L,p] × ArrangementExecutionFactor[p]

TeamImpression[L] = Σ_p FinalPartImpression[L,p]
TeamImpression = Σ_L AudienceShare[L] × TeamImpression[L]

MemberImpression[m,L] =
  Σ_p FinalPartImpression[L,p] × DutyShare[m,p]
```

- `PartExposureCoefficient` 是 part 重要度/可记忆度；Chronicle 不存在 StandingExposure/center/front/spotlight 乘数。
- MemberImpression **不要求** Σ成员 = TeamImpression；成员出口不是团队分数的零和拆账。
- 03E 中 L 为当场观众响应层（Public、Otaku，或明确的细分）；持久 Fan State 仅 P/O/A_i/W_i，不持久 Core。层权重 TUNABLE。
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


## 1. 设计决定

1. **不模拟站位**：不保存/编辑 center、front、mid、back、spotlight 站位，不设置任何站位属性、站位曝光加成、位置乘数。UI 无站位图编辑器。成员个人曝光由**实际负责的歌曲 Part / Key Part Assignment** 和该 Part 自身的重要度决定。
2. **保留关键段落 Assignment**：歌曲 arrangement 指定 1Sabi/2Sabi key line、Bridge/Cメロ、Ochi Sabi、Last Sabi、真实存在的 Opening Sabi 等 key parts；普通 part 默认 Staff 编排，不要求玩家逐段操作。Key-Part 类型和 PE bonus 上限沿用八色 03H。
3. **每个关键任务最多三个有序候补**：`first / second / third`，玩家可只指定一部分，也可全部留空；空位由 Staff 自动安排。三位是**同一个 duty 的替补优先序**，不是三人同时上场。
4. **Lineup ≠ Assignment**：Lineup 决定本场/本曲参演者，Assignment 决定这些参演者承担哪些关键段。3–10 人团常规全员出演（9人无常规轮换）；11–18 人团可根据已批准 Policy 选拔/轮换；合同限员、unit、请假/病休仍是例外。**Assignment 不得自动把未入选成员加入 Lineup**。
5. 玩家不指定时，Staff 自动生成并持久化推荐顺序，按实际可用性逐场解析；正常定期公演复用已批准 arrangement，不要求每周确认。玩家显式指定的优先级必须保留，不可被自动评分悄悄覆盖。

## 2. Schema（实施建议）

```ts
type KeyPartType =
  | "opening_sabi" | "sabi_1_key_line" | "sabi_2_key_line"
  | "bridge" | "ochi_sabi" | "last_sabi";

type PriorityAssignment = {
  keyPartId:string; // arrangement-local stable ID
  partType:KeyPartType;
  // all optional; distinct if present; persisted explicit overrides
  firstMemberId?:string;
  secondMemberId?:string;
  thirdMemberId?:string;
  // staff suggestions are stored separately, never overwrite player overrides
  autoCandidates?:string[];
};

type ResolvedDuty = {
  liveId:string; songId:string; arrangementVersion:string; keyPartId:string;
  selectedMemberId:string|null;
  selectedFrom:"first"|"second"|"third"|"staff"|"unfilled";
  reasonCode:string; // eligible, absent, not_in_lineup, medical, contract, etc.
  candidatesConsidered:string[];
};
```

- 若为 duet/unit/relay，**每个需由一人承担的 duty slot** 各自使用上述优先顺序；多人的 `DutyShare` 来自实际承担的 part/relay 时长，不是 standing。
- 同一成员不得重复填在同一 duty 的 first/second/third；允许在不同 key parts 担任第一人选，但 Staff 应考虑负荷和相邻段落冲突。
- `autoCandidates` 是推荐缓存，不是玩家硬锁定；成员/合同/排练状态变化后可重算。历史已演场次保存 `ResolvedDuty`，回放不得按新成员属性重新选人。

## 3. 解析算法（顺序固定）

对每场 Live 的每首歌、每个 key-part duty：

```text
eligible = songParticipants ∩ activeRoster ∩ availableAtLive
           ∩ medicallyCapableOfDuty ∩ contractEligible
for choice in [firstMemberId, secondMemberId, thirdMemberId]:
    if choice exists and choice in eligible and no hard duty conflict:
        return selected(choice, corresponding priority)
staffCandidates = rank(eligible not conflicting, current song/role fit)
if staffCandidates not empty:
    return selected(staffCandidates[0], "staff")
return unfilled with explicit reason / arrange emergency part reduction
```

- 不可出演：不在该曲 Lineup、毕业/停约、日历冲突、未成年/合同限制、医疗状态不允许承担该段，或与同一时间的不可兼任 duty 冲突。
- Condition 偏低但尚可出演，原则上通过 Staff 排名降低优先度；**不能无提示跳过玩家指定的合法第一人选**。只有明确的硬性医疗/合同限制才能使指定候补失效。
- Staff 排名依据当场有效 Vocal/Dance 能力与 part difficulty、歌曲/该 duty 排练熟练度、八色对向 contrast 适配、当前负荷及团队 Policy。具体权重 `TUNABLE`，不可虚构为 Lab 已锁定公式。
- 固定候补均无效或未填时，Staff 选择最合适的**实际参演成员**；若一个也没有，必须产生 `unfilled` 和可观察的 Live/Staff Report，按既有 Live 规则降级/取消该 duty，**不能凭空生成表演或曝光**。
- 预先排练与临场替补必须区别：Staff 选中的第二/第三候补不自动继承第一候补的个人熟练度。换人导致的 arrangement rehearsal cost / execution stability 由真实熟练度模型处理；不新造固定“替补罚分”。
- 如大团轮换导致第一候补不在出征名单，优先使用在名单内的第二/第三候补；**不允许为了某首歌的 assignment 擅自改变整场 lineup**。特殊演出如玩家/Staff 预先获准调整 lineup，则在 Live 前重新解析。

## 4. Chronicle Impression 公式：删除 StandingExposure

保留 Lab 的技术、Palette、Part 重要度和熟练度，但简化个人曝光：

```text
BaseQuality_p = Fit(EffectiveAbility_of_actual_duty_holders,
                    PartDifficulty_p, AssignmentBurden_p)

RawPartImpression[L,p] =
  BaseQuality_p × PaletteExpressionMultiplier[L,p] × PartExposureCoefficient[p]

FinalPartImpression[L,p] =
  RawPartImpression[L,p] × ArrangementExecutionFactor[p]

TeamImpression[L] = Σ_p FinalPartImpression[L,p]

MemberImpression[m,L] =
  Σ_p FinalPartImpression[L,p] × DutyShare[m,p]
```

- `DutyShare[m,p]` 来自实际执行的 solo/relay/unit/chorus 任务及可归属时长，**不读取站位**。普通 chorus 可按实际参加人数平均分配，key solo 由 resolved duty 承担；Unit/relay 按真实责任/时间份额分配。
- `PartExposureCoefficient` 是**段落固有的**显著性（例如 Ochi Sabi 比普通 A 段更容易被记住），不是站位加成，也不因选择特定成员而额外乘奖励。
- `ArrangementExecutionFactor` 是既有 Formation Familiarity / 换人/排练稳定性的实现出口；Chronicle 不计算空间阵型执行或站位差异。不得再使用 `StandingExposure`、`CenterBonus`、`FrontBonus`、`SpotlightBonus` 或同义替代参数。
- Key-Part Contrast 读取 **resolved duty 的真实成员** Developed Palette；全曲 BasePE 仍读取本曲**所有实际参与者**平均 Palette；换人不直接修改 SongPalette 或生成额外 Member Color bonus。
- Team 与 Member Impression 的含义仍然不同；以上简化的 DutyShare 可以让一部分段落按份额拆分，但**不应把全场 TeamImpression 与成员 Impression 必须相等作为跨系统不变量**（成员/团队出口可存在独立可观察性规则）。
- EnvPalette 只在 PaletteExpression 阶段参与歌曲效果，不在最终 Impression/获客后置叠乘；Env 与 03H 的精确结合仍按独立模型冻结。

## 5. 玩家界面与 Staff 行为

- **Song Detail → Key Parts**：每个关键段落显示 `第一人选 / 第二人选 / 第三人选`；空位显示「自动」，旁边可预览 Staff 建议。无需 Center/Formation 图。
- **Live Preview**：展示本场出演名单与主要 key-part 分工；被替换的第一候补显示原因（如「本场轮换未出演 → 第二候补」）。
- **Strategy Meeting**：只在大团决定选拔/轮换原则；普通定期由 Staff 执行。对特定 Live 的名单/段落调整若需玩家批准，使用现有决策机制，不创建每周 Blocking。
- **Training**：新成员接替关键段落或旧成员毕业后，Staff 自动安排必要排练，受 AP、Calendar、Condition 和预算约束。
- **Live Report**：保留实际 key-part 担当、替补原因、排练不足/突发换人等可观察信息；不展示隐藏 Palette/Impression 原始数值。


## 6. 最小验收测试

| ID | Scenario | Expected |
|---|---|---|
| K01 | 指定 1/2/3 均在本曲 Lineup 且合法 | 使用第一候补 |
| K02 | 第一不在 Lineup，第二合法 | 使用第二；不改变 Lineup |
| K03 | 第一、第二不可用，第三合法 | 使用第三 |
| K04 | 玩家全部留空 | Staff 自动选合法参演成员，结果持久化 |
| K05 | 只指定第一但第一缺席 | Staff 自动补足，不中断普通定期 |
| K06 | 三候补全不可用但还有合法参演者 | Staff 自动选择第四人 |
| K07 | 没有任何合法参演者 | unfilled + 明确报告；不生成虚假曝光 |
| K08 | 9人团普通 Live | 全员出演，Assignment 可因伤/毕业调整但不出现常规选拔 |
| K09 | 15人团选拔轮换，第一未入选 | 只能选实际 Lineup 内第二/第三/Staff |
| K10 | 改变 center/front/spotlight 等不存在字段 | Team/Member Impression 不变；schema 拒绝站位加成 |
| K11 | 同曲换 key-part 担当 | BasePE 仍按本曲全体参演者；ContrastFit、DutyShare 读取新担当 |
| K12 | 临时替补未排练 | 读取真实 rehearsal/arrangement stability；不得继承主担当熟练度 |
| K13 | 同一 Live 重放/读档 | ResolvedDuty 一致且 Impression/Fan 只结算一次 |
| K14 | 已指定第一候补能力略低于自动推荐但合法 | 尊重第一候补；Staff 不擅自覆盖 |

**设计边界**：本文件是 Chronicle 专用简化，**不是**对 `idol-data-lab` 的现实演出分析方法作出否定；Performance Analyzer 的 camera exposure 数据也不直接映射成 Chronicle 站位加成。

## 最终执行约束

- 每场都需要最终 Setlist，但常规场次可以自动生成/复用模板；大团轮换时先固定本场 Lineup 再解析歌曲 key duties；重要 Live 需剧本授权的最终确认。
- `PartExposureCoefficient` 只描述段落本身显著性；`DutyShare` 只描述成员实际承担的歌唱/舞蹈任务，不引入任何站位权重。
- 技术 Fit 与八色 Palette 表达只乘一次；ArrangementFamiliarity 可分别约束 Key Bonus 与编排稳定性，但不能在同一环节双扣。
- `ExpectedImpression` 在开演前冻结；取消/零歌曲/无参演成员不得计算无意义满意度或假 Impression。
