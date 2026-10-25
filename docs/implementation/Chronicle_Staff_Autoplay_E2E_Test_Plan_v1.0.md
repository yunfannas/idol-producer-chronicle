# Chronicle 序章 Staff 自动运营 E2E 测试与修复计划 v1.0

**状态**：Work Agent execution handoff / 尚未声称测试通过  
**仓库**：`yunfannas/idol-producer-chronicle`  
**范围**：2013-01-07 JST → 2014-08-02 TIF，先 B（9人），再 A（18人）和 C（3→9人）  
**目标**：实际运行、定位、修复和复测，而不是继续制作假设现金流或模拟结论。禁止为了结论“全 C”而定向注入收入、粉丝、技能或改写评分。

## 0. Work Agent 启动指令（可原样执行）

1. 在本仓库读取 `docs/implementation/README.md` 及所列本地专项规范，然后读取 `docs/design/Chronicle_Game_Design_v0.10.md`；在有冲突时遵守 Implementation Pack 对公式/Policy 的优先级及 v0.10 对剧情/日期/合同的优先级。**不要从旧 v0.9/v0.6 表或 `idol-data-lab` 临时抄公式补空。**
2. 审计现有 `src/lib/runtime/` 的 `prologue.ts`、`regression.ts`、`fan.ts`、`cheki.ts`、`finance.ts`、operating v1/v2/v3 实现以及全部测试。记录每个阶段是 `PRODUCTION_CONNECTED`、`FIXTURE_ONLY`、`MISSING` 还是 `CONFLICT`，附函数和测试位置。
3. 运行 `npm ci`、`npm test`、`npm run build`（存在缓存/环境阻塞时记录命令、stderr 与替代方案）。已有 `prologue.b-full-calendar.test.ts` **只是无收入的门控回放测试**；不能拿它证明自动 Staff/Economy 通关。先修复它实际暴露的问题，再开始 E2E。
4. 以**正式持久 GameState/Calendar**接入已存在 Staff/Performance/Fan/Cheki/Finance Kernel；缺的接口以严格最小的适配层补充。不可把中性 regression fixture 或 fixed external audience 直接当作正式剧情收入。重要合同有真实 Scenario 来源；无合同就没有活动和收入。
5. 真正运行 B 路线到 TIF，输出逐月 CSV/JSON、每场 event ledger、seed 统计和问题列表；定位与修复真实失败。稳定后运行 A/C 对照，完整交付 PR 或审阅友好的提交与测试报告。

## 1. 冻结规则与版本纠错

