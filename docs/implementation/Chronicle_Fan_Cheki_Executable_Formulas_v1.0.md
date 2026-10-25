# Chronicle｜Fan × Cheki Executable Formulas v1.0

**Status: IMPLEMENTATION BASELINE / TUNABLE, 2026-10-24.** 本文件是可运行的第一版数值提案；除引用的既有 `P/O/A_i/W_i`、购买力、Cheki 时长、20%佣金、Policy 权限等规则外，**全部具体概率/系数/分布是新提出的可调参数，不是历史事实或此前冻结公式**。后续必须通过 5/9/15 人、序章周/月模拟校准。此文件优先于 `Chronicle_Fan_Cheki_Finance_v1.0.md` 的同名 `TUNABLE` 空位，不覆盖既有 `LOCKED` 规则。

**当前 Runtime 校准（fan-acquisition-v2）**：在修复合同容量分源与周度 momentum 后，`fanChekiBalanceV1.version` 为 `fanChekiBalanceV1-fan-acquisition-v2`。仅周度自然流失改为下表的 `.004/.0015/.00075`；P/O 转化率、合同、Performance、Finance 和评级阈值保持不变。实跑证据见 `reports/staff-baseline/fan-acquisition-v2/`。

## 0. 核心定义与不可违反的约束

长期仅保存 `P=publicCount`、`O=otakuCount`、逐成员 `A_i=affinityCount`、`W_i=purchaseWeightKJPY`，以及毕业过渡期 `U=temporarilyUnassignedOtaku`。其中 `0≤A_i≤O-U`，允许 `ΣA_i>O`；不保存 `Core`、Fan Cohort、粉丝个体、团际转移、复出轨迹、独立 BoxRate。允许浮点期望状态（持久存档），事件参与和购买采用整数抽样。P 与 O 分开统计，不重复计数。

`W_i` 表示 **对成员 i 有 Affinity 的粉丝，实际到场且特典会开放时，在正常购买机会下的平均购买意愿**，单位 ¥1,000 等价购买额；`A_iW_i` 是长期潜在购买力，**不是**每场实际收入。不同成员的购买意愿不受统一钱包上限约束，但单场观众的排队时间不能重复使用。

**事件顺序**：抽样到场 → Live Impression → Cheki 需求 → 同一观众共享排队时间/真实成交 → 当场财务 → 事件 momentum → 每周只结算一次 P/O/A/W。剧本关闭收费商品时收入恒为0。

## 1. 所有默认参数集中配置（均 TUNABLE）

| 参数 | Taiban/Festival | One-man | 备注 |
|---|---:|---:|---|
| `pOtakuAttendBase` | .12 | .32 | 普通工作日 Taiban 可另乘 .80 |
| `pPublicAttendBase` | .012 | .07 | 是本团既有 P 的到场概率 |
| `pStayChekiOtaku` | .80 | .85 | 到场后留下参加收费特典会 |
| `pStayChekiPublic` | .20 | .25 | Public 和其他团临时观众 |
| `pStayChekiExternal` | .15 | .15 | 外部观众单独可配置 |
| `pPublicTrial` | .012 | .012 | 已留下且非本团 O 的观众，试买一次 |
| `pNewPFromExternalLive` | .08 | .08 | 临时外部观众成为持久 P |
| `pPToOFromLive` | .025 | .025 | 本团 P 本场观看后的 O 转化 |
| `pExternalDirectOFromLive` | .004 | .004 | 临时外部观众直接成为 O |
| `pOFromChekiTrial` | .10 | .10 | 发生实际试买后，独立的增量转化机会 |
| `baseExistingOToAffinityPerShow` | .10 | .10 | **整场** O 产生额外成员 affinity 的总强度，按成员有效曝光份额分配 |
| `baseExtraAffinityForNewO` | .05 | .05 | 新 O 在首推外增加其他 affinity 的**整场**总强度，按成员曝光份额分配 |
| `pWeeklyPChurn` | .004 | .004 | 周度自然衰减；fan-acquisition-v2 |
| `pWeeklyOChurn` | .0015 | .0015 | 已分配 O 的自然流失；fan-acquisition-v2 |
| `pWeeklyAffinityChurn` | .00075 | .00075 | O 留存前提下的成员 affinity 额外流失；fan-acquisition-v2 |
| `pUnassignedWeeklyChurn` | .08 | .08 | 毕业后临时 U 的周流失 |
| `pUnassignedWeeklyReassign` | .04 | .04 | U 在本团存续成员间自然转推 |
| `chekiMinutes` | 60 | 60 | 由合同覆盖；R1/R2/R3 不得越权 |
| `cheki1000Seconds` | 20 | 20 | **暂定商品参数**，非历史事实 |
| `cheki2000Seconds` | 40 | 40 | **暂定商品参数**，非历史事实 |
| `fanChangeOverheadSeconds` | 5 | 5 | 既有 LOCKED |
| `commissionRate` | .20 | .20 | 序章默认 LOCKED；合同可覆盖 |
| `purchaseGammaShape` | 2 | 2 | 每次到场的重度消费右偏分布 |
| `defaultNewAffinityW` | 1.8 | 1.8 | 新建立 affinity 的初始 W，KJPY |
| `queueExtraAbandonScaleMinutes` | 15 | 15 | 超出耐心后放弃曲线的尺度 |

