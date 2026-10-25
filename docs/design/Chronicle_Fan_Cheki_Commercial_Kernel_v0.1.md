# Chronicle｜Fan Market · Cheki · Commercial Kernel v0.1

**状态**：来源抽取 + 游戏接口合同（2026-10-24）；非可运行代码。  
**权威**：`idol-data-lab/docs/Idol_Fan_Market_Model_v0.2.md`（2026-09-21）；`idol-data-lab/docs/Idol_GPT_03_Game_Design_v0.3.md` 中未冲突的特典会/Weekly Resolution 操作原则；`idol-producer-chronicle/docs/design/Chronicle_Game_Design_v0.10.md` 中序章的双档/佣金/合同。  
**标记**：`LOCKED` 源已确定、`TUNABLE` 需数值回归、`DESIGN_CONTRACT` 为本次接口约束而非 Lab 已给出的公式、`DEPRECATED` 不得再实现。

## 1. 持久市场状态 `LOCKED`

```ts
interface TeamFanState {
  publicCount: number;        // P >= 0
  otakuCount: number;         // O >= 0
  members: Record<MemberId,{
    affinityCount:number;     // A_i >=0, current group Otaku with member preference
    purchaseWeightKJPY:number;// W_i >=0, average 1000-yen equivalent intensity
  }>;
  temporarilyUnassignedOtaku:number; // O_unassigned, only after turnover
}
```

- `P` 是统计意义的轻度认知/消费池，**不是永久身份固定的用户集合**；`O` 是团队活跃偶像消费层。跨团 `O` 允许重叠，世界中 `Σ O_group` 可远大于独立 Otaku 人数。
- `A_i` 是当前 O 中对成员 i 有真实购买意愿的人数；一人可对多成员有 affinity，故 `Σ_i A_i` **可以大于** `O`。每个 `A_i<=O` 是合理的单成员人数边界；成员毕业时必须解除该成员 affinity。
- `W_i` 单位是**千日元等价消费强度**，没有成员级消费上限，也不因为多推自动除以人数。产品价格 ¥1,000=1单位、¥2,000=2单位、¥1,200 CD=1.2单位。
- **废弃**：持久 Core/C_i/C_team、member retention_weight、独立 BoxRate、团队 Otaku 消费上限、单推消费守恒。
- `BoxRate_derived = Σ A_i/O`（O>0）；O=0时定义为 null/不可用（**DESIGN_CONTRACT** 安全约定）。

## 2. 购买能力、需求与实际成交

```text
MemberPurchasePowerKJPY_i = A_i × W_i             [LOCKED]
GroupPurchasePowerKJPY = Σ_i A_i × W_i           [LOCKED]

ExpectedMemberPaidDemandKJPY_i
  ≈ A_i × W_i × EventFactor + PublicTrialKJPY_i [LOCKED 形状/TUNABLE 系数]
```

- `EventFactor` 是本次机会的持续时间、开放 slot、重要性、可达性等条件；**不是**根据团队 Tier 再乘一个 Otaku 购买文化倍率。
- `PublicTrial` 是轻度尝鲜购买，不代表 Public 自动形成持久 member affinity。
- 需求强度 **≠** 实际入账。消费必须依次经过：是否到场/开放→本场产品菜单→购买选择→连续购买限制→排队/时长/成员服务容量→真实成交→成员交流反馈→现金入账。
- `A_i×W_i` 已反映多人支持和重度消费；不再额外叠加“Core张数”、BoxRate 或全团人数 multiplier。
- `EventFactor` 的绝对数值、PublicTrial 的抽样、单价选择/复购/排队放弃等尚**无权威完整数值函数**，Agent 需单列 `TUNABLE` 参数表，不能把旧 v0.6 固定张数冒充真实模拟。

## 3. 逐成员、逐场、逐档 Cheki `LOCKED / DESIGN_CONTRACT`

```ts
type Product = {
  productId:string;
  priceJPY:number;             // 序章至少 1000 / 2000
  interactionSeconds:number;   // product-specific
  variableCostJPY:number;      // product-specific
  maxConsecutive:number|null;
  purchaseLimit:number|null;
};
type MemberEventSales = {
  liveId:string;
  memberId:string;
  productUnits:Record<string,number>;
  grossJPY:number;
  memberShareJPY:number;
  variableCostsJPY:number;
  queueOutcome:unknown;
  fanEngageOutcome:unknown;
};
```

