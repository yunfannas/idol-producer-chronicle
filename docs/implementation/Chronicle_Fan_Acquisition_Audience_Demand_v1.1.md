# Chronicle｜SNS Acquisition × Audience Demand × Conversion v1.1


> **2026-10-26 覆盖：** [Chronicle_Fan_Reputation_Integrated_Spec_v1.0.md](Chronicle_Fan_Reputation_Integrated_Spec_v1.0.md) 优先于本文的冲突部分。Team Live Trigger 新 O 可以不分配 A；X 未当场成为 O 的新观众进入每周 P 曝光池而非现场直接 X→P；Taiban 和 Free Live 用新 Reputation 入口；普通/赠券 Cheki 采用分源参与、真实服务和 A/W 外溢规则。本文旧 8、5 节相冲突语句作为历史候选，不再是 LOCKED。

**Status: AUTHORITATIVE DESIGN CONTRACT / 2026-10-25.** 本文件是序章及后续章节 Fan 获客机制的正式实施规格，**优先于** `Chronicle_Fan_Cheki_Executable_Formulas_v1.0.md` 关于 Public 到场、外部观众生成、SNS 获客、Live 转粉、赠券转粉的旧算法/旧默认解释；v1.0 在本文件没有替代的 Cheki 购买、队列、Finance、churn 和毕业基础约束仍有效。**本文件不把任何模拟概率宣称为现实定值；C0–C3 已接入 Runtime 并完成正式 paired 100-seed 复测，C4/C5 仍待场次授权与路线扩展。**

## 1. 已确定的设计原则（LOCKED）

1. 持久粉丝状态不变：`P/O/A_i/W_i/U`，P/O不重叠；不新增持久 Core、fan ID、cohort、Primary。
2. **线上获得 Public 是独立、常规、持续的增长来源**。2013–2014 章按历史可用渠道：官方 Twitter、成员个人 Twitter、YouTube（MV/Live/宣传片）、官方/个人 Blog；不要把后世 TikTok/短视频算法增长回填进 2013 年。内容发布由 Staff 自动周调度，玩家不逐条微操。
3. **三层严格区分：平台观看/曝光 → 有效独立接触 → X→P**。观看次数、账号 follower、唯一 reach、P/O 人数不是一回事；不以所有观看数乘固定百分比直接发 P。
4. 对已有 P，SNS 和过往 Live、好友分享累积**活动知晓与积极观看意愿**，可影响后续购票；同一曝光不能同时发新 P 和再次作为新接触者。认知历史仅允许团队级短期滚动信号/聚合估计，不能另立潜在粉丝池。
5. **Public 购票即视为到场**。需求基于已有 P、有效活动知晓、意愿、价格、档期、口碑；场馆空位不创造需求；不额外抽 no-show。团体 O、既有 P、外部 X 是本团视角单场互斥观看人口；朋友推荐是来源标签，不是第四个可凭空累加的人口池。
6. 外部观看者须由 Taiban/Fes 他团观众机会、外部普通人流、朋友转介等**真实独立需求**产生；不得再使用 `X=Capacity−O−P` 或把整场多团演出总动员全部算作实际看本团的 X。不可通过提高 sell-through 来填充特典与粉丝。
7. **由 Live Impression 决定确认转化**：有意主动购票的 P 与随机外部 X 的确认率不同；外部区分 X_idol 与 X_general。只有实际看本团的人才可能从现场转粉；没有到场不因该场 Performance 获得转化。
8. 新规券只有实际完成免费服务才产生体验效果；免费 gross/share=0、成本/服务占用真实；新粉最多计 O 一次，同一事件 Live/新规/付费共同触发时需互斥结算或组合 hazard；新 O 初始在籍成员 A 与每周 A/W 只由一个 settlement owner 回写。
9. 保留固定序章剧本 Live/Staff 日程；不得新造每周 Live 以逼近目标。不更改 Finance 唯一账本、合同、毕业结构约束。O≈300 仅校准参照，不是保底/门槛。
10. **之前独立 Python 模拟得到 O≈190/281/416/538 与正式 Runtime O≈33.6 使用不同底层公式**，仅属敏感性实验，不可拿来当新基线或者自动验收期望。

## 2. 统一结算分层

