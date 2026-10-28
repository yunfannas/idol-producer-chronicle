# Chronicle｜Key-Part Assignment & Rotation v0.1

> **2026-10-28 PART OVERRIDE:** [Chronicle Condition / Fatigue / Part Kernel v0.4](Chronicle_Condition_Fatigue_Part_Kernel_v0.4.md) supersedes this file's key-part types and default assignment distribution. All eight sections support optional lead; melo_1/melo_2 default relay, ochi_sabi lead, others unison. Keep this file's eligible 1st/2nd/3rd replacement resolution and no-standing/rotation protections where consistent.


**状态**：Chronicle 专项设计决定（2026-10-24）；用于覆盖 Lab 的站位细节，尚未实现/测试。  
**优先级**：Chronicle 游戏化简化优先于 `idol-data-lab` 03E 的 `StandingExposure` 和 center/front/mid/back 模型；保留 03H 八色 Palette 的实际参演成员平均、Key-Part Contrast 与 Familiarity。参见 [Chronicle Game Design v0.10](Chronicle_Game_Design_v0.10.md) 和 [Eight-Color Palette Kernel v0.2](Chronicle_Eight_Color_Palette_Performance_Kernel_v0.2.md)。

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