- 原 03 §13 特典会规定：同一粉丝连续用 N 张、每张互动时长 `t` 时，`service_seconds=N×t+5`（**每换一个粉丝额外5秒**）；同一粉丝续买不同档商品时要按商品时长逐项求和，再加5秒。对多人队列重复此公式。
- 普通 festival/taiban 特典会基线 **60min**；Policy 可选不延长、+10min、+20min。真实服务容量以当场成员可用时长、Staff manpower 和产品组合计算，**不能仅用总张数×20秒**。
- 源中“Core 基本必买”的行为属于**已废弃三层 Core 模型**，不得照搬；新模型用 `A_i/W_i` 推导成员需求，购买上限与连买上限仍属 Policy 的产品规则。
- 序章 Cheki 默认成员佣金 `r_i=0.20`（**实收总额**的20%，不是扣耗材后净额的20%）；特殊合同如明确约定可覆盖。按实际售出单位：
```text
Gross_i = Σ_t ActualUnits_i,t × Price_t
MemberShare_i = Gross_i × r_i
VariableCost_i = Σ_t ActualUnits_i,t × UnitVariableCost_t
GroupRetained_i = Gross_i − MemberShare_i − VariableCost_i
GroupChekiRetained = Σ_i GroupRetained_i
```
- 如果产品成本暂设 ¥210/张（**旧假设，非史实**），¥1,000 留存 ¥590、¥2,000 留存 ¥1,390；**不要默认每张 ¥2,000 消耗与 ¥1,000 相同**，真实成本是按商品配置的。
- 不在实际名单、没有合同许可、未开放该产品、服务容量耗尽的成员销量=0。9人中团正常全员出演/全员参与特典会；大团以实际出征和合同为准；出道场全体正式成员可参加特典会。
- 现金账本由 Finance **唯一拥有**：可选“记 gross 收入 + 分成/耗材费用”或“记 net 留存”，但**不能同时**记净收入和再扣分成；每笔按 `liveId/memberId/productId` 幂等。

## 4. 获客、留存与周结算（形状已定，概率未定）

```text
SNS/媒体/外务/直播的外部 reach → P
现场 TeamImpression/MemberImpression + 有效曝光 → P→O、O→A_i
成员 FanEngage（交谈、等待、价格/可达性、持续互动）→ A_i retention、W_i
毕业/换代 → 失去 member-affinity edges → O_unassigned → 再分配或流失
```

- Live 对当场陌生观众的吸引力主要来自 Performance、有效曝光、舞台角色；成员特典会能力与持续互动主要影响 member affinity 的形成/留存和购买强度；这是一条**源文档确定的方向**，不是已有完整概率公式。
- 普通拼盘/联合演出中他团观众是**本团临时 Public**；可能离开、形成持久 P、成为 O 并形成成员 affinity。不能直接把他团 O 计入本团存量；union referral 只是额外临时曝光，不直接加粉。
- 各活动产生事件 momentum，周结算统一消费一次，避免 Live 当天和周末重复增长。Condition、收入与即时反馈仍按事件当日更新；旧 §29 中 `O→Core` 结算步骤必须改为 `O→A_i / W_i`。
- **待定函数**：`P_acquisition(reach)`、`P_to_O(impression,repeatExposure)`、`A_gain(O,memberImpression,interaction)`、`A_churn(interaction,availability,turnover)`、`W_update(price,experience,repeats)`、`P/O_churn`、跨团注意力竞争。不得从旧 Core 模型借常数声称权威。
- 若用统计 aggregate 而非个体级 fan edges 保存 `A_i`，毕业时“仍有其他推的 O 保留”**无法由 `Σ A_i` 精确推导**；须引入可重复的轻量 overlap 近似或显式 affinity cohort/edges，标记模型假设并做多推测试。
- 新成员 seed 由当时 Team Tier、出道曝光决定且较小；毕业后的新人可吸收部分 `O_unassigned`，依据角色/形象/能力/互动 fit，不能瞬间全继承。

## 5. Public / Otaku 市场与活动经济

### 5.1 Public 商业校准 `LOCKED working anchor`

```text
1 Public fan-year ≈ 2 physical CDs + 1 major-live attendance
```

这是**全年总体期望**，不是每个 Public 一定买2张CD或每场都来。全年需求按真实发行和大型 Live 机会分配；不可按每次发行重复发2张/人。普通小拼盘的 Public 到场不能套 major-live 购买锚。

### 5.2 世界市场约束 `TUNABLE anchors`

S6 日本女性地下/Live Idol 市场工作锚：约 **100,000 独立活跃 Otaku** 与 **500,000 广义 Public**；它们不是每团可用的固定可分配库存，也**不能倒灌到2013年序章作为已证实规模**。团体间 O 大量重叠，联合活动和大团虹吸可改变关注/消费分配。

### 5.3 收入渠道唯一性

