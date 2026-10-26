# Chronicle 序章｜获客、成员 Affinity 与新规赠券：设计决议及独立模拟交接（2026-10-25）

**状态：DESIGN HANDOFF / DIAGNOSTIC FIXTURES / NOT RUNTIME VALIDATED**

本文汇总讨论与独立 Python 夹具的实验结果。**不得将探索性概率、约 300 Otaku 的参考目标、独立脚本结果当作已合并的 Runtime 行为或已通过的端到端回归**。不覆盖 `Chronicle_Fan_Cheki_Executable_Formulas_v1.0.md` 已登记的当前实现参数；经源码审计、测试后才能批准更改集中配置。序章剧情及活动日程以 `../design/Chronicle_Game_Design_v0.10.md` 为准。

## A. 已明确的设计决议（LOCKED 方向）

1. **序章日程基本固定**：不能在序章引入 Live-oriented/SNS-oriented 频度策略来凭空增减 Taiban。Staff 在合同、剧本和已批准日程内自动执行。2013-05-24 出道、2014-01/02 四场试验定期、2014-03-05 起每周三正式定期、毕业特别公演、One-man、2014-08-02 TIF 等沿用 v0.10。2014-07 下旬 One-man 精确日期尚待确定；独立夹具曾临时取 07-26，不可锁死。
2. **SNS、口碑朋友推荐、Taiban 与活动宣传并行贡献认知和主动来场需求**。初次认识本团的 X 观众、已有 Public P、已是本团 Otaku O 三者须在单场去重。其他团 Otaku 从本团视角属于外部 X，不直接算本团 O；观众可从 X→P、X→O，或 P→O。
3. **临时到场动机**：SNS/朋友/过往 Taiban 带来的主动观众、其他团偶然看见本团的偶像观众、普通路人。动机只是 event-local 标记，不新增持久 Cohort、粉丝 ID、Core。主动购票者已经选择来看团体，可有较高的“现场确认转化率”；他团 Otaku 看 Live 再实际使用新规券/参加特典也可转化。首次付费/领券/互动均不能同场重复增加 O。
4. **Public 购票需求而非空位生人**。有效购票需求必须由 P 存量、活动信息有效覆盖、兴趣/口碑与购票意愿决定。空位只截断需求；不自动填满。**购票成功即视为到场**，序章不独立抽 No-show。样例期望公式：`D_P=P_available*r_eventAware*p_buyGivenAware`，受合同、其他已确认持票人和容量约束；事件级实际抽整数。若多种宣传来源重叠先合并；同周多场不能重复把同一 P 转换两次。Public 未转 O 可以之后再次参加。
5. **新规赠券**：提高新客实际尝试成员交流的概率，使用后消耗服务时间/商品成本，但无收费销售额/成员销售分成；必须与旧粉付费需求竞争同一成员队列。是否符合新规取决于合同的首次接触/首次券使用资格，不能无限重复领取；在不持久追踪人时只能采用聚合资格估计并显式标记误差。免费体验后的新 O 必须真正回写周度 O、至少一位初始 A_i，后续正常到场与付费。不能仅记赠券短期损益。
6. **长存 Fan 模型不变**：`P/O/A_i/W_i/U`；`0<=A_i<=O-U`，`sum(A_i)>O` 合法。成员 Affinity 是可产生稳定消费的成员兴趣，不是所有觉得成员不错的人、也不是当场购买人数；A→实际到场→留下→意愿→商品→完成才入账。同一粉丝对多成员可消费，但其排队时间不可复制。交互改善可影响 W，必须按周一次结算。
7. **曝光与转化归因分开**：保留最初认识渠道（SNS/朋友/Taiban/宣传；重叠为估计）、最终转化触点（Live/实际 Cheki/线上）；合并 hazard 只能对确实重叠的受众使用，不能将每渠道增长相加。聚合模型不得声称准确知道某一人的跨场来源。
8. **毕业的归属处理**：莉奈 2014-05-11 毕业后不得继续增加其 A 或参与 Cheki。原有其他兼推者可以保留 O 与其他成员 A；仅失去唯一推的粉丝可能进入 U/流失/转推。测试中的临时 Primary Affinity **仅用于校验**，不是新增 Runtime 持久字段；不可把所有毕业成员主推无条件移入 U。

