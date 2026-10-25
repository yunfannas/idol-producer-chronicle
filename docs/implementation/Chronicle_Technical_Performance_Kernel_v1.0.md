# Chronicle｜Technical Performance Kernel v1.0 — Attribute-Specific Mechanics

**Implementation authority · 2026-10-24**. 此文件补回已经设计的不同技术 Attribute 运算机制，覆盖旧提取文档的笼统 `Fit(WeightedAverage, Difficulty)` 占位符。**不得**将 Vocal/Dance 技术折叠为一个加权 Ability 再减 Difficulty；**不得**采用 `1 + 0.04(Ability−Difficulty)−0.02Burden` 之类新造的统一线性公式。

## 1. 角色、输入与执行时点

每个 song/part 按当前实际担当成员、对应 `PartVocalDifficulty` / `PartDanceDifficulty`、`arrangementVersion`、`Condition`、`vocalCondition`、`physicalCondition`、当曲前成员负担计算。唱跳各自计算技术结果，随后按段落结构合并，并进入八色 Palette 和 Impression Kernel。每首歌后即时更新 Condition；不能整场先结算再一次性扣疲劳。

- 0–20 基础 Attribute 保持独立，`Radar Singing/Dancing`、显示用 `Ability` **不作为技术 Performance 的替代输入**。
- `Breath_eff`、`Rhythm_eff`、`Power_eff` 可被低 Condition 降低；`Pitch`、`Tone`、`Agility`、`StagePresence` 不因普通疲劳直接下降。Vocal/Physical abnormality 的专门扣减与 Condition 不重复。
- `Stamina` 只控制当前和后续歌曲的负荷/疲劳积累；`NaturalFitness` 只控制恢复；二者不增加首曲的原始技术质量。
- 2013–14 普通歌曲的 Vocal/Dance Difficulty≈12 是校准基准，不是每首歌固定值。歌曲/段落实际难度可不同。

## 2. Singing：四个属性的运算机制（LOCKED semantics）

```text
SingingBase = f(
    Breath_eff − PartVocalDifficulty,
    Rhythm_eff − PartVocalDifficulty
)
PitchMargin = Pitch_effective − PitchRequirement
PitchFailurePenalty = CheckFailure(PitchMargin) ? PenaltyForPitchFailure : 0
ToneBonus = PositiveToneBonus(Tone, SongOrArrangementToneRequirement)
SingingRaw = SingingBase − PitchFailurePenalty + ToneBonus
```

| Attribute | 角色 | 正/负向逻辑 | 疲劳 |
|---|---|---|---|
| Breath | 连续 baseline | 与当前 Vocal part 难度差决定唱得是否稳 | 敏感 |
| Rhythm | 连续 baseline | 与当前 Vocal part 难度差决定节奏完成度 | 敏感 |
| Pitch | 失误检定 | 不足时可能失误并扣分；超过要求**不奖励** | 不因普通疲劳直接下降 |
| Tone | 唱腔/质感 bonus | 只提供**正向加成**，不是必须达标的门槛 | 不因普通疲劳直接下降 |

- `ToneBonus` 的系数和方向由**歌曲/编排的具体需求**提供；不能从 `lyric_tone_anchors` 或 Theme 标签机械映射成数值，也不能在 Palette 阶段重复奖励。
- `Power` 永不进入 Singing。
- `sing_together/chorus` 按实际参演成员的 vocal execution 汇总/平均，不能只用最强成员代表全团。
- 旧版 `VocalLeadSlots` +2 额外检定是历史机制；Chronicle 采用 key-part duty。**是否有更难的独唱 part 由 PartVocalDifficulty 表达**，不得创建固定的“主唱加成”。

## 3. Dance：三个属性的运算机制（LOCKED semantics）

```text
DanceBase = g(Rhythm_eff − PartDanceDifficulty)
AgilityMargin = Agility_effective − AgilityRequirement
AgilityFailurePenalty = CheckFailure(AgilityMargin) ? PenaltyForAgilityFailure : 0
PowerBonus = PositivePowerBonus(Power_eff, SongOrArrangementPowerRequirement)
DanceRaw = DanceBase − AgilityFailurePenalty + PowerBonus
```

| Attribute | 角色 | 正/负向逻辑 | 疲劳 |
|---|---|---|---|
| Rhythm | 连续 baseline | 与当前舞蹈难度比较 | 敏感 |
| Agility | 失误检定 | 不足时可能失误并扣分；超过要求**不奖励** | 不因普通疲劳直接下降 |
| Power | 表现力度 bonus | 只提供**正向加成**，依歌曲/编排需求决定 | 敏感 |