| 唯一收入拥有者 | 渠道 | Fan 提供 |
|---|---|---|
| Live | 门票、普通 Live Goods | 到场需求、目当预期 |
| Fan / Cheki | 特典会、收费线下/线上互动 | A_i/W_i 和实际成交 |
| Music | CD、Streaming | P/O/A/W 的销售期望，不直接再次入账 |
| External Work | TV/CM/表演/模特等 | 个人认知增量、外务回报 |
| Finance | 以上各渠道的唯一账本 | 不凭市场状态自动记现金 |

序章普通拼盘门票分成：
```text
R_i = R_actual × (0.15/N + 0.25×m_i/M)
```
其中 N 是参演团数，m_i 为本团入场目当、M 为所有团目当之和；M=0 或缺失走合同明确 fallback，不得除零。TIF、One-man、免费商场、公司安排出道按各自合同处理，不能默认普通拼盘公式。

### 5.4 Live 需求

```text
ExpectedAttendance ≈ PublicContribution + OtakuContribution
```

再由重要性、地区/旅行、星期/时间、票价、近期演出密度、竞争活动调整。实际可核到场优先于 Fan 推断；真实演出使用座席/票务/可达性约束，不能拿 fan O 直接当当场动员。

## 6. 与 Brand / Tier 的边界

- Fan 是**隐含市场状态**，不是第四个 Tier 维度。Live/Music/Brand 各自以真实结算和行业事件评分。
- Brand 自然衰减 `rep_next=floor(0.9875×rep)+gains−penalties`；结构性维护由 O/P、Agency/Producer/运营支撑，**精确函数仍 TUNABLE**。
- 成员毕业不直接扣固定 Brand；通过成员 affinity 流失、购买力/到场变化和后续表现间接影响 Brand。
- `P/O` 比例随 Tier 改变：地下 D 往往 P/O<1，C− 以上 Public 重要性增强。不是强制门槛，也不能因为某团D就设P=0。

## 7. 实施用确定性接口（本文件设计建议）

```ts
interface FanKernel {
  accumulateEventMomentum(outcome:LivePerformanceOutcome|MediaOutcome|FanInteractionOutcome):void;
  previewMemberDemand(event:BenefitEvent, memberId:string):MemberDemandDistribution;
  resolveWeeklyFans(weekId:string, seed:string):FanStateDelta;
  applyLineupChange(event:LineupChange, seed:string):FanStateDelta;
}
interface ChekiKernel {
  resolveMemberSales(eventId:string, memberId:string,
    demand:MemberDemandDistribution, menu:Product[],
    availableSeconds:number, seed:string):MemberEventSales;
}
```

以上接口不是 `idol-data-lab` 已发布 API。seed、事件ID、成员ID必须持久化；同一输入重放必须同结果。玩家只能看到合理可观察的排队/成交/成员反馈，不泄露确切 P/O/A/W。

## 8. 最小验收矩阵

| ID | 必须验证 |
|---|---|
| F01 | 只有P/O/A/W持久状态；ΣA_i>O允许；O=0安全处理BoxRate |
| F02 | 两名成员有相同 A_i×W_i 时潜在购买力相同，实际销量仍受产品/slot/到场限制 |
| F03 | ¥2,000=2 KJPY，不计作两张¥1,000商品；佣金按实收20% |
| F04 | 60分钟、5秒换粉 overhead、产品服务时长与排队共同限制逐成员销量 |
| F05 | 成员不参加/无产品/免费商场时收费销量0 |
| F06 | 同一人多推不强制消费守恒；毕业后保留其他 affinity，孤立者短期 unassigned |
| F07 | Live新客受Impression/有效曝光影响；FanEngage主要影响 affinity 留存/W |
| F08 | 跨团临时Public不直接增加持久O；union referral不自动增加owned O |
| F09 | 周 momentum 只结算一次，存档重放不重复产生粉丝或收入 |
| F10 | Finance仅一次计 gross/佣金/成本；CD和门票不由Fan二次入账 |
| F11 | 5/9/15路线成员级销量汇总，**无硬编码人数倍数或销售保底** |
| F12 | 2013年不使用S6市场规模作为历史真实上限；源缺参数明示TUNABLE |

## 9. 需要 Agent 提交的参数校准提案（尚未冻结）

1. P/O/A/W 获客、留存、流失概率与时间步长；
2. A_i/W_i 初始种子、成员毕业 overlap/reassignment；
3. EventFactor、PublicTrial、商品档位偏好、重复购买分布；
4. 实际队列、服务时间、不同产品耗材、工作人员影响；
5. 现场观众结构、拼盘他团曝光、跨团重复转化；
6. Public/ Otaku 票务需求、重复演出密度、价格弹性；
7. 与 Live Satisfaction、FanEngage Satisfaction 的回归连接。

**冻结原则**：这七组属于待实现的模型参数，不能用旧 Core 公式、固定销量或剧情给粉代替。先跑 seeded regression，再对照历史锚和经营可玩性调整。