- 活动/剧本可提供 `importanceFactor`、`regionFactor`、`weekdayFactor`、`priceFactor`、`recentShowCount7d`、`externalWatchingAudience`、`mediaUniqueReach`、`repeatExposureFactor`、`ChekiOnlyVisitors`；缺省前四者为1，后四者为0（`repeatExposureFactor` 缺省1）。
- `importanceFactor` 对**到场**与**消费机会**分别给出配置字段 `attendanceImportance` / `purchaseOpportunity`，不能把同一效应无意重复乘入。
- 全部概率在计算前 `clamp(0,1)`；Satisfaction 和 Impression 先转成 `Q=clamp(actualImpression/expectedImpression,0.5,1.5)`，Expected=0 时 Q=1。Q 只作 Fan 转化修正，不重算 Live 结果。成员 `Q_i` 同理，按成员有效曝光与其预期曝光；无曝光则 Q_i=1。

## 2. 到场：一个活动只生成一份观众

```text
freqFactor = exp(-0.12 * recentShowCount7d)
pO = clamp(pOtakuAttendBase[eventType] * attendanceImportance
           * regionFactor * weekdayFactor * priceFactor * freqFactor, 0, .85)
pP = clamp(pPublicAttendBase[eventType] * attendanceImportance
           * regionFactor * weekdayFactor * priceFactor * freqFactor, 0, .60)
N_O = Binomial(round(O), pO)
N_P = Binomial(round(P), pP)
N_X = max(0, externalWatchingAudience)   // contract / other-group watchers, not owned P/O
```

若有场馆/门票容量上限，按真实票务/合同规则限制 `N_O+N_P+N_X`，不得超容量。各来源分别计数；`N_X` 是实际观看本团的临时外部观众，不是拼盘总人头。免费商场、封闭活动、无观众媒体工作由合同替换来源和到场规则。实际记录到场优先于模拟值。

**单场多推的无 Cohort 重建**：对于每个成员 i，抽 `K_i=Hypergeometric(population=round(O), successes=round(A_i), draws=N_O)`，然后从同一批 `N_O` 临时观众 ID 中不放回地均匀选 `K_i` 人，标记其对 i 的 affinity；**各成员独立选取**，所以同一人可同时推多成员。此法逐成员边际与 `A_i/O` 一致，重叠仅为统计估计；不保存这些 ID。少量临时无 affinity 的抽样观众是统计近似误差，不会被持久化为新的 U。