- Dance Difficulty 已包含动作复杂度、同步、高速移动与编排复杂度；Chronicle 不增加独立 Formation Difficulty、站位或 Center/Front bonus。
- **不设置固定 Lead Dancer Bonus**；关键舞段的重要性通过 part 自身难度、任务分配和 `PartExposureCoefficient` 体现。
- `Tone` 永不进入 Dance；`PowerBonus` 不从 Theme 或 lyric Tone 推导。

## 4. 失误概率与随机性

`margin = effective_attribute − requirement`。历史 **PROVISIONAL** 失误校准：

| margin | +3 | +2 | +1 | 0 | −1 | −2 | −3 |
|---|---:|---:|---:|---:|---:|---:|---:|
| p(failure) | <0.5% | ≈1% | ≈3% | ≈7% | ≈15% | ≈30% | ≈50% |

- 该表是离散锚，**完整概率曲线、超过边界时的 clamp、失误严重度/扣分大小均尚未冻结**，应实现为版本化 `TUNABLE` 参数，不得假称已有确定的公式。
- `Pitch` 与 `Agility` 检定相互独立；任何 Lead/part 难度均以实际 duty/part 要求为准。
- 随机数按 `saveSeed+liveId+songId+arrangementVersion+partId+memberId+checkType` 稳定生成，读档/重放不重新掷随机数。此 seed key 是 Chronicle 实施契约，不是原历史概率曲线。

## 5. Stage Presence、编排与后续 Palette

```text
VocalExecution = SingingRaw             // no StagePresence applied yet
DanceExecution = DanceRaw
TechnicalExecution = CombineByPartStructure(VocalExecution, DanceExecution)
StageExecution = TechnicalExecution × StagePresenceFactor(StagePresence)
BaseQuality = ApplyActualBurdenAndArrangementStability(StageExecution)
RawPartImpression[L,p] =
    BaseQuality[p] × PaletteExpressionMultiplier[L,p] × PartExposureCoefficient[p]
FinalPartImpression[L,p] =
    RawPartImpression[L,p] × ArrangementExecutionFactor[p]
```

- `StagePresenceFactor` 是最终个人表现的**正向系数**，不是 Pitch/Agility 检定，也不因普通疲劳直接扣减。
- `ArrangementExecutionFactor` 与 `ApplyActualBurdenAndArrangementStability` 不能对同一熟练度损失重复扣分；实施时须明确只在一个位置施加该损失。
- PartExposure 只来自段落重要性与实际 duty；**无** StandingExposure/Center/Front/Back。
- `PaletteExpressionMultiplier` 只由八色 PE 与 Env 的统一审美链进入一次；不作为 Tone/Power 的技术 Bonus。
- `SingingBase f`、`DanceBase g`、`PositiveToneBonus`、`PositivePowerBonus`、`StagePresenceFactor`、`CombineByPartStructure`、`PartExposureCoefficient`、`ArrangementExecutionFactor` 的**精确系数未在本次核实的规范中冻结**。需独立 `TUNABLE` 与校准测试，不得用统一加权 Ability 代替。

## 6. 验收用例

| ID | Case | Expected |
|---|---|---|
| T01 | Pitch 18 vs requirement 12, others fixed | 无额外 Pitch 正向奖励 |
| T02 | Pitch 10 vs requirement 12 | 触发较高失误概率；失败扣分、通过不加分 |
| T03 | Agility 18 vs requirement 12 | 无额外 Agility 正向奖励 |
| T04 | Agility 10 vs requirement 12 | 触发较高失误概率；失败扣分 |
| T05 | Tone 提升、歌曲 ToneFactor >0 | Singing bonus 增加，Dance 不变 |
| T06 | Power 提升、歌曲 PowerFactor >0 | Dance bonus 增加，Singing 不变 |
| T07 | Condition 下降 | Breath/Rhythm/Power 有效值下降；Pitch/Tone/Agility/SP 不直接下降 |
| T08 | Stamina 提升 | 同一首歌首曲技术基准不变；长 set 后段保留更多 Condition |
| T09 | 9人 sing_together | 全部实际参与成员计算，非仅主唱 |
| T10 | Key duty 第一人缺席、第二候补上场 | 第二候补自身技术/排练熟练度，不继承第一人 |
| T11 | 不同阵型/Center标记，其他输入相同 | 技术与 Impression 不因站位变化 |
| T12 | 重新载入同一 Live | Pitch/Agility 检定结果完全相同 |
