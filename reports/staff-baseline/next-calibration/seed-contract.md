# B 路线创始粉丝 Seed 契约（S1）

运行版本：`staff-autoplay-scenario-v4-founder-fan-seed`  
Fan balance：`fanChekiBalanceV1`（本阶段未改）

## 已落地的持久状态

| 项目 | 值 | 来源 / 状态 |
| --- | ---: | --- |
| 团队 `O` | 30 | v0.9 §17.1 的创始团队 Otaku；作为不重复团队数只写入一次 |
| 莉奈 `A` | 20 | 同一历史参考；成员 affinity 映射 |
| 優花 `A` | 10 | 同一历史参考；成员 affinity 映射 |
| 陽菜及首轮新人 `A` | 0 | 没有已批准的既有支持者来源 |
| 团队 `P` | 0 | 300 / 150 只是未去重的认知参考；v0.10 未给团队 P 去重规则，因此不把约 450 当作事实 |
| 莉奈 / 優花 `W` | 1.8 KJPY | `TUNABLE`，显式采用 `fanChekiBalanceV1.defaultNewAffinityW`；不是历史消费记录 |
| 其他成员 `W` | 0 | 无 affinity 即无持久购买意愿 |

不保存 Core、粉丝个体或第二份创始 cohort。`signRoster` 现在扩展已有 `FanState.members`，不再调用 `createFanState` 清零 P/O/A/W；A、B、C 三路线均从相同三名创始成员资产开始。C 的 10 月六名新人仅获得零值 profile。

## 边界与后续产品决定

- 若要引入 `P≈450`，必须先批准对莉奈 300 / 優花 150 的去重假设、重叠率区间和 Scenario 来源；当前实现刻意不猜测。
- `W=1.8` 仅是可复现的基线。后续可在**不改转化概率**的独立敏感性试验中测试 W，但不能将其描述为创始粉丝的已知消费金额。
- 创始 `O` 不因签下六名新人增加；毕业仍走 `graduateMemberFanAffinity` 的 U 转移，绝不重复扣团队 O。