`N_O,N_P,N_X` 是本场 Live 观众；Cheki 只从这批人分别以 `pStayChekiOtaku/Public/External` 抽样留场。只有合同允许独立入场时，才另外加入 `ChekiOnlyVisitors`，且必须带来源类别，不凭空生成本团 O。成员必须实际开放 Cheki 且符合合同。

## 3. 购买意愿：按人、按成员抽样，绝不直接记收入

对每个留下的临时 O 观众 f 与其 affinity 成员 i：

```text
B_fi ~ Gamma(shape=2, scale=W_i/2)  // 单位 KJPY；E[B_fi]=W_i
desiredBudgetJPY_fi = 1000 * B_fi * purchaseOpportunity
```

- `Gamma(k=2,scale=W_i/2)` 可用 `B_fi=-(W_i/2)*ln(U1*U2)`，`U1,U2∈(0,1)`；只要 RNG 固定，结果可重放。W_i=0 则需求为0。
- 同一人对不同成员独立生成 `B_fi`，**没有团队钱包上限**；但只能依次排队。
- 对实际留下的非本团 O（P、X），以 `pTrial=clamp(.012*Q,0,.10)` 抽样 `PublicTrial`。试买者按 `MemberImpression_i` 正权重随机选一名开放成员，初始只申请一件 ¥1,000 商品；若未开放 ¥1,000，则选最便宜的开放商品并遵守合同。**试买不保证实际成交或立即增加 O**。
- 对现有 O 中临时无某成员 affinity 者，可按 `pTrialExistingO=.01*Q_i` 尝试该成员一件 ¥1,000 商品（新参数，TUNABLE）；不能由此直接写入 A_i，须等互动反馈周结算。

**商品选择初版**：对于预算≥¥1,000 的 `B_fi`，从允许商品中迭代选档；当剩余预算≥¥2,000 时，以 `p2000=clamp(.25+.08*(W_i-2),.10,.60)` 选择 ¥2,000，否则选 ¥1,000；选择后扣除实际价格。受 R2 的 `purchaseLimit`、`maxConsecutive` 和 R3 固定菜单约束；预算不足任何商品则不入队。¥2,000 一件算**一件商品/两 KJPY 购买额**，绝不算两张 ¥1,000；互动时间按其独立 `interactionSeconds`。商品迭代应有有限循环保护（按最小商品价格/合同限购上限），但不能凭空施加新的消费金额硬上限。

## 4. Cheki 队列：同一人的时间不能复制

事件时窗 `[0,T]`，默认 `T=3600s`；每成员单独一条 FIFO 队列，`nextAvailable_i` 初始0。每位观众 `availableAt_f` 初始为均匀抽样的入场时间 `Uniform(0,720s)`；单个观众同时最多有一条进行中的队列/服务，服务后才能排下一名成员。

- 粉丝每次在尚有需求的成员中选取 `priority_fi = remainingDesiredSpend_fi / (1 + estimatedWaitMinutes_i/30)` 最高者；同分按 `memberId` 排序。
- 单次可服务的连续商品组由 R2 `maxConsecutive` 和总购买限制截断；若剩余商品需重新排队。服务耗时 `serviceSeconds = Σ_t units_t*interactionSeconds_t + 5`；+5s 仅在换粉时计算，同一粉丝连续商品组不重复加5s。
- 对每个候选队列计算 `start=max(availableAt_f,nextAvailable_i)`、`wait=(start-availableAt_f)/60`。该观众耐心初值（分钟）`tolerance=clamp(10+12*ln(1+desiredBudgetKJPY),10,90)`；PublicTrial 固定10分钟。若 `wait>tolerance`，按 `pAbandon=1-exp(-(wait-tolerance)/15)` 随机放弃这次入队；若放弃可尝试下一位成员，不应重复尝试同一队列形成死循环。
- 仅当 `start+serviceSeconds≤T` 且粉丝未放弃时，预约 `[start,start+serviceSeconds]`，更新 `nextAvailable_i` 与 `availableAt_f`，将实际完成商品计入 `ActualUnits_i,t`；否则本次没有销售。预约必须在全局事件时间顺序执行（例如 min-heap 按 `availableAt_f`，稳定 tie-breaker），避免后来的粉丝插到早已预约的队伍前。
- 如果到场时 `availableAt_f>T`、成员未参加、产品未开放、Staff/合同不给 slot、成员已无法服务，则销量=0。
- 同一观众在同一时间不可同时排两条队；不同成员可以同时服务不同观众。未完成的意愿/超时/放弃必须输出 lostDemand、queueWait 和 buyerCount，供互动反馈使用。

