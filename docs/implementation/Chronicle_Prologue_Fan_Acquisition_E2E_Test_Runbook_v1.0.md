# Chronicle｜序章 Fan Acquisition × Affinity × Cheki E2E 测试指南 v1.0

**Status: EXECUTION RUNBOOK / 2026-10-25 / B structural audit executed; C1–C3 audience channels and C4 free-voucher contract are available as isolated diagnostic/Scenario inputs; full B-route integration and U lifecycle remain NOT_IMPLEMENTED.**

**执行记录（2026-10-25）**：B / S3-C 的结构验收已由 `reports/prologue-fan-e2e/b-s3c-100-seeds-v1/` 输出。该记录只声明其当时默认 Runtime 的已实现边界；之后新增的 C1–C3 观众渠道诊断 Kernel 与 C4 免费券必须以显式 Scenario 合同另跑 paired-seed 回归，不能回写为该基线已经启用。U 专用 lifecycle 仍按报告标记为 `NOT_IMPLEMENTED`。

目标：在 **Chronicle 仓库的真实 Runtime** 内检验“固定序章日程 → SNS/朋友/Taiban 认知 → Public 购票 → Impression → 新规赠券与付费 Cheki → P/O/A_i/W_i/U → Finance”的完整闭环。**不可用新建的独立 Python 世界模拟替代 Runtime E2E**。本指南是测试任务，不宣称源码已经实现这些接口或测试通过。

## 0. 阅读顺序、权威与硬边界

1. 本地 `docs/implementation/README.md` 及其列出的五份专项规范。
2. `docs/design/Chronicle_Game_Design_v0.10.md`：序章合同、日期、人物、剧本 gate。
3. `docs/implementation/Chronicle_Fan_Cheki_Executable_Formulas_v1.0.md`：当前已登记的可执行初版算法和 `fanChekiBalanceV1`。
4. `docs/implementation/Chronicle_Prologue_Acquisition_Affinity_Cheki_Calibration_2026-10-25.md`：新设计决议、候选数值、以往独立夹具的局限。

仅在 Chronicle repo 内工作；不得引用旧 persistent Core、十色色轮、逐人永久 Cohort 或未经批准的研究 repo 公式。固定序章演出数量、合同、Staff 约束；不新增玩家可选的 Live/SNS 频率策略。数值基线变更先做审计、独立分支并记录前后对比；**不能为凑 O≈300 直接注入粉丝或硬设章节 C 保底**。

## 1. Step 0 — Runtime 接口审计（先于修改）

定位并记录**真实文件路径、symbol、调用顺序、测试命令、现存覆盖率**：
- Scenario/Calendar：2013-01-07 开档 → 2014-08-02 TIF；出道、各 Taiban、2014-01/02 试验定期、2014-03-05 起周三公演、2014-04-16、2014-05-11 毕业、One-man。
- Audience/Contracts：O/P/X 分源、Taiban 外部观众从何而来、活动容量、各团目当、Public 购票需求是否已实现；不能把 `externalWatchingAudience` 当成全场入场人数。
- SNS/Staff：官方/个人曝光、唯一 reach、活动告知与周结算；同一触达是否反复算入 X→P。
- Performance/Impression：Team 与 Member 有效曝光、Expected/Q，实际阵容与毕业成员出场限制。
- Fan：P/O/A/W/U、事件 momentum、唯一 weekly settlement、初始化 P=240/O=30 是否被签约/读档重置。
- Cheki：两个付费档位、5 秒换粉、五分钟统计窗口、真实商品/免费券合同、共享队列、多推观众共享时间。
- Finance：实际商品成交、成员20%佣金、免费券真实成本、票房与现金账本幂等。

先提交 `reports/prologue-fan-e2e/<run-id>/audit.md`，用 **EXISTING / NOT_IMPLEMENTED / CONFLICT / TUNABLE** 标记；若入口不存在，不假装已完成 E2E。

## 2. 固定输入与可复现性

- 统一默认测试：**B route、9人、Staff 全委托、初始 P=240/O=30、现金 ¥3m**，依 v0.10 合同和真实 R1–R4 约束；正式成员名单和演出可用性由 Scenario 决定。
- JST 时间；2013-05-24 出道；2013-09-29 免费商场零收费；2014-01/02 四场试验定期；2014-03-05 起周三公演不能遗漏或重复；2014-04-16 公演与毕业发表仅一场；2014-05-11 毕业后莉奈不得出场/取得新 A/售卖 Cheki；2014-06-26 不能覆盖 06-25 定期；2014-08-02 TIF 结算并收尾。
- 剧本待定场次/One-man 日期读取当前实际 Scenario，不为匹配旧独立夹具人工强制为 2014-07-26。
- 保留 master seed、per-event RNG 派生规则、当前 commit、balanceVersion、scenarioVersion、Staff Policy、合同/产品配置；同 seed + 同版本输出须逐字段重现。
- **先跑 1 seed 的逐事件审计，随后 20 seeds 烟雾回归，最终每情景 100 paired seeds**（建议 seeds=0..99）；所有消融/情景用相同 seed 集合和已存在的 RNG 隔离契约，若未隔离须报告 paired delta 失配而不能声称因果对照。

