# Chronicle B 路线：创始粉丝 Seed 与成长数据流修复任务 v1.0

**日期**：2026-10-25  
**状态**：Work Agent 执行任务；尚未声称已实现或复测  
**适用**：`yunfannas/idol-producer-chronicle`，序章 B（九人、全部采用 Staff 默认建议）  
**依赖提交**：`94bdad53f63a38fd06b9f75edebf01d727e217ef`（20/100 seeds 正式 E2E），`b6d27ebbdda352d8a07cb3c68bdfe4bbd0da87df`（Fan/Performance 根因审计与恢复修复）  
**上位规范**：先读 `docs/implementation/README.md`及 Fan、Member、Performance 相关专项文件；`docs/design/Chronicle_Game_Design_v0.10.md` 管剧情/活动合同，v0.9 §17.1 仅在 v0.10 不冲突时作为创始人物历史设定参考。不要反向恢复持久 Core。

## 1. 问题与已验证结果

| 指标（B 100 seeds） | 原始 `scenario-v1` | Performance / Recovery 修复后 `scenario-v3` |
|---|---:|---:|
| TIF 通关 | 100/100 | 无新增 softlock 的回归目标，需核对最新报告 |
| 最终 O 均值 | 4.3891 | 6.4583 |
| Event Performance 均值 | 约 0.500 floor | 0.7251 |
| 期末现金均值 | ¥322,251.50 | ¥326,595.50 |
| Overall C-or-better | 0/100 | 0/100 |

来源：`reports/staff-baseline/calibration.md` 与 `b6d27eb` 提交中 B root-cause / Performance-Fan 审计结果。修复发现 Staff 排练仅写入临时 `trainingExp` 而未增加实际参与 Performance 的 Palette；Calendar 缺每日 Condition 恢复。v3 已加入实际训练/演出 Palette exposure 与每日恢复。**不要再次把这些修复误归因于 Fan 转化率调高**。

### 更上游的缺口：正式开局 P/O/A/W 被清零

审计明确发现 B Scenario 初始 `P=O=A=W=0`。这不是用户确认的开局设定。旧 v0.9 §17.1 记载：
- **初始团队 Otaku = 30**，莉奈已有 20，宮原優花已有 10；不等于出道现场已保证有 30 人出席。
- **Public 认知参考值**：莉奈约 300、宮原约 150，均是 `TUNABLE`；它们是认知而非 Otaku。
- 在当前 Fan v0.2 中**不得保存 Core**：持久仅 `P/O/A_i/W_i`，临时 `O_unassigned`。原先创始成员“既有支持者”应先审计映射成团队不重复 O 与成员级 affinity；需要明确 `O` 与 `A_i` 是否可同量初始设置（此处 20/10 属两名成员不同来源，**不要假设**其个体完全不重叠的事实；需以可审计 Scenario seed 策略决定不重复团队 O=30 的初值）。
- `W_i` 的非零初值是必要的购买意愿配置，但 **¥1.8k 是 Fan 新建 affinity 的可调基线，不等于创始成员既有粉丝已被确认有相同消费意愿**。由 Work Agent 查专项规范和实际代码后明示 `TUNABLE`、测试不同值，不能当历史事实。
- Public 的 300/150 不能简单无条件相加并当作不重复的团队 P；如采用团队 P≈450 作起点，必须标为**临时去重假设**，记录潜在重复率和敏感性区间，不得虚构人数精度。

**推荐首轮工程输入**：将 `O=30` 定为当前剧本初值，分别为莉奈、優花建立可信的成员 affinity seed；Public 使用清晰命名的 `TUNABLE` 去重参数/区间。若实际正式 Scenario 已引入权威 seed，应复用现有定义，不创建第二套来源。

## 2. 执行顺序（必须隔离变量）

### S0 — 审计与可复现基线

1. 在 main 最新代码定位 `createPrologueState`、`signRoster`、`runStaffAutoplayPrologue` 以及 `fanChekiBalanceV1` 初始化链。确认是 `createFanState` 还是 `signRoster` 重置已有 Fan seed，并检查 A/C 进入时是否也清空已有状态。
2. 运行既有测试、B 100 seeds，建立 `before` 快照并记录 git SHA、Scenario/tuning version。若报告与提交版差异，报告以**重新实测**为准。
3. 保存单种子每月/每场 Fan 流账：`P_open, O_open, A_i/W_i, O_attend, P_attend, X_attend, X→P, X→O, P→O, O_churn, A_churn, Cheki trial/completed`；每周衰减一次，不允许故事已给初值再次由活动“补录”。

### S1 — 只修初始 Fan seed，不动公式