## 5. 互动体验与 W_i 更新

对每位完成服务的购买者 f,i 记录 `engagementScore_fi∈[0,2]`，初版：

```text
engagementScore_fi = clamp(
  1 + 0.04*(memberTalkSkill_i - 10)/10
    + 0.04*(actualInteractionSeconds_fi / expectedInteractionSeconds_fi - 1)
    - 0.20*min(1,waitMinutes_fi/60)
    - 0.15*min(1,memberConditionPenalty_i),
  0,2)
```

`memberTalkSkill` 对接已存在的互动/谈话属性或 FanEngage 计算结果；没有该属性时用10中性，不得新建第18项成员属性。实际/预期互动时长之比可按本章 R1 调整；没有预期时间时比值1。Condition penalty 标准化0–1，来源现有 Condition，不重复降低 Live 技术表现。

对成员 i 汇总：
```text
servedFraction_i = uniqueAffinityBuyersServed_i / max(1,affinityVisitors_i)
queueLostFraction_i = affinityVisitorsAbandoned_i / max(1,affinityVisitors_i)
engagement_i = weightedMean(engagementScore_fi, default=1)
logWDelta_i = clamp(
   .015 * servedFraction_i * (engagement_i-1)
   - .010 * queueLostFraction_i
   - .001 * max(0, weeksSinceLastOpenCheki_i-4),
  -.05,.05)
W_i_next = W_i * exp(logWDelta_i)
```

`W_i` **没有绝对消费上限**；上式仅限制单周变化率。若 A_i 从0增长且 W_i 未初始化，使用 `defaultNewAffinityW=1.8`。当同一周多场活动时先合并真实成交/互动统计，再更新一次 W_i，不能每场重复使用周级倍率。

## 6. 周度 Fan 转化：曝光和购买不重复创造新粉

活动产生 **事件 momentum**，不在活动当日直接修改 P/O/A/W。每个观众在一场活动内至多产生一次 `newO`；Live 与 Cheki 机会合并为：

```text
Q = clamp(TeamImpression/ExpectedImpression, .5, 1.5)
pPToO = clamp(.025*Q*repeatExposureFactor,0,.20)
pXToO = clamp(.004*Q*repeatExposureFactor,0,.10)
pXToP = clamp(.08*Q,0,.30)
pTrialO = .10  // 仅对本场真实完成 Cheki 的非 O 试买者
pOCombined = 1 - (1-pLiveO)*(1-pTrialO_ifCompleted)
```

