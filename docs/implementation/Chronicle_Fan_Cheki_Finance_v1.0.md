# Chronicle｜Fan Market、特典会、Live 合同与财务 v1.0

**独立实施规范 · 2026-10-24**。本文件内包含持久状态、计算式、合同和验收；实现不依赖外部研究仓库。状态：`LOCKED` 表示公式确定，`TUNABLE` 表示需回归参数，`DESIGN_CONTRACT` 表示 Chronicle 接口约束。**不得将尚无函数的概率过程伪装为确定数值**。

## Chronicle 专用规则

- **不使用完整行业 Tier 或跨团排名**：原 `Team Tier` 仅作历史校准描述；新人初始粉丝量与市场响应由章节初始状态、出道曝光及实际演出决定，品牌/行业地位不作为玩家可见评分。
- **仅**持久 P/O/A_i/W_i（以及毕业过渡的 O_unassigned），不持久 Core、C_i、独立 BoxRate；多推允许 ΣA_i>O。
- 普通 Live 和 Cheki 由 Staff 根据**本章固定的 R2/R3**执行；玩家只调整 R1。商品菜单/基础价格/购买上限不可通过日常界面随意更改，除非 Scenario 明确给出一次性事件授权。
- Cheki 的服务时长、真实成交、成员佣金与 Finance ledger 都按 `liveId+memberId+productId` 唯一化；不能把“预期需求”直接入账。
- 以下旧文本如提及 `Policy 可选`，指**剧本或章节已固定的配置可有不同取值**，不是玩家每场都能选择。
- 普通拼盘门票与 Cheki 分开结算；每场只有完成后才能记收入；免费商场演出不得生成任何收费收入。

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
- **Chronicle 决议：不持久化 Cohort 或个体 Fan edges**。每场 Live/特典会按 `P/O/A_i/W_i`、实际到场和固定 seed 临时生成可多推的观众；同一观众的排队时间不可重复使用，但对多名成员的消费需求不强制守恒。活动结束只保存成交、互动反馈、周 momentum 与长期 aggregate；不保留个体。
- 仅用 `A_i` 无法精确求多推重叠：毕业时采用**确定性、可重复的 overlap 统计估计**，保留仍推其他成员的 Otaku；失去全部 affinity 者进入短期 `O_unassigned`。不模拟粉丝跟随毕业偶像去其他团、偶像复出或跨团双向流动；不得声称估计是精确人数。
- **Scenario-scripted 新成员初始化**：普通新人按章节提供小额初始粉丝 seed；有经验偶像由 Scenario 直接给出一次性的 `incomingNewOtaku`（此前非本团 O）与 `existingOtakuNewAffinity`（本团既有 O 的新增偏好），并初始化该成员 `A_i/W_i`。无需追溯前团历史、跨团 fan cohort 或完整行业 Tier。加入时 `ΔO=incomingNewOtaku`，`ΔA_i=incomingNewOtaku+existingOtakuNewAffinity+reassignedUnassigned`（对同一人去重），`ΔP` 只有 Scenario 明示才增加；`existingOtakuNewAffinity` 不增加 O。数值受 `A_i<=O`、`O_unassigned` 实际余额约束。来自原团的初始粉丝只是剧本的一次性输入，不触发原团流失结算。
- 毕业后的新人可吸收部分 `O_unassigned`，依据角色/形象/能力/互动 fit，不能瞬间全继承；吸收是**同一团队内部重分配**，不增加 O。所有 audition/加入机会仅由 Scenario 发起，玩家不可主动开启。

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

## 6. Chronicle 不实现行业 Tier / Brand 评分