- **无初始难度选择**，所有路线初始现金 ¥3,000,000（本项目当前 Staff-only 决议）；旧 `Difficulty` 字段/旧 v0.10 §5.3 的 Easy/Normal/Hard 属迁移遗留，不能恢复用户可选难度。
- 序章评分仅 **Fans / Performance / Business + Overall**，按 S/A/B/C/D/E 展示；成员培养仅回顾，不是第4个评分。C/C/C 是 B 的**统计校准目标**，不是必然每个 seed 的结果，也不是通关保底。
- B 初始9人 = 莉奈/優花/陽菜 + 首批面试录取6人；创始成员八色仅莉奈 Pink10、優花 Red5、陽菜 Yellow5，其他颜色0；新成员八色全0。真实初始歌曲/属性来源按已批准文件，不能将中性测试夹具人物冒充剧情。
- 默认最初完成面试（15位统一流程、6 AP可不用完）、录取/Leader/合同/初始策略等**不可委托节点**；其余玩家选择 Staff 推荐/Delegate，常规 Live/训练无需每周手动确认。统一默认 Medium 合同和 Medium 训练仅在当前剧本推荐确实如此时使用；若推荐数据尚缺，标记 TUNABLE 并明确 fixture 假设，不得宣称已冻结。
- **小/中团 3–10 人常规全员出演**；仅11–18人大团实施正常选拔轮换；合同个别受邀/衍生单位是已注明例外。九人不能因为 Staff 偏好而常规轮换。
- 2013年10月仅 active 3–7人触发新的15人候选池公司补员事件；B不触发，C补到9人（按合同真实扣费）、A若仍≥9不触发；不能复活首轮落选者或给新人老成员熟练度。
- **当前 v0.10 日期**：2013-05-24 赤坂BLITZ正式出道（本团门票收入和场租均0，所有在籍成员可参加许可的Cheki）；2013-12仍是拼盘；2014-01/02共4场试验定期；2014-03-05起每周三正式定期（含4/16毕业发表**同场一次**）；2014-05-11莉奈毕业演出并退出；2014-07 One-man（游戏当前暂定7/27）；2014-08-02 TIF。6/26外部演出不得吞掉6/25周三定期。
- TIF邀请窗口对差成绩也出现，文本、合同待遇、舞台反馈可据实变化；实际无法合法演出/玩家明确拒演时保留缺席事实。不能捏造收入/观众/完成状态。
- Fan **P/O + per-member A_i/W_i + 临时 O_unassigned**，不持久 Core；允许 ΣA_i>O，不能把Cheki买家、张数、目当、动员、Otaku混为一个数。
- 普通拼盘票务 `R*(0.15/N + 0.25*m_i/M)`，M缺失用已有安全合同 fallback、不得臆造份额；免费商场活动收费收入0，封闭商演只按真实合同固定费且默认无Cheki，One-man/TIF采用各自合同；Cheki双档1000/2000逐成员真实需求/队列/时间/成交，默认实收gross的20%成员分成，工资与Cheki成本不得双扣。
- Team Palette 八色对应成长 multiplier `1+0.10*TeamPalette[c]`（颜色占比0..1）；只有实际XP发生才乘、最高10%；不直接影响Performance/Impression，Member Palette在Performance的收益仍线性。

## 2. 必须构建的正式执行路径

```text
createPrologueState(seed, Scenario opening)
 → 强制面试与合法录取 → 合同和初始策略
 → Staff Calendar: existing offers/contracts + AP/legal/school/condition
 → 已授权的排练/歌曲制作/曲库熟悉度与日期进展
 → 逐场 Live：实际 lineup/setlist/关键段落→真实 Performance→Immutable completed outcome
 → 票房/出演费 (按合同) → Fan exposure/momentum
 → 成员Cheki真实需求 + 5分钟时间片/共享排队与容量
 → Ledger: gross、成员佣金、变量费用分别且仅一次
 → 周末 Fan P/O/A/W 更新与训练恢复/Condition
 → 月度 Finance 报表/资产/债务和Weekly Review
 → 莉奈毕业、重新安排Part及Leader
 → One-man、TIF、三维章节评分与跨章快照
```

**执行边界**：不能仅使用 `resolveLive({chekiSales: []})` 标记事件成功；这只是一种状态机 smoke test。每个已完成 Live 必须具有真实结算所必需的 Performance/Fan/Cheki/Finance outcome；未结算时不能假称演出已完成。每周 Fan decay/转换只执行一次；金额/XP/疲劳按唯一 liveId 与 ledger id 幂等。未获合法合同的活动不生成现金；模拟缺失参数采用有名称、版本、来源和审计标签的配置，不能悄悄设置“为了盈利”的参数。

## 3. 分阶段验收任务

