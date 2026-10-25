# Fan × Cheki B/C/D Stress Regression — 2026-10-24

**Status: VERIFIED locally on 2026-10-24.** 这是继 [Fan_Cheki_Regression_2026-10-24.md](Fan_Cheki_Regression_2026-10-24.md) 之后的第二轮测试定义。所有六项压力/抽样测试已通过；本文件记录固定 seed 的实际输出，而非虚构均值。

## 中性参数保留；旧数值必须重新计算

仍保留 `pExistingOtakuToAffinity=.05`、`fanChekiBalanceV1` 其余参数、FanState 持久字段、Cheki 商品时长/成本和正式 Scenario；新测试专门给 regression harness 增加可选的 `GrowthFixtureOptions`（默认无影响）。**但 2026-10-24 首轮报告中的 A、Cheki 收入及现金流数值属于修正前历史结果，不能继续作为修正后的基线。** 必须重新运行 5/9/15 人、12周×20 seeds 才能生成新结果。

## B. 热门成员容量压力

**测试输入（不是剧本数据）**：`O=300,A_star=240,W_star=15`、本场 `attendeeOtaku=250`、单成员开放60分钟、固定 seed `B:hot-member:1`。

**验收**：`requestedJPY>grossJPY`、`queueLostJPY>0`、`completedUnits<requestedUnits`、服务结束时间全部≤3600秒、同 seed 完全重放。没有将未成交请求写为收入。

**实际结果**：请求 ¥2,492,000；成交 ¥161,000；排队损失 ¥2,331,000；
1,599 请求商品、140 成交商品、65 位唯一成交粉丝；最长完成等待 49.06
分钟；服务时窗利用率 99.43%。未成交需求没有计入收入。`queueLost` 中
超时与耐心放弃的拆分仍未在返回结构中提供，保留为显式缺口。

## C. 多推共享时间

**测试输入**：`O=300`、5位成员各 `A_i=120,W_i=2`、`ΣA=600>O`、本场 `attendeeOtaku=150`、固定 seed `C:multi-oshi:1`。

**验收**：同一临时观众能够在同场完成多名成员购买；每名观众的服务时间区间**两两不重叠**；每成员 `grossJPY≤requestedJPY`；同 seed 完全重放。临时观众和 trace 只在测试回调中保存，不进入长期 FanState。

**解释边界**：当前每成员 Hypergeometric 之后独立抽样临时观众 ID，重叠只是无 Cohort 的统计近似。该测试验证可重复的多推与时间守恒，**不验证真实市场中成员之间的相关性**。

**实际结果**：请求 ¥386,000，成交 ¥386,000，排队损失 ¥0；100 位唯一成交
粉丝中有 65 位完成了至少两名成员的购买，共 231 个服务组。所有同一粉丝的
服务区间不重叠。

## D. 成长与互动响应

**测试输入**：9人、12周×20 seeds；与中性基线使用相同初始 Fan 和 seed。成长场景单独传入 `liveQualityFactor=1.5`、`interactionQualityBonus=0.5`、`externalWatchingAudience=120`，中性场景保持原默认 `1/0/30`。

**验收**：成长场景第12周的平均 `O`、`ΣA`、`W` **分别高于**中性场景；同 seed 完全重放。

**重要限制**：`liveQualityFactor` 和 `interactionQualityBonus` 是 **regression-only 注入值**，用于验证单调响应；**尚未接入**真实 Performance Impression 或真实 FanEngage 输出。不能把通过此测试描述成完成 Live/Palette/Training/Staff 的端到端集成。正式游戏仍需把真实事件结果映射到这些接口或等价生产接口。

**实际结果（9人、12周×20 seeds）**：中性 `O=40.6954`、`ΣA=27.2642`、
`mean W=2.0000`；成长 fixture `O=48.4159`、`ΣA=36.5824`、`mean W=2.0466`。
三项均严格提高，且相同 seed 重放相同。

## 两个统计口径已修正并验证

1. **只对实际曝光者建立新 affinity**：`settleChekiQueue` 在与 Cheki 共用的本场 O 观众样本中，按成员 Hypergeometric 重建 affinity，返回 `eligibleExposedOWithoutAffinity[memberId]`；`settleWeek` 使用这个整数作为 `Binomial` 抽样池，不再使用全体 `round(O−A_i)`。毕业过渡期 `U` 的观众虽可到场，但不自动成为新 affinity 候选，防止绕过既定重分配机制。
2. **单场留场状态按观众只抽一次**：每位到场 O 只抽一次 `stayedForCheki`，再对每名成员建立 affinity 和商品需求。多推观众对不同成员的购买使用同一个留场决定，不会同时被认定离场和留场。

新增针对性测试：`attendanceImportance=0` 且无外部观众时 `A` 不能因 Live 增长；全部成员 affinity 覆盖相同20名观众时，同一人的留场结果跨成员一致；`U` 不参与新增 affinity 候选。测试夹具不持久化观众 ID 或 Cohort。

**状态**：六项断言通过，修正后的 5/9/15 数值已写入主回归记录。中性
fixture 的 `ΣA` 从初始24仅增至约26.6–27.3，而零曝光时只衰减；D 对增长
输入保持正向响应。因此 `.05` 暂不调整。

## 运行与验收命令

```bash
npm test
npm run test:regression
npm run lint
npm run build
```

测试文件：`src/lib/runtime/regression.stress.test.ts`。测试将输出 `STRESS_D_SUMMARY`；如需保留详细输出，可运行 `npx vitest run src/lib/runtime/regression.stress.test.ts --reporter=verbose`。

**尚未进行**：真实运行结果记录、不同到场率/高价商品/时长敏感性、多推相关性、真实互动质量和成员 Condition 集成、Scenario 票务现金流。若任一测试失败，先检查队列调度/曝光口径，再决定是否调整 `TUNABLE` 参数；不应为通过测试直接提高 Cheki 购买率。