## 3. Step 1 — 单场观众与购票微测试（无须完整剧情）

以可控 fixture 覆盖：
- `P=400`、有效知晓率 50%、知晓后购票率20%、剩余可售座位85 ⇒ Public 购票**期望**40；**随机抽样不应硬断言恰好40**，且购票=到场。仅将容量降到15，实际不得超过15；把有效知晓设0，即使剩余85个座位，也不得自动来人。
- 同一个 Public 经 SNS、朋友与过往 Taiban 三次了解，本场仍只算一个可购票观众；P/O 本场出勤池互斥。朋友可为既有 P 或外部 X，不得既占 P 又凭空新增 X。
- Taiban 外部 X 要区分 `X_idol`（他团 Otaku）与 `X_general`（路人），都只统计**实际观看本团**的独立观众，不能把活动总入场直接作为本团 X。
- 票务/容量遵守已确认预订优先级，不允许后来 Public 挤掉已售 O/其他合同持票者。不同场次可重复参加；`P→O` 只能真实扣 P 加 O，不能每次重算为新 O。
- Public 条件购票基线 20%、低兴趣10%、强兴趣30–40% 是**候选**；现有 Runtime 参数未经批准不得静默改写。实测需求需要同时展示 P、awareness、intent、price/region/event factors、capacity 与最终售票数。

## 4. Step 2 — 同场 Impression / 转化 / 赠券 / 队列

按实际 Runtime event transaction，至少测试：
1. 主动购票 P 的较高条件确认概率 vs 偶然观看的 `X_idol` 与 `X_general`；体验差、中性、优三个 Performance/Impression fixture，应影响 Live 后概率，而不重复乘放大 SNS 原始获客。
2. `X→O` 与 `X→P` 互斥；首次试买/免费互动与 Live 影响使用**合并概率**，每位事件级临时人最多新 O 一次。重复看到活动、不参加的人不得因本场 Performance 转 O。
3. 新规券由合同控制团体/成员新规资格、领取/使用语义与数量；**仅完成**免费服务才扣实际 slot/成本，免费服务 gross=0、member share=0。未服务完不得算转化已完成。所有免费/付费客户进入相同成员队列。
4. 逐成员 ¥1000/¥2000 独立商品、当前配置约 20/40 秒、同一服务组换粉 +5 秒；**五分钟为统计/调度切片，不是单人服务时间**。同一观众不能同时在两条队列被服务；不同成员可同时接客；热门成员压力测试须出现容量/弃队效果。
5. 免费券与付费的 `cost/gross/share/net` 分开；已有粉首次尝试新成员不自动变成“本团新增 O”；成员缺席、合同禁收费、免费商场活动收入均受合同约束。

## 5. Step 3 — 周结算、成员 A/W 与毕业微观 oracle

- 每场只写 immutable event momentum；**每周只结算一次**，Replay/Load 不得再次增加 O/A/W 或现金。按既有公式处理 churn，新 O 产生至少一位在籍初始 affinity（若契约允许仅 U 的特殊情况须单列）。
- `0<=A_i<=O-U`，`0<=U<=O`，P/O 非负，`sum(A_i)>O` 合法，不能对总 A 强行限幅。**`sum(A_i)>=O-U` 不是一般聚合状态天然保证，只有若实现声明所有已分配 O 都有至少一位 A、并且重叠估计维持该条件时才启用断言**；否则报告未归属估计并修复机制，勿用任意填充。
- 测试已有 O 额外成员 affinity 每场强度 .03/.05/.10，**统一使用同一公式和曝光份额**；观察 A 分布、max/min、总和、`sum A/(O-U)`、Cheki 分会员消费；新 O 的至少一名初始推与已有 O 的多推增加分别记账，不能重复加计。
- (W_i) 按当前正式 weekly engagement/queueLost 公式更新，只由实际互动质量与未满足需求驱动，不能“卖得多直接涨 W”；不在籍者不得再新增长期 A/参加活动。
- 对 2014-05-11 莉奈毕业使用临时**事件内微观 oracle** 构造：莉奈单推、莉奈兼推優花、莉奈仅兼推而另有主推；比较 oracle 与聚合估计的 O 流失/U/转推，说明误差。不持久化 Primary 或粉丝 ID，不把所有莉奈主推无条件送入 U。
- 赠券触发的新增 O/A 必须影响**下周**的到场与付费，而不是仅输出候选计数；但同一事件/同周不能重复领取或重复计新客。

## 6. Step 4 — 100-seed 正式 B-route 与消融矩阵

**优先级**：先现行 unmodified baseline（真实现状），再做最小增量实现，最后在同一 seed/场次/合同上比较；不要为了生成对照随意删除既有剧情 Live。