| 阶段 | 测试 | 验收标准 | 交付 |
|---|---|---|---|
| P0 Audit | 跑现有单测/build，比较代码和规范 | 失败与缺口清单；能复现现状 | `reports/staff-baseline/audit.md` |
| P1 开档 | B 面试→6人签约→默认设置→原曲交付 | 9 active，Pink10/Red5/Yellow5，6新人palette0；现金/资产只扣一次，歌曲5/24前完成 | seeded test |
| P2 初登场 | 2013-05-24 debut | 真实出演/曲目/Condition/Impression，票务¥0、场租¥0，九人均有许可的Cheki机会，账本不重复 | Live JSON |
| P3 早期运营 | 2013-06–12逐场 | 仅合同活动，商场活动收费¥0；12月无正式定期；10月B不补员 | 月度 ledger |
| P4 定期 | 2014-01/02四次、3/5–8/2周三22次 | 4/16只一场、6/25与6/26各一场；Staff不周周阻塞批准；Condition合法 | Calendar diff |
| P5 人事 | 2014-04-16发表、5/11毕业及后续 | 莉奈退出 active/队列/演出/周评；Leader接班，已发表歌曲Part重练且有实际训练时长 | Member/Work log |
| P6 大场 | 2014-07 One-man、8/2 TIF | 邀请不依成绩锁死；结果真实计算；严重资金短缺保留贷款/调整及无法演出的真实后果 | Live & cash report |
| P7 结算 | TIF后的章末回顾和存档 | Fans/Performance/Business/Overall字母评级、资产负债/粉丝成员状态继承，无第4项评分 | Snapshot test |
| P8 对照 | A18人不强留、C3人10月补9人 | 同一Staff算法、相同随机种子组；不存在路线定制的隐藏现金/评分兜底 | comparison CSV |

## 4. Seed & robustness protocol

1. **Smoke**：固定seed=1，逐天/逐周完整运行一次 B；对运行中遇到的首个失败定位到 `date/liveId/gate/memberId/ledgerId`。修完必须从开档重放，不准只手工修改终局对象。
2. **Regression**：B至少20 seeds（1..20）作为首次可复现集；完成后扩大到100 seeds，区分 `COMPLETED_TIF`、`INVITED_BUT_CANNOT_PERFORM`、`BLOCKED_BUG`、`BANKRUPT_OR_DEBT_DISTRESS` 等终态；成功进入下章不能靠绕过合法经营限制。
3. **Counterfactual**：A/C各至少20 seeds，与B使用相同环境seed；不要求A/C全C，要求人事、收入、成本差异可归因于真实成员/合同/场次，不强制利润排序。
4. **Sensitivity**：按显式TUNABLE配置单轴扫描外部观众与观看率、P→O、O→A、W变化、Cheki商品成本、票务目当、定期公演票价/场租、训练强度与活动供给；记录配置SHA及seed。不在主线写死任意期末O=300。
5. **Replay**：同seed同版本每月/每场输出字节级稳定（或明确规定忽略非业务时间戳）；同event重复提交、保存/重载、跨月重放绝不重复账本/转换/Condition与EXP。
6. **Conservation**：P/O非负、同一Otaku不被按全团人数重复获客；多推ΣA_i允许>O但每人每成员A_i≤O；同一场实际售出≤请求数量/队列容量，成员实际所得=佣金规则；开收现金 + posted receipts − posted outlays ±融资 = 关账现金。

## 5. 每月/每场输出 schema（不允许只打印最终现金）

- `run_id, git_sha, scenario_version, tuning_version, route, seed, date, stage_status`
- `active_roster, school_age_conflicts, condition_min/mean, manager_ap_used/available, training_hours, actual_song_and_palette_xp, work_familiarity`
- `live_id, kind, contract_id, expected/actual_attendance, nominated_admissions, actual_participants, completed_status, song_ids, performance_internal, satisfaction_internal`
- `public_count, otaku_count, unassigned_otaku, per_member_affinity, per_member_purchase_weight, fan_momentum, attrition, new_from_exposure`
- `per_member_cheki_{1000,2000}_requested/completed, queue_lost, gross, commission, variable_cost, retained, buyer_count`
- `ticket_revenue, appearance_fee, venue_cost, transport_cost, payroll, training_room, making, costumes, other_cost, ledger_ids, cash_open/close/min, loans, assets`
- `gates_opened/resolved, blocking_inbox_decisions, leader, review_fact_refs, chapter_grade_fans/performance/business/overall`