- 既有 P 观众：以 `pPToO` 计算 P→O；若该人完成首次试买，则使用合并概率 `pOCombined`，**不再单独加一笔 O**。成功时 P−1、O+1。多场活动同周重复曝光时，采用按来源池的合并 hazard `p_week=1−Π_events(1−p_event)` 与可用 P/O 存量上限，而非假装跨场能精确追踪同一人；无持久 Cohort。
- 外部 X 观众：先以 `pXToO`（含试买增量）尝试直接 O；未转 O 者以 `pXToP` 形成持久 P；两种结果互斥。不能先加 P 再又保留 P 同时加 O。
- 新增媒体/SNS `mediaUniqueReach`：`newP_media=Binomial(mediaUniqueReach,clamp(.03*mediaQuality,0,.15))`，但该 reach 必须已排除同一活动 X 观众的重复曝光；否则需按唯一 reach 合并。无独立曝光数据就不凭空加 P。
- 定义 `exposureShare_i=max(0,MemberEffectiveExposure_i)/Σ_j max(0,MemberEffectiveExposure_j)`（分母为0时不发生基于舞台的 affinity 转化）；它是本场**已确定的实际曝光**，不是新造 Center/Standing bonus。对每个新 O，以正曝光份额为权重选**一名**初始 affinity；对其他实际有曝光成员，以 `p=clamp(.05*exposureShare_i*Q_i,0,1)` 生成可选额外 affinity。新 O 因此至少有一名推（无可选成员的特殊活动则转入临时 U，需记录异常）。
- 对原有 O 的非 affinity 成员 i：`newA_i_existing ~ Binomial(eligibleExposedOWithoutAffinity_i, clamp(.10*exposureShare_i*Q_i,0,.12))`；只有实际完成该成员试买的既有 O 可额外叠加一次 `pTrialToAffinity=.15`，按 `1-(1-pLive)(1-pTrial)` 合并。**整场 .10 由成员实际曝光份额分配**，避免成员越多就凭空增加获客概率。多场活动同一周的累计新增 A_i 以本周起始时尚未 affinity 的 O 池为上限，不能因临时 ID 不一致重复增加超过存量。
- 成员亲和增长/流失只作用于 `A_i`；Cheki 收入额、购买张数**不直接**转化成 O 或 A_i。

每周先对 `P` 以 .008 自然衰减；对 `O-U` 以 .003 自然衰减，并按相同比例减少现有 `A_i`；再对存活的 `A_i` 以 .0015 额外自然衰减（队列/互动导致的额外损失通过 `queueLostFraction` 和 `engagement` 影响 W，并可按 `pAffinityBadExperience=.005*queueLostFraction` 加入该成员 A_i 的周流失率）。最后应用本周已去重的 P/O/A 新增，并确保 `A_i≤O-U`；不得因为 `ΣA_i>O` 而缩减多推。所有期望数值允许浮点，只有活动实体采用整数抽样。

**未参与活动者**不因本场 Impression 转化。周度没有活动、没有媒体曝光时，P/O/A 自然缓慢衰减；不自动生成凭空粉丝。

## 7. 毕业、补员与有经验成员加入

**不追踪跨团双向流动、不模拟偶像复出、不存 Cohort。**

毕业成员 i 时，令 `O_assigned=O-U`，采用独立重叠近似：
```text
uniqueLostAffinity_i =
  A_i * product_over_j_ne_i(1 - clamp(A_j/max(1,O_assigned),0,1))
U_next = min(O, U + uniqueLostAffinity_i)
A_i_next = 0
```
它是**统计估计，不是精确粉丝追踪**。同时多名成员毕业须用毕业前全部 `A` 对离队集合计算“离队至少一名且存续成员全无 affinity”的近似，不要按随机顺序多次应用导致差异。每周 `U` 中 .08 流失（同时 O 减少）、.04 可向存续成员按角色/形象/互动 fit 重分配（U 减少，O 不变），余者继续留在 U；剧本可覆盖持续时间与转推比例。

Scenario 触发加入时一次性提供：
```ts
{ incomingNewOtaku:number,
  existingOtakuNewAffinity:number,
  reassignedUnassigned:number,
  initialPurchaseWeightKJPY:number,
  optionalNewPublic:number }
```
`O += incomingNewOtaku`；`A_new += incomingNewOtaku + existingOtakuNewAffinity + reassignedUnassigned`（三项必须去重且不得超过可用人数）；`U -= reassignedUnassigned`；`P += optionalNewPublic`。**本团既有 O 的新推不增加 O**，U 的重分配也不增加 O。普通新人这些数值可很小，有经验偶像由剧情提供合理初始值，不读取原团历史/完整 Tier，也不扣其他团 O。Audition/加入只由 Scenario 发起。

## 8. Finance 唯一入账