## B. 数值候选与决策边界（TUNABLE，尚未批准改 Runtime）

| 参数/设计 | 当前讨论采用的**探索性**候选 | 说明 |
|---|---|---|
| Public 知晓本场后的购票意愿 | 中性约 20%，兴趣一般约 10%，强兴趣约 30–40% | 不等于全体 P 每场 20% 到场；考虑有效覆盖/兴趣；购票即到场 |
| 主动到场需求 | 对旧简化基准测试 1.5×、1.65×、2× | 诊断倍率，不是最终隐藏常数 |
| 朋友结伴 | 测试既有 O 到场时 5%/10%/20% 带来新客机会 | 朋友可能属于 P 或 X；从正确来源池分配，不重复增加 |
| 主动购票后的现场确认 | 曾使用 18%、35% 等条件概率 | 必须读 Team Impression / Expected，不能全局一律 35% |
| 其他团观众 X→O | 既有 baseline .004；敏感性曾试 1–3% | 不能直接把所有 X 改成统一高倍率；区分 X_idol / X_general |
| 既有 O 单场额外成员 A 强度 | .03 / **.05 临时候选** / .10 | 必须统一口径，并与 Cheki/W、毕业重叠联合校准；不要覆盖现有实现 |
| 新规商品/成本 | 独立夹具曾用免费约 20 秒+换粉 5 秒、¥180 成本 | 并非真实票券成本；正式合同优先，手续费/服务时长待核 |
| 原有商品 | ¥1,000/¥2,000，示例 20/40 秒，加换粉 5 秒；20% 默认分成 | 前二者为可调商品参数；换粉和默认佣金遵守专项规范 |
| 工作目标 | 2014-07 附近 O≈300 | 只是校准目标、**不是**剧情门槛、硬保底或历史实测 |

## C. 独立实验沿革（夹具结果，只用于找问题）

**注意：各轮参数、事件抽样、毕业处理及 A 定义不完全一致，数值不可拼接成统一一条“已校准”的时间序列。没有任何一轮等同正式 Chronicle E2E。**

| 阶段 | 主要观察 | 结论及局限 |
|---|---|---|
| 固定日程基础敏感性 | 旧低曝光/低转化版本“仅现场”章末 O≈36（含开档 30），而非现场新增36 | 原始简化 X 观看量不足、X→O .004 很低；先审计真实人流 |
| 高意向 + 他团特典 | 加入主动购票确认和新客体验后，某些夹具到 O≈231，外部观看×2 某设定到≈302 | 参数并非实证；可能高估新客、重复券和队列服务 |
| 跨周意向积累 | 某情景章末 O 约 136→157 | 认知/兴趣信号不是新增人口或 Cohort；仍待与真实 Staff 联通 |
| 朋友推荐 | 某情景主动 1.5×+结伴10%，O≈183；加入结伴有增长 | 朋友口碑及现场陪同应同时影响曝光和到场，不是硬发粉 |
| 定期公演 Public 购票 | **废弃**仅按空位额外 4% P 到场使 O≈298 的方案 | 空位不会创造需求，必须用 P×有效知晓×愿买及合同容量 |
| 购票需求模型 | 中性 20% 知晓后愿买场景章末 O≈281；定期新增 P 到场累计≈281人次（夹具） | 120 人场馆是假设；确认率35%等仍是测试参数 |
| 成员 A 多推强度 | 早期夹具 .03/.05/.10 对应 ΣA/O 明显不同，消费敏感 | 不同夹具 A 更新不完全一致，**不能锁死 .05** |
| 新规与经济闭环 | 某修正版 20-seed 有券 O≈304、无券≈272；随后毕业/Primary 校验 100-seed 有券 O≈277、无券≈246 | 结果受毕业 U 与 A 归属假设影响；不得宣称“赠券保证增加30人” |
| 最后一轮毕业核算 | .05 有券测试中 O≈276.6，ΣA≈300.4，U≈16.4，Cheki 累计 gross≈¥82.7万，净留存≈¥49.6万 | **独立夹具**，不含全量 Finance；Primary 核算存在高估 U/毕业损失风险 |