- Fan 是**隐含市场状态**；Chronicle 只通过真实动员、收入、活动履历、粉丝和章节成果体现发展，不实现 Live/Music/Brand/Overall 0–10000 分段与跨团行业排名。
- Brand 自然衰减 `rep_next=floor(0.9875×rep)+gains−penalties`；结构性维护由 O/P、Agency/Producer/运营支撑，**精确函数仍 TUNABLE**。
- 成员毕业不直接扣固定 Brand；通过成员 affinity 流失、购买力/到场变化和后续表现间接影响 Brand。
- P/O 结构可随实际曝光、作品传播、活动规模改变；不使用 Tier 标签硬设比例，也不能因起点规模小而设 P=0。

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
| F06 | 单场多推不强制消费守恒、排队时间不可复制；不持久化 Cohort；毕业时 overlap 估计保留其他 affinity，孤立者短期 unassigned |
| F07 | Live新客受Impression/有效曝光影响；FanEngage主要影响 affinity 留存/W |
| F08 | 跨团临时Public不直接增加持久O；union referral不自动增加owned O |
| F09 | 周 momentum 只结算一次，存档重放不重复产生粉丝或收入 |
| F10 | Finance仅一次计 gross/佣金/成本；CD和门票不由Fan二次入账 |
| F11 | 5/9/15路线成员级销量汇总，**无硬编码人数倍数或销售保底** |
| F12 | 2013年不使用S6市场规模作为历史真实上限；源缺参数明示TUNABLE |
| F13 | 有经验偶像的剧本一次性 seed：新来 O 增加 O 和 A_i，本团既有 O 新增偏好只增加 A_i；不得重复计 O；无需跨团流动/复出历史 |

## 9. 需要 Agent 提交的参数校准提案（尚未冻结）

1. P/O/A/W 获客、留存、流失概率与时间步长；
2. A_i/W_i 初始种子、毕业 overlap 近似与剧本新人一次性粉丝导入（无持久 Cohort）；
3. EventFactor、PublicTrial、商品档位偏好、重复购买分布；
4. 实际队列、服务时间、不同产品耗材、工作人员影响；
5. 现场观众结构、拼盘他团曝光、跨团重复转化；
6. Public/ Otaku 票务需求、重复演出密度、价格弹性；
7. 与 Live Satisfaction、FanEngage Satisfaction 的回归连接。

**冻结原则**：这七组属于待实现的模型参数，不能用旧 Core 公式、固定销量或剧情给粉代替。先跑 seeded regression，再对照历史锚和经营可玩性调整。

## 4. 活动合同和 Live 经济

| 活动类型 | 门票/出演费 | Cheki | 曝光/结算 |
|---|---|---|---|
| 普通外部售票拼盘 | 本团分到总实收票房15%等分池+25%目当池 | 合同许可且实际出征者可参加 | 真实观看/Impression、票务、特典会分别结算 |
| 2013-05-24 赤坂BLITZ出道 | **本团门票收入0、场租0**（公司安排特殊合同） | **全体正式成员**均可参加出道特典会 | 舞台按真实出演名单；整场千人级为游戏情景假设，不是历史实数 |
| 学校/企业封闭活动 | 按合同固定出演费、实际费用 | 默认禁止 | 仅受邀现场观众；不模拟开放拼盘路人 |
| 2013-09-29 大宮商场公开免费 Live | **本团所有现金收入0**（无票、出演费、收费Cheki/物贩） | 仅免费交流 | 可增加曝光与潜在转化，不能生成现金 |
| 试验/正式定期公演 | 按自主场次真实票务、成本 | **每场都有**，逐成员结算 | 统一 Live Engine，非剧情发钱 |
| 1st One-man / TIF | 各自合同，**不得默认套用普通拼盘分成** | 依合同许可 | 同一 Live Engine、评论与里程碑，无特制结算器 |

**普通拼盘票房**（游戏暂定，不宣称历史业界真实合同）：

```text
R = 整场实际收取的票款
N = 实际参演团体数
m_i = 本团入场目当人数；M = 所有参演团体入场目当总人数
本团门票收入 = R × (0.15 / N + 0.25 × m_i / M)
```

- 余下 60% 不属于参演团体，不在本团账本再次扣除；`m_i` 是购票/入场时登记目当，不是团体粉丝存量或实际观看人数。
- `M=0` 或数据缺失时不得除零、不得擅自将25%等分；需合同回退条款或明确标记该部分未结算。
- **玩家 Live Report 只显示本团最终“门票收入”**，不展示票房池、公式、他团目当和他团收入；内部审计 ledger 可保留各字段。
- 只对**实际完成**的场次结算；无合同的机会不能变成收入。封闭活动目前从经济回归模拟中剔除，不能作为自动现金补贴。

## 5. Fan / Cheki / Finance 的复用接口（不要重写已有模型）

### 5.1 Fan（按 Fan Market v0.2 实现于 Chronicle）