| Case | 设计 | 用途 |
|---|---|---|
| C0 | 当前主干原样 B-route | 留存现行 P/O/A/W、Cash/评级可复现 baseline |
| C1 | 观众与渠道账本启用，但概率不改 | 观察正确归因和实际曝光，找 source leakage |
| C2 | C1 + 有效 Public 购票/朋友/过往认知（候选20%） | 只改到场需求，不改确认概率 |
| C3 | C2 + 条件确认（主动 vs `X_idol`/`X_general`，Impression） | 单独估计 Live 转化贡献 |
| C4 | C3 + 新规券与完整共享队列 | 测量额外新粉、A/W、实际付费与成本 |
| C5 | C4 + 5/9/15 成员及毕业/多推强度 .03/.05/.10 | 经济与成员规模压力测试 |

另做开发用 ablation：关闭**仅 SNS 直接新增 P/O**、关闭**仅外部 Taiban 转化**、关闭**仅赠券额外互动转化**，但活动/宣传/内容本身照常存在；明确定义关掉的机制，不把 SNS 带来的“到场后转化”强行归零。各实验相对 C0/C1 的差异不是直接可加的渠道归因总和；需要交互项或有条件的归因账本。

按 2013-05 出道、2013-09 免费商演、2014-01 试验定期、2014-03 正式定期、2014-05 毕业、2014-07 One-man、2014-08 TIF 逐阶段汇总：P/O、来源/触点、新规使用、有效 Public 购票/实际观看、members A/W、gross/share/cost/net、Cash、Fans/Performance/Business 章末字母等级；报告 mean/median/p10/p90、失败 seeds 与异常 case，不能只报 100 seeds 均值。

## 7. 必须落地的输出文件（相对 repo 根目录）

```text
reports/prologue-fan-e2e/<run-id>/
  audit.md                    # existing/gap/conflict, module paths & test commands
  config.json                 # commit, scenario, balance version, seed set, tunables
  events.csv                  # 每个完成活动唯一一行，原始合同/日期/容量/来源
  weekly.csv                  # 按周 P/O/U 和按成员 A/W
  attribution.csv             # source vs conversion touchpoint; mutually exclusive new O
  cheki-member.csv            # event/member/item free/paid units, served, lost, gross/share/cost
  finance.csv                 # 唯一账本映射，现金和利润区分
  seeds.csv                   # seed×scenario final & stage checkpoint
  assertions.json             # 每类断言 passes/fails, seed ids
  summary.md                  # 差异解释、不确定性、失败列表、参数决策
```

如果当前接口无法输出某字段，必须标为 `NOT_IMPLEMENTED`，不允许用“合理估计值”冒充正式观测。研发可额外提供一份**event-sourced transaction trace** 供问题 seed 复盘，确保公开 UI 不泄露隐藏 Impression、真实个体信息或他团票房。

## 8. 硬性 Gate、停止条件与提交标准

**Gate 0**：能运行 repo 现有测试和现行 B-route baseline；若不能，留下可复现错误、环境与路径，不能宣称已通过。

**Gate 1（结构正确）**：所有 seed 的人口/活动/券/队列/财务边界断言通过；出现负 P/O/U、超容量、重复转粉、免费券生收入、毕业成员继续上台、存档重放双计，必须先修 Bug，不允许调倍率掩盖。

**Gate 2（经济正确）**：成员级产品明细与 Finance 账本逐活动一致；赠券短期成本、下周回流 O/A/W、二次付费实际出账均可核对。

**Gate 3（行为校准）**：比较渠道贡献、分阶段上座率、O 与 A 分布、Cash 风险以及 seed 离散度；O≈300 仅作统计参考，不是通过条件。若结果差异主要来自某个假定曝光/券规则，标注待核，不得宣布参数冻结。

**变更限制**：每次最多改一组 TUNABLE，写 `before/after` 和 100-seed paired deltas；源码 + 测试 + docs + 运行报告一同提交。若完成度不足，提交有明确 `NOT_IMPLEMENTED` 与失败证据的部分结果，勿声称完工。

## 9. 可直接复制给实现 Agent 的执行指令

> 在 `yunfannas/idol-producer-chronicle` 按 `docs/implementation/Chronicle_Prologue_Fan_Acquisition_E2E_Test_Runbook_v1.0.md` 执行。先审计 Runtime 和运行既有测试，保存 unmodified B-route baseline；禁止新造独立世界模拟替代正式代码。仅在现有模型基础上补真实 P 购票/认知/朋友来源、Taiban 分源、SNS source attribution、免费券共享 Cheki 队列、P/O/A/W/U 周度反馈与毕业 oracle 的缺口；每一步通过结构断言后再跑 20-seed smoke 和 100 paired-seed C0–C5。不要更改固定序章演出数量或强制 O≈300，不改已锁定规则，不增加永久 Cohort/Core/Primary。输出规定的 reports 文件，记录 commit SHA、真实测试命令、通过/失败数量、参数变化和未实现项。只有实际通过正式 Runtime E2E 后才可提出冻结新数值。
