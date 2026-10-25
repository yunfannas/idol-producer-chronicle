# S4 Business 与评级审计（无调参）

审计使用 S1 后 B seed 1 的完整 Finance ledger，逐月聚合在 `business-by-month.csv`；逐场门票、Cheki、场租和现金后余额在既有 event ledger 及本轮 `seed-1-fan-flow.json` 中可重放。

- 开收现金为 ¥3,000,000；seed 1 期末为 ¥414,900，最低 ¥290,550。唯一账本恒等式仍为：开收现金 + operating revenue − operating cost − capitalized assets + loans = 期末现金。
- 创始 affinity 的实际 Queue 成交为 ¥103,000 gross（成员分成、变量成本由 `resolveLive`/Finance 的幂等 ledger 结算），不是固定补贴。
- 5/24 出道和 9/29 商场的收费收入保持 ¥0；它们未被当成商业营收。普通拼盘按已有合同公式记票房，常规/One-man 按 Scenario 合同入账。
- B 100 seeds 的期末现金均值为 ¥404,603.50，仍低于当前 Business C 阈值 ¥2,000,000，Business C-or-better 为 0/100。阈值未改。

当前合同中的容量、售罄率、票价、场租和外部观看样本依旧是已命名的 `TUNABLE` Scenario 输入。没有获得进一步批准的逐合同商业数据，因此本阶段不以调租金、虚构商演或降低评级阈值来“修复” Business；下一轮必须先补 Scenario 合同来源再做单变量商业校准。
