# Fan × Cheki B/C/D Stress Regression — 2026-10-24

**Status: TEST FIXTURES COMMITTED / EXECUTION PENDING.** 这是继 [Fan_Cheki_Regression_2026-10-24.md](Fan_Cheki_Regression_2026-10-24.md) 之后的第二轮测试定义。仓库已有确定性测试源码，但本次 GitHub 文件编辑会话**未执行**本地 npm、Vitest、ESLint 或 build；**不提供虚构通过结果或数值均值**。待本地运行并附带输出后才可将结果标为 VERIFIED。

## 保留中性基线

原 5/9/15 人、12 周×20 seeds、`pExistingOtakuToAffinity=.05` 的结果不变；没有修改 `fanChekiBalanceV1`、FanState 持久字段、Cheki 商品时长/成本或正式 Scenario。新测试专门给 regression harness 增加可选的 `GrowthFixtureOptions`（默认无影响）。

## B. 热门成员容量压力

**测试输入（不是剧本数据）**：`O=300,A_star=240,W_star=15`、本场 `attendeeOtaku=250`、单成员开放60分钟、固定 seed `B:hot-member:1`。

**验收**：`requestedJPY>grossJPY`、`queueLostJPY>0`、`completedUnits<requestedUnits`、服务结束时间全部≤3600秒、同 seed 完全重放。没有将未成交请求写为收入。

**待记录**：请求/成交/损失（JPY），唯一购买者数，等待时间分布，服务容量饱和率，`queueLost` 中超时与耐心放弃的拆分（现有返回结构尚未拆分）。

## C. 多推共享时间

**测试输入**：`O=300`、5位成员各 `A_i=120,W_i=2`、`ΣA=600>O`、本场 `attendeeOtaku=150`、固定 seed `C:multi-oshi:1`。

**验收**：同一临时观众能够在同场完成多名成员购买；每名观众的服务时间区间**两两不重叠**；每成员 `grossJPY≤requestedJPY`；同 seed 完全重放。临时观众和 trace 只在测试回调中保存，不进入长期 FanState。

**解释边界**：当前每成员 Hypergeometric 之后独立抽样临时观众 ID，重叠只是无 Cohort 的统计近似。该测试验证可重复的多推与时间守恒，**不验证真实市场中成员之间的相关性**。

## D. 成长与互动响应

**测试输入**：9人、12周×20 seeds；与中性基线使用相同初始 Fan 和 seed。成长场景单独传入 `liveQualityFactor=1.5`、`interactionQualityBonus=0.5`、`externalWatchingAudience=120`，中性场景保持原默认 `1/0/30`。

**验收**：成长场景第12周的平均 `O`、`ΣA`、`W` **分别高于**中性场景；同 seed 完全重放。

**重要限制**：`liveQualityFactor` 和 `interactionQualityBonus` 是 **regression-only 注入值**，用于验证单调响应；**尚未接入**真实 Performance Impression 或真实 FanEngage 输出。不能把通过此测试描述成完成 Live/Palette/Training/Staff 的端到端集成。正式游戏仍需把真实事件结果映射到这些接口或等价生产接口。

## 运行与验收命令

```bash
npm test
npm run test:regression
npm run lint
npm run build
```

测试文件：`src/lib/runtime/regression.stress.test.ts`。测试将输出 `STRESS_D_SUMMARY`；如需保留详细输出，可运行 `npx vitest run src/lib/runtime/regression.stress.test.ts --reporter=verbose`。

**尚未进行**：真实运行结果记录、不同到场率/高价商品/时长敏感性、多推相关性、真实互动质量和成员 Condition 集成、Scenario 票务现金流。若任一测试失败，先检查队列调度/曝光口径，再决定是否调整 `TUNABLE` 参数；不应为通过测试直接提高 Cheki 购买率。