输出真实内部连续值仅到 `reports/` 或内部测试；**不得**在玩家 UI 泄漏隐藏 Performance/Impression 数字、他团票房/目当或精确粉丝转化因果。

## 6. 问题排查优先级（先修 correctness，再调 balance）

**P0 阻塞 / correctness**：编译/测试失败；错误事件 gate；漏正式周三或同日重复；缺合同有收入；负人数/重复粉丝；重复账本；9人无故轮换；毕业成员持续演出；工作日/未成年违规；无玩家主动决策却每周软锁。  
**P1 集成缺口**：Fixture staff/v3未进入真实 GameState；Prologue resolveLive只调用可选ports、不产出实际Impression与Fan; 周月账本未连起来；Cheki成交未接共享时间片真实需求；贷款/债务表未闭合。  
**P2 平衡**：真实收入偏低、Otaku增长远低于目标、Condition持续恶化或Business< C。先打印收入按合同类型分解和真实曝光，再调单一TUNABLE并完整重跑同seed，严禁“结果修正系数”。  
**P3 文案**：Staff Weekly Review/外部评论从immutable report投影，离队后的主持人正确、不能因评论产生粉丝或现金；Live review v0.2尚是detached presentation Kernel，非E2E通关前置条件。

## 7. 交付文件与完成定义（Definition of Done）

在 `reports/staff-baseline/` 提交：
- `audit.md`：版本/函数映射，测试命令与完整通过/失败结果，标出 fixture-only 部分。
- `B-seed-1-timeline.csv` 和 `B-seed-1-ledger.json`：2013-01-07到TIF每月+事件可追溯结果。
- `B-20seed-summary.csv`、`B-100seed-summary.csv`：终态与等级分布、期末O、现金最低/期末、负债、关键事件成功率；100种子未执行则明确写 NOT_RUN。
- `ABC-20seed-comparison.csv`：A/B/C对照；A不强留、C补员到9。
- `failure-cases.md`：具体最小重现、root cause、修复commit和重测结果。
- `calibration.md`：冻结、临时、可调参数清单；任何校准均记录 before/after。
- 源码和自动化测试：可用单条命令执行 `npm test` 或新增命名 `npm run test:staff-e2e`，CI若可用亦接入，不依赖本地私人文件。

**完成条件**：所有P0 correctness通过；B 20seed可重复到终局或产生诚实合法的失败终态；单场和月报账目可对账；不存在收入/粉丝/XP幽灵补偿；TIF不会被低分锁住；章末真实三维评级可输出；并报告B实际C/C/C比例（若不达标必须如实提交问题，不得宣称通过）。

## 8. 已有检查入口（不要误报为端到端通过）

- `src/lib/runtime/prologue.staff-baseline.test.ts`：初始资金、人物色谱与日历静态检查。
- `src/lib/runtime/prologue.b-full-calendar.test.ts`：零营收的门控/幂等回放。**只有测试文件已提交，不代表Vitest已实际运行，也不代表Staff成功运营。**
- `src/lib/runtime/regression.test.ts`：中性5/9/15人×12周×20 seeds Fan/Cheki回归，不是2013-2014正式剧情。
- `docs/implementation/Chronicle_Operating_Simulation_v3.md`：Staff方案/训练/真实明确额外合同的12周 fixture；不带正式Calendar或持久存档。
- `src/lib/runtime/reviews.ts`：Live外部评论纯显示层，当前不承担经济结算。

**Agent最终报告模板**：当前SHA；完成/未完成清单；实际执行命令、测试数量及失败；B1/20/100各自运行状态；A/C状态；最低现金及破产/贷款；2014-07 O/A_i/W_i；每月和每场证据文件；修复提交与保留问题。**请勿以“测试已编写”替代“测试已运行”。**