1. 将创始粉丝配置作为**有名称、有出处、有版本**的 Scenario seed，初始化/签约后依然存在。新加入的六人不得继承创始 A/W，也不能因成员数变多而复制初始 O 或 P。
2. `O=30`，创始两人各自基准 affinity 20/10 是待核对的初始化映射；团队 O 去重一次；其他成员初始 affinity 0。其余人的 `W=0` 是合理“没有 affinity 购买力”，但有创始 A 的成员应使用显式初始 `W>0` 可调设置。
3. A/B/C 三路线从**相同三位创始粉丝资产**出发。C 10月新候选无凭空 P/O，莉奈 2014-05-11 毕业时遵守 `O_unassigned` 既有转换与独立 ledger。
4. **仅初值改变**，其他 Fan/Cheki、Performance、合同、训练、评分参数完全冻结。跑 B 1/20/100 seeds，同种子与上轮配对比较。报告 `O/P/A/W`、Cheki gross、收入、cash、grade 和结构守恒。
5. 测试：初值保存与恢复；`signRoster` 不归零；新人不创造 fan；重复开档/读档不额外累积 O；创始成员毕业时不重复减团队 O；同一成员 A≤O−U（遵照现有 Kernel 不变量）。

### S2 — 只审计曝光与有效转换输入

在 S1 的代码/参数基础上，**不调整转化概率**，按合同类型分别核对：
- 外部观众 X 是**真实观看本团人数**而非整场拼盘总人头；特殊出道场/商场演出实际观看区分，不用收入零推定曝光零。
- `Public→Otaku` 的到场基数、概率乘数以及 Performance `Q`；不存在 `O=0` 导致错误短路 `P→O`。
- 官方媒体/外务是否存在实际可用来源；未实现就标 `NOT_IMPLEMENTED`，**不得注入平均每月曝光**伪装已发生。
- 逐场去重、容量约束、每周衰减及重复 Live 对同一人的归因约束；无隐形全团人数乘数。

生成两张独立表：`actual_exposure_by_event.csv` 与 `fan_conversion_by_month.csv`，包含 source_kind、event_id、contract、P/O/X、转化和质量数据；明确 `SCENARIO_PROVIDED` 与 `TUNABLE`。

### S3 — Performance 缺口单独验证

核对 v3 已接入的真实排练/舞台 Palette、每日 Condition 恢复、Team Palette **对应颜色学习效率最多+10%且仅XP发生时生效**。目前 persistent arrangement familiarity 与 key duty adapter 仍被上轮报告标记 `NOT_IMPLEMENTED`：遵照专项规范补最小正式适配，或明确保留 `NOT_IMPLEMENTED` 并**禁止**把 Performance 未达 C 全归因于阈值。

单独跑 B 20/100 seeds；记录歌曲熟悉度、Duty 分配、每人成长、Condition、单场 Performance 分布。**不得同时更改 Fan 参数和场馆收入**。

### S4 — Business 与评级（仅在 S1–S3 确认正确后）

核对真实 `Live ticket → Cheki gross/share/cost → venue/training/payroll/asset → Finance`，逐场、逐月对账。仅在真实曝光/消费提升后评估 Business，不能用固定月收入、免费粉丝、贷款当营收或任意调低 C 阈值。Fans/Performance/Business 三项独立审计；C/C/C 是 B Staff 默认路线的**校准目标**而不是硬保底。

## 3. 每阶段强制交付与判定

| 文件（建议放在 `reports/staff-baseline/next-calibration/`） | 内容 |
|---|---|
| `seed-contract.md` | 初始O=30、创始 A映射、P去重、W初值的来源/状态/假设；不保存Core |
| `baseline-v3.json` | 修复前固定seed和100seed、SHA及版本 |
| `seed-only-100.csv` | 只改初值后的每seed结果、现金和等级 |
| `fan-flow-audit.csv` | 逐月 P/O/A/W、流失及每种来源转化 |
| `exposure-by-event.csv` | 真实合约活动、外部观看与来源 |
| `performance-gap.md` | Familiarity/Key Duty 状态、Palette经验/Condition验证 |
| `before-after.md` | 按 S1/S2/S3 阶段隔离对比，说明是否真实进入 C 范围 |
| `failures.md` | 未解决 softlock、负数、重复账本、缺失资产/收入等 |

**运行要求**：`npm test`、`npm run lint`、`npm run build`，至少 B 20/100 seeds；随后 A/C 各20 seeds 防止 seed 修复造成路线差异错误。显式报告各阶段 seed 完成数、TIF 出演与章末评级分布、期末/最低现金、Otaku 的均值/分位和复现命令。

**禁止的捷径**：不能将 `O=300` 每月机械托底，不能改写 E→C，不得创造不存在的商演、Cheki买家或无合同收入，不得把报告 seed1 当100seed统计，不得将设计更新称为测试通过。

## 4. 完成定义 / Work Agent 最终报告

最小完成条件是**原始创始粉丝通过正式 Scenario 初始化并跨面试/录取持久存在**、B 100 seeds 经真实回归、Fan 有每月来源账、资金账可核对、A/C不出现创始粉丝复制、训练与舞台成长有证据。若平均 O 仍远低于 2014-07 参考约300，需如实提出“曝光不足/转换不足/未实现渠道/参考值需重校准”的区分，不可直接宣称失败仅由转化率引起。**本轮不要求强制全C。**

Agent 提交源码、测试、报告与 commit SHA，列出尚未批准的 TUNABLE 与产品决策，供下一轮审查。