本项目会话中的独立 Python/CSV/JSON 夹具目前未纳入本仓库，且未被正式 Runtime/CI 执行。报告作为问题记录与后续验收计划，不宣称工具已做源码级测试。之前各报告中“100 seeds”均指独立夹具种子数，而非官方 staff B-route 端到端测试。

## D. 推荐实现接口：不改已冻结模型

```ts
type EventAudienceAttribution = {
  liveId: string;
  ownedOtakuWatching: number;
  ownedPublicWatching: number;
  externalIdolWatching: number;
  externalGeneralWatching: number;
  // event-local estimates, disjoint for this live:
  activeIntentPublicWatching: number; // subset of ownedPublicWatching
  referredPublicWatching: number;     // subset, deduped
  referredExternalWatching: number;   // subset of external viewers
  publicDemand: number;
  ticketedPublic: number;             // equals attendedPublic for prologue
  actualUniqueAudience: number;
};
type WeeklyChannelDiagnostics = {
  newPFromExternalLive: number;
  newPFromSNSOrReferral: number;
  newOFromExistingPublic: number;
  newOFromExternalLive: number;
  ofWhichFreeTrialServed: number; // a subset/cause annotation, not extra new O
  newInitialAffinityByMember: Record<string, number>;
  repeatExposureEstimate: number;
};
```

类型为建议接口草案，是否已有同名 Runtime 字段须先 audit。实际事件分源与账本需设置稳定的 `liveId/weekId` 幂等键。对成员 A/W 只通过现有 Fan weekly settlement 更新，不另写第二套系统。新规券实际已服务与购买商品计入同一实际队列、并使用互斥的免费/付费交易明细。

## E. 上线前必须通过的回归清单

1. 固定 S0–TIF B 路线日程，单场仅一份观众池；`N_O+N_P+N_X<=capacity`（合同/容量适用时）；票务购票=到场，缺需求有空位也不能自动有人。
2. P 覆盖、购票意愿、朋友结伴与 Taiban 外部观看均从明确来源生成；一个人接触多个渠道，最终最多转 O 一次。同周多场和 SNS/Live 去重采用显式合并与人口上限。
3. 主动来看本团的 P 与偶然 X_idol、X_general 使用不同的**条件**转化机会；Performance/Impression 只作用于实际参加的观众，不回头重复加 SNS 粉。
4. 免费券资格估计与首次服务 ledger；已完成免费试券不产生 gross/share，却消耗真实成员 slot/耗材；免费/付费共享队列，热门成员拥堵测试和 5 分钟时间片统计。
5. 首次转成 O 的成员归属、现有 O 多推、A_i≤O-U、ΣA>O 合法；在籍已分配 O 必须有至少一位成员 A（若正式模型无法确保需显式标记异常/近似）；相同 seed 重放结果一致。
6. 莉奈毕业：单推、兼推、其他主推三类临时微观样本 vs 聚合估计；不能把所有莉奈主推视为 U；毕业后不得继续获取已毕业成员 A/销售。
7. 有无赠券 100-seed paired comparison，输出完整逐周 `P/O/A_i/W_i/U`、成员免费券已服务、两档实际销售、member share、耗材、现金流，并将区间和方差与均值一起报告。
8. 正式 Chronicle B-route 100-seed 端到端重新执行并与 repo 现有 `reports/staff-baseline/` 对照。**只有此测试能支持新的数值 baseline 决定**。

## F. 仍待决策

- Taiban 各场外部观看者人数/来源、X_idol 与 X_general 比例；真实合同及场馆容量。
- SNS 官方/个人账号历史时期与 Staff 自动周更新的唯一 reach，以及跨周认知/购票兴趣估计（不新增人群库存）。
- 推荐与陪同观众的结构性 overlap，空位与预约优先级。
- 新规券首次资格口径（团体/成员、领取/使用）、加购规则与实际免费商品成本。
- 用微观短期 oracle 校准无持久 cohort 的毕业重叠/U，解决独立诊断夹具间 A 数值不一致。
- 是否更新 `fanChekiBalanceV1` 的参数、评级及序章 B 路线基线：**当前均不得因接近 O≈300 就直接覆盖**。