```text
weekly Staff SNS content decisions + weekly known channel stats
   -> impressions/views
   -> unique reached persons (platform & channel overlap corrected)
   -> currently unknown X unique eligible -> new P
   -> existing P's team/event recognition & intent (not extra P)
fixed event + marketing reach + friends + past activity
   -> O/P/X event-local actual demand, source overlap correction
   -> ticketing priority and venue/contract capacity
   -> booked ticket = attended
   -> actual Team/Member Impression
   -> free/paid Cheki demand & single physical queue
   -> event-local mutually exclusive X→P / X→O / P→O and initial A
   -> immutable momentum; weekly only-once P/O/A/W/U settlement + churn
   -> single Finance ledger + reports
```

**唯一性与守恒**：`OAttend<=O`, `PAttend<=P`；入场人数 `OAttend+PAttend+X_idol+X_general <= eventActualAudienceCapacity`。场馆合作拼盘内其他团的观众可同时参加整场，但必须单独按“本团实际观看”抽样而不是视为本团拥有的票务订单。按活动/周防重复发粉，P→O 扣 P 加 O；X→P 与 X→O 互斥，已 O 不再重复发 O。针对多场临时人群的去重，采用明确误差界的聚合估计，不得宣称永久微观身份追踪。

## 3. SNS 的周度生产与 Public 获取

每个 `channel ∈ {officialTwitter, memberTwitterAggregate, youtube, blog}` 输出：

- `contentCount`、`views/impressions`、`uniqueReachEstimated`、`newToTeamReachEstimated`、`existingPublicReachEstimated`、`engagementQuality`；不展示不可验证的个人级访客。
- reach 来自 Staff 频度、当周制作/舞台内容、成员传播能力、真实 Performance/视频质量、既有关注人数、转发/协作传播、剧本事件；视频长尾通过周度旧内容余效进入本周 reach，**同一视频不能每周被当作全新独立观众**。
- 先在渠道内对重复观看折减，再跨渠道合并，对已有 O、已有 P 与多周重访折减得 `R_newUnknown`。可使用近期累计重复率/饱和率作为团体级信号，不能持久化额外 fan cohorts。参数和饱和率必须集中配置并在 diagnostics 中可观察。
- `NewP_sns = Binomial(R_newUnknown, pRecognizeInterested(contentQuality,channelMix,engagement))`，且同周 X→P 总转换不超过来源池新接触人口。聚合性曝光必须先估计人数，再抽转化。
- `ExistingP_eventAware` 从本周已接触 P、历史信号、宣传与朋友覆盖合并生成。曝光对 P→O 的线上直接影响可作为低频专项概率，但**不得让同一批 P 由 SNS 和后续 Live 以独立计数重复转粉**。

**时间考据边界**：2013 官方/个人账号与博客、MV 上传情况由 Scenario 或 L1 已核实事实决定；缺失时用当期可用 Staff 运营模式，不能凭空声称每个成员已开个人账号。YouTube 在推出 MV 前可发 Live 录像/预告但质量与分发配置应不同。

## 4. Event Audience Demand

事件 `e` 的 Public 意向（不是到场的固定倍率）：

```text
pAware_e = clamp(mergeUniqueReach(eventPromotionSNS, pastTeamRecognition,
                             referral, pastLiveInterest), 0, 1)
Paware ~ Binomial(P_eligible, pAware_e)
PwantTicket ~ Binomial(Paware, pBuyGivenAware_e)
Pticketed = min(PwantTicket, seatsRemainingAfterContractualReservations)
Pattend = Pticketed
```

购票意愿应受 ticket price、workday/holiday、Live 形式、口碑、distance/competition、成员吸引力影响。建议研究候选：一般兴趣10%、中性20%、明确推荐/高兴趣30–40%；**均为 TUNABLE，不能作为历史统计数据写死，也不能理解为全部 P 的每场购买率**。

独立外部 `X_idolDemand/X_generalDemand` 必须读取 Scenario 合同/他团规模/分场观看概率/商圈客流/朋友邀请；先产生需求，再进行合同/入场/站台观看分配。团体自己的付费票房归属只对其合同授权售票有效；Taiban 不能把所有来看的 X 自动当本团购票者。

若真实团体出道或普通 Live 的合同只给固定观众总量而缺少其他团观看机会，应将 `externalDemand=NOT_CALIBRATED` 并暂用显式 provisional fixture + 诊断标记，**禁止**把剩余容量直接填满当实测 X。

## 5. Live / 互动触点转化

