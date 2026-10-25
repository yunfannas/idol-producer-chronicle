# Chronicle｜Eight-Color Palette · Performance Kernel v0.2

**状态**：从 `idol-data-lab` 2026-10-25 `main@5499e7c5355bc6b360051575e7061f7f516ee9dd` 提取的**已定义公式合同**；尚未在 Chronicle Runtime 实现/跑测试。  
**替代**：`Chronicle_Member_Training_Condition_Performance_Kernel_v0.1.md` 的 §6 `SOURCE_PENDING` 与旧十色示例。其余 Attribute/Condition/Impression 规则仍可参考原文件。  
> **Chronicle 专项覆盖（2026-10-24）**：本文件中关于 Standing/Formation 站位曝光的表述不再适用于 Chronicle；使用 [Key-Part Assignment & Rotation v0.1](Chronicle_Key_Part_Assignment_and_Rotation_v0.1.md)。仅保留实际出演成员、关键段落 duty、第一/第二/第三候补、Staff 自动补位；MemberImpression 不乘 StandingExposure。03H 的 BasePE/Opp3/FinalPE 数学公式不变。

**源文件**：`skills/l2b-song-palette/references/theme-palette-basis.md`、`docs/Idol_GPT_03H_Palette_Performance_v0.1.md`、`docs/Idol_GPT_03C_Member_Palette_Growth_v0.1.md`、`docs/Idol_GPT_03E_Live_Impression_System_v0.1.md`、`docs/Idol_Fan_Market_Model_v0.2.md`。最后一份负责废除旧 Core 观众持久层。

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

## 7. Impression 与 Fan Market 的明确接线

```text
EffectiveAbility + PartDifficulty → BaseQuality_p
SongPalette + actual participant DevelopedPalette → BasePE
KeyPart contrast + FormationFamiliarity → FinalPE
FinalPE → PaletteMultiplier → (Env/audience integration once)
BaseQuality_p × aesthetic expression × PartExposure_p
  × FormationExecution_p → FinalPartImpression_p
→ TeamImpression / MemberImpression (separate)
→ Satisfaction / member exposure
→ Fan Market v0.2 (P, O, A_i, W_i)
```

- 03E 仍包含**已被03H覆盖**的 ordinary part=Team Palette / key part=Member Palette、旧 dramatic relation bonus，不能执行。
- 03E 仍含 `Public/Otaku/Core` 观众层。Fan Market v0.2 已废弃**持久 Core**，需要将 audience response adapter 改成当前 P/O（可有临时偏好分群，但不能建立 persistent Core）。
- 03G 和 portable snapshot 的 `TargetPerformancePalette/lambda` 已由03H显式废弃。
- World Popularity/Saturation、Live Expectation/Saturation、MC恢复属于 Env 机制；03H 未指定把其系数与 PE 的最终数学组合。**不得重复叠加两个 palette bonus**。
- Expected Impression 仍由 TeamTier/SlotType/SetlistLength/VenueSize 开演前冻结，Satisfaction=TeamImpression/Expected。

## 8. 实现验证与数值 Golden Tests

| Test | Input | Expected |
|---|---|---|
| P01 | 全曲 yellow=1；参与者 yellow熟练度45；无key | BasePE=45，FinalPE=45，Multiplier=1.0 |
| P02 | yellow=1；所有参与者 yellow=0；无key | Multiplier=0.4 |
| P03 | yellow=1；所有参与者 yellow=100；无key | Multiplier=2.0 |
| P04 | yellow=1；Key Member Purple=55, Red=75, Pink=55；Ochi Sabi key，F=75 | ContrastFit=0.46153846；KeyBonus=2.76923077 |
| P05 | 与P04相同但 F=0 | KeyBonus=0 |
| P06 | 任何对向色能力≤35 | ContrastFit=0（若全部 Opp3 均≤35） |
| P07 | 六个key part都强对向、F=100 | TotalKeyPartBonus≤12 |
| P08 | Key Solo 位于普通1A | 不产生 contrast bonus |
| P09 | SongPalette sum≈1，MemberPalette 8个槽各0–100；含White/Black的游戏八色输入 | 拒绝或显式迁移，禁止悄悄丢维 |
| P10 | 某曲未出演的成员 Palette 改变 | BasePE/FinalPE不变 |
| P11 | L3 2013-01 cutoff，未来歌曲加入L2B catalog | 2013-01开档方向不变 |
| P12 | 双层 Env+PE 和旧lambda同时接入 | 必须失败（double-count/legacy adapter） |
| P13 | Developed Palette 全部20，SP=12 | PaletteLoad=0.24；Capacity=1.94；r≈0.123711 |
| P14 | 重放同一场Live | PE/Impression/Fan momentum不重复累计 |

P04若 BasePE=45（例：参与成员 yellow均值45），则 FinalPE≈47.76923077，Multiplier≈1.05034965。若实际参与者均值不同，BasePE 仍按其真实八色计算，不强行使用45。

## 9. 待补参数（不阻塞独立 PE 函数）

1. 八色 EnvPalette 的 World/Live 动态和 audience sensitivity；
2. EnvPalette 与 FinalPE 的**唯一**结合点/尺度，避免重复计色；
3. Part技术 Fit、FormationExecution、PartExposure 具体曲线；
4. 八色 L3 Member Palette 的真实人物回归与负载容量重校准；
5. 旧十色存档/历史数据的显式迁移和 version bump；
6. Performance Analyzer 的镜头曝光证据如何校准 `StandingExposure`，不把摄像机偏好直接当成员真实舞台能力。

## 10. 新增研究工具的边界

`idol-data-lab/apps/performance-analyzer` 已在 commit `72fab132a198` 合并：OpenCV shot boundary、镜头焦点启发式、可选 InsightFace closed-set 身份匹配、人工 review、JSON/CSV export、按成员镜头时间汇总。**它测量的是视频摄像机曝光，不是唱歌/舞蹈能力或实际全场观众注意力**；可用于 `StandingExposure` 的一项证据，但需要 source/provenance 和人工审核。它不修改游戏 Runtime。