- 持久团队状态：`P=public_count`、`O=otaku_count`；成员级 `A_i=affinity_count`、`W_i=purchase_weight_kjpy`，多推重叠允许 `ΣA_i > O`；`BoxRate=ΣA_i/O` 是派生值。毕业后可有短期 `O_unassigned`，**不得持久存储 Core、C_i、独立 BoxRate**。
- Live Performance + 有效曝光对**P→O、新增成员 affinity**作用较大；特典会交流、可接触性和持续互动对**A_i 留存/形成及 W_i 变化**作用更大。场次记录 momentum，周结算持久 fan state；不可按5/9/15人数另乘获客系数，也不可把 Cheki 一次购买当新增独立 Core。
- 2014-07 左右**`O≈300`** 是将旧“Otaku+Core 300”迁移后的**待重新校准工作目标**，不能将旧 Core 再加到 O 上，亦非剧情硬门槛或历史实测值。团体 O、成员 affinity、购票目当、现场到场、Cheki 买家和销售张数不是同一个量。完整公式/缺口见 Simulation Model Extraction §3。

### 5.2 Cheki（父系统已有逐成员统计）

- **每场、每成员、每价格档**独立统计 `units_1000` / `units_2000`、成交金额、成员分成、其他变动成本、实际使用 slot / 排队及互动反馈；不同档可占用不同服务时间。最终按实际成员和场次汇总团体收入，不允许先猜一个全团 Cheki 总量再按人数分配。
- 默认成员分成 `20% × 该成员该档实收销售额`，其他变动成本按各档配置；团体留存 `Σ units_tier × (price_tier × 0.8 − variable_cost_tier)`。如有非默认成员合同，按实际合同分成替换20%。
- 旧版 **¥490/张** 是“¥1,000、30%分成、假定¥210其他成本”的旧示例；**不得**继续作为默认净留存。若¥210两档均成立（仅敏感性假设），¥1,000档留存¥590、¥2,000档留存¥1,390；¥2,000占30%时平均¥830。真实销售档比和成本需由已有成员级消费/容量模型产出。
- 新增成员通常有**正的长期边际经济贡献**，但不是每人每月保底。边际贡献由她**真实新增**的 Cheki 留存、目当分成和其他收入减去真实增量工资/服装/训练/出征成本；不可重复归因已有团体收入。9人团没有轮换折损；大团按实际选拔出征影响曝光/slot。

### 5.3 Finance

- 初始资金 Easy ¥5m / Normal ¥3m / Hard ¥1.8m；正常现金流由实际合同、逐成员 Cheki、票务、费用产生；无 CD、额外物贩、YouTube 广告收入自动补贴。
- 原有贷款额度/利率、财务三表、歌曲/服装资产 ledger 和成员市场价值非公司资产等规则沿用 v0.9 §18。**现金、营业收入、成本、资产资本化、借款流入分开**，不能把贷款算营业收入，不能将已扣净留存的成员分成/耗材再次记费用。
- 5/9/15 人路线不硬编码利润顺序。旧 v0.6 情景中5人期末现金¥192.5万、9人¥172.6万、15人¥190.1万，是基于全¥1,000档和临时人数乘数的**已过时敏感性结果**；不得用作 Runtime 的 expected snapshot 或回归硬断言。


## 账本与存档不变量

```text
completedLive
  → immutable performanceOutcome / audienceAttendance
  → ticketRevenue (Live owner)
  → per-member per-product actualChekiSales (Cheki owner)
  → financeLedger (single owner, idempotency key)
  → weekly fanMomentum resolution (exactly once)
  → monthly observable progression / reports
```

- `Cheki` 结算可以采用 gross+share+cost 或 net-retained 记账之一，禁止两套同时记；贷款入账是 financing，不是营业收入；制作/服装资产与费用不可重复。
- 2013-05-24 公司安排出道：本团门票收入和场租都为0；所有正式成员可参与出道 Cheki；舞台实际出演名单单独记录。
- 2013-09-29 免费商场 Live：门票/出演费/收费特典会/收费物贩均为0。
- 2014 试验/常规定期与 One-man/TIF 分别读取真实 Scenario 合同，不套普通拼盘分成。
- 5/9/15 人规模没有任何额外固定收入倍率；收入只能来自真实成员、场次、商品、排队和市场状态。

## 实施状态

已锁定：P/O/A/W 状态语义、购买力、20% 默认 Cheki 分成、两档、5 秒换粉 overhead、60min 基线、普通拼盘分账、现金唯一性。

待校准：P→O/O→A/W 更新、重叠、EventFactor、PublicTrial、排队放弃、票房到场概率、其他成本、市场竞争。待校准项不得使用旧 Core 模型或固定销量作为“最终实现”。