事件观看者互斥分组，先按到场实际质量计算 `q=actualImpression / expectedImpression`（或当前正式的受限映射）；随后生成：
- `P_active→O`：已知晓并主动购票者可具有较高现场确认概率，探索敏感性18%/25%/35%；
- `P_other→O`：被邀到场或低意向观看者，另有较低条件概率；
- `X_idol→P/O` 与 `X_general→P/O`：观演后有兴趣可成 P；因确实体验本团 Live 或 Cheki 能直接成 O；不得直接给全体 Fest 入场者机会；
- `SNS_direct_P→O`：仅明确线上持续 engagement 的剩余已有 P，合并去重后低概率转换，不可绕过状态与兴趣。
- 新规券和试买在 *completed service* 后新增同一人的转化机会，以 `pTotal=1−∏(1−pTouchpoint)` 或等价互斥抽样组合，不能 Live 已转 O 后由赠券第二次转 O。持久统计只保存净转化与来源近似。
- `NewO` 初始至少 1 位在籍 `A_i`，演出和已完成的真实互动按 Member Impression 影响初始成员选择；既有 O 多推强度 .03/.05/.10 只是比较候选，尚未冻结。

## 6. 默认经济与消费原则不变

付费商品、换粉秒数、五分钟队列统计、60分钟默认服务、成员20%销售分成、实际履约成本和单一 Finance ledger，继续以 `Chronicle_Fan_Cheki_Finance_v1.0.md` 与 `Chronicle_Fan_Cheki_Executable_Formulas_v1.0.md` 未被本文件覆盖的条款为准。新规资格使用聚合概率估算并明确累计领券/使用资格重叠误差；免费券与付费商品共用成员可用服务秒数。默认 B 剧本是否授予新规券由 Scenario 配置决定，不能因为探针证明成功就默认启用。

## 7. 旧算法废止映射（必须替换，而非双算）

| 旧 Runtime 算法/概念 | 新设计要求 |
|---|---|
| `pPublicAttendBase.taiban=.012 / oneMan=.07` 直接 `Binomial(P,p)` | 替换为 event-local `Paware` + `pBuyGivenAware` + 容量下单；旧字段仅保留 legacy 对照，不作为新 baseline |
| `externalAudience=max(0,totalAudience−OAttend−PAttend)` | 替换为分源独立外部**观看需求**，再受 capacity/可见舞台约束 |
| `pPublicToOtaku=.025` 对所有 P 观看者统一乘 q | 替换为主动购买/非主动 P 的分组转化+Impression；保留旧值仅用于 legacy 消融 |
| `pExternalToOtaku=.004` 所有 X 一刀切 | 替换为 X_idol/X_general + Live/完成的 Cheki 互动 |
| 每周没有 Twitter/YouTube/Blog `X→P` | 增加 Staff weekly SNS reach + 新有效受众→P + 跨周重复接触折减 |
| 用旧独立 Python fixture 的 O≈416 定标 | 明确禁用；改真实 Runtime 的 paired 100-seed 对照 |

## 8. 验收与审计

1. 保留现有 B/S3-C Runtime 100 seeds baseline（现报告约 O=33.62），不可改报表假装已经接入新模型。
2. 逐项启用正式代码：C0 旧基线；C1 独立线上新 Public；C2 C1+事件主动购票/外部真实需求；C3 C2+分组 Live Impression 转化；C4 C3+合同启用新规券反馈；C5 5/9/15 人 + 毕业/U 压力测试。相同 seed、相同演出日程、同样资金与剧情约束，报告 paired delta/variance。
3. 每周输出 Twitter/YouTube/Blog `impressions/unique/newX/repeat/existingP/newP`，每场 `Paware/Pwant/Pticketed/Pattend`、`X_idol/X_general`、真实观看、P→O、X→O、免费券实际服务和成员 A/W，并输出人口守恒/队列/财务断言。
4. 必须检查 SNS→P 的独立增益、已知 P→购票的独立增益、主动观众确认的独立增益及组合交互。全部结果注明所用候选概率、历史不确定性和容量口径。
5. **不能要求 O≈300 才 PASS，也不能因某项参数达不到300就施加无来源加成。** 任何回归只经过 CI 断言/正式 Runtime 和可解释的来源统计后才能升级参数版本。

## 9. 实施交付

在独立 PR/commit 中提交 Runtime、测试、完整每周/逐场报告和更新过的 `fanChekiBalance` 参数登记；没有实现的字段不得伪造数据。当前 C0–C3 实施与 100-seed 证据位于 `reports/staff-baseline/fan-acquisition-audience-demand-v1.1/`；C4/C5 仍不能因本文存在而视作已实现。