```text
Gross_i = Σ_t ActualUnits_i,t × Price_t
MemberShare_i = Gross_i × ContractCommissionRate_i // 序章默认 .20
VariableCosts_i = Σ_t ActualUnits_i,t × UnitVariableCost_t
GroupRetained_i = Gross_i − MemberShare_i − VariableCosts_i
```

仅完成服务的商品可入账。Finance 用 `eventId/memberId/productId` 唯一幂等键记 **gross+share+cost** 或 **net retained** 之一，不能重复。免费商场、禁收费合同、未出征成员收入恒0；门票归 Live、CD 归 Music。既有普通拼盘票务合同公式保持不变。

## 9. 首轮公式自检（不是 Chronicle 端到端模拟）

以普通 Taiban、`O=300,A_i=80,W_i=3`、无额外倍率为例：

```text
E[O attending] = 300*.12 = 36 people
E[i-affinity attending] = 80*.12 = 9.6 people
E[i-affinity staying Cheki] = 9.6*.80 = 7.68 people
E[intended budget before product rounding] = 7.68*3 = 23.04 KJPY
```

这是**排队和商品选择前的期望购买意愿**，不是收入；预算不足一件商品、商品档位舍入、放弃排队、时间容量均可能降低成交。单独用 20,000 次 Gamma+商品选择随机样本作数值烟雾测试（固定种子）：

| W (KJPY) | Mean intended budget | Mean product-request value (KJPY) | P(request≥1 item) |
|---:|---:|---:|---:|
| 1.5 | 1.51 | 1.02 | .62 |
| 2.0 | 2.00 | 1.50 | .73 |
| 3.0 | 3.01 | 2.50 | .85 |
| 5.0 | 5.01 | 4.51 | .94 |

这些结果说明**W 是平均消费意愿，不是保证完成的销售额**；商品最小 ¥1,000 会产生约 ¥500 的离散化差额，排队又会继续减少实际收入。上表是公式级抽样检查，**尚未运行完整游戏的周/月模拟**。

## 10. 必须通过的回归

1. `O=300,A_i=80,pO=.12` → 单场该成员 Affinity 到场期望9.6，**不是80**；Cheki 留场后期望7.68。
2. `W_i=3` → 购买预算抽样均值约3 KJPY；同一人对两名成员可分别购买，不设团队钱包上限。
3. 同一观众买 A 后才可排 B，绝不同时服务；¥2,000商品为一件、按40秒而非两件20秒；每次换粉额外5秒。
4. 队列受60min限制，卖不出的需求不记账；无 Cheki 权限/成员缺席/免费活动收费销售为0。
5. 同场真实试买与 Live 观看至多产生一个 O；新 O 至少有一名初始 A_i；同周多场用合并 hazard/来源池上限近似去重，不声称无 Cohort 可以精确识别跨场同一人。
6. `ΣA_i>O` 合法；A_i 边界、U 边界合法；同 seed 的随机购买、转化、排队、毕业估计完全重放一致。
7. 有经验偶像加入：`incomingNewOtaku=30,existingOtakuNewAffinity=20,reassignedUnassigned=10` → `ΔO=30,ΔA_i=60,ΔU=-10`，不得对本团 O 重复计数。
8. 5/9/15人序章各运行至少12周、20 seeds，记录周 P/O/A/W、Live Attendance、Cheki gross/net、服务容量损失、周现金流、成员毕业/补员边界；**不得**硬编码人数收入倍率或目标 Cheki 保底。
9. 分离 Live 表现与 Cheki：强 Live/弱交流提高新粉但 W 可能不升；弱 Live/强交流可稳住既有 A/W，但不会凭空获得大量新 O。
10. 同一 event 重复结算、存档/载入与周末重放不会重复产生 fan delta 或财务流水。

**版本治理**：所有参数保存在单一 `fanChekiBalanceV1` 配置中；Scenario 只覆写活动条件和有权限的 Policy；记录 `balanceVersion`、`seed`、`eventId`、`weekId`。数值调整先改配置和回归预期，不改长期状态结构。
