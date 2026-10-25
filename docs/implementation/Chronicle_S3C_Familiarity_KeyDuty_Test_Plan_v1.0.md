# Chronicle S3-C：Familiarity / Key Duty Runtime 测试计划 v1.0

**状态**：Work Agent 执行计划；本文件不表示 S3-C 已实现、已校准或通过回归。  
**适用范围**：序章 B（九人、Staff 默认建议），2013-01-07 JST 至 2014-08-02 TIF；A/C 仅作变更后的防回归对照。  
**前置基线**：`374a66c` / `staff-autoplay-scenario-v4-founder-fan-seed`，创始 `O=30` 与 A/W seed 已在正式 Scenario 路径持久化。  
**报告目录**：`reports/staff-baseline/s3c/`。

## 1. 权威性与冻结项

按 `docs/implementation/README.md` 读取顺序执行：

1. `Chronicle_Policy_Scenario_Workflows_v1.0.md`；
2. `Chronicle_Member_Training_Condition_v1.0.md`（尤其 §2 Attribute EXP、§3 Arrangement Familiarity、§4 Condition）；
3. `Chronicle_Technical_Performance_Kernel_v1.0.md`；
4. `Chronicle_Performance_Palette_Assignment_v1.0.md`（尤其实际 Lineup、Key Part 1/2/3 候补、Key Contrast）；
5. `Chronicle_Fan_Cheki_Finance_v1.0.md`；
6. `docs/design/Chronicle_Game_Design_v0.10.md`（日期、毕业剧情、合同）。

本轮**不得**：

- 实现个人 `Duty Preparation (D)`，或把 Familiarity 伪装成个人 D；
- 修改 Fan 转化率、P/O/A/W 结构、Cheki 参数、Finance/合同参数、评分阈值，或添加额外 Performance 奖励；
- 增加 Center/Front/Standing/Formation 位置乘数、持久 Core、双疲劳条，或让未进入 Lineup 的成员获得当场担当/舞台成长；
- 通过固定收入、固定粉丝、固定等级、降低 C 阈值来改变结论。

未冻结的安排初始 F、改编时 F 损失曲线、Env×PE 数值桥接与 Part/Arrangement 的精确数值，必须以具名 `TUNABLE` 配置记录；无法获得 Scenario 来源时保留 `NOT_IMPLEMENTED`，不能猜成锁定历史事实。

## 2. 当前缺口与目标

当前 `resolveOperatingPerformance()` 在 staff autoplay 适配中传入空 `keyParts`，没有持久 arrangement/version Familiarity，也没有每场 immutable resolved duty。S3-C 只补足这条 Runtime 数据流：

```text
active song + arrangementVersion
  → weekly F maintenance / actual rehearsal and stage exposure
  → first / second / third / Staff key-duty resolution
  → actual resolved duties stored on completed Live
  → Key Contrast receives actual duty palette and arrangement F
  → normal Performance → existing Fan / Cheki / Finance path
```

Familiarity 是**歌曲编排版本**状态而非歌曲全局值；关键段担当是实际 Live 结果而非站位。个人 D 不在该图中。

## 3. 最小持久契约

实现前先为下列状态建立有版本、可序列化的 Runtime 类型；实际字段可命名调整，但语义不得省略：

```ts
type ArrangementFamiliarity = {
  songId: string;
  arrangementVersion: string;
  familiarity: number; // [0,100]
  performedPreviousWeek: boolean;
  rehearsalHoursThisWeek: number;
  stageHoursThisWeek: number;
};

type ResolvedKeyDuty = {
  keyPartId: string;
  partType: KeyPartType;
  memberId: string;
  source: "first" | "second" | "third" | "staff";
  arrangementVersion: string;
  familiarityAtResolution: number;
};
```

- 同一 `(songId, arrangementVersion)` 只维护一份 F；同一实际排练/舞台小时可同时按规范进入 Attribute EXP 与 F，但**不得**对 F 重复记两次。
- 每个 key duty 至多一名 resolved member；first/second/third 是顺序候补，不能同时出演。候补缺席、离队、不在实际 Lineup 或不合法时跳至下一个；全空才由 Staff 在**现有实际 Lineup**内选择。
- 完成的 `liveId` 必须保存 `arrangementVersion`、实际 Lineup、resolved duties、F 快照或可重放的同等证据。重放/读档绝不重新选择 duty、重复加 F/EXP、扣 Condition 或产生财务/fan delta。

## 4. Familiarity 结算与测试

严格按 Member v1.0 §3：每周先结算 `DecayDebt=0.02×F_previous`，上周实际演出时减半；再使用实际 song rehearsal + stage song hours，先维护、再增长。测试以 0.5h slot 运行，并覆盖：

| ID | 场景 | 必须断言 |
| --- | --- | --- |
| F01 | 新 arrangement | F 仅由具名 Scenario 初值创建；不能从旧版本自动满继承 |
| F02 | 无排练、无演出的一周 | 仅产生 decay debt 的 F 下降 |
| F03 | 上周实际演出 | 下周 decay debt 恰为未演出同 F 的一半 |
| F04 | 维护不足 | Exposure 先抵 debt，剩余为 0 时不得增长 |
| F05 | 维护后有剩余 exposure | 使用 `FamiliarityGrowthFactor`、`FamiliarityAttrFactor` 增长并 clamp [0,100] |
| F06 | 同一 1h rehearsal | F 的 exposure 只计一次；Attribute EXP 的 0.5 SourceFactor 独立但不得二次 F 增长 |
| F07 | 实际舞台时间 | 只给实际演出的 song/version；待机、移动、Cheki 不产生 F |
| F08 | 重放/保存载入 | F、训练小时、EXP、Condition、ledger 字节级/业务等价稳定 |

若 `TeamCoreAttrAvg` 的完整输入尚未连接，测试必须显式传入有来源的 Fixture，正式 Staff 路径则标出 `TUNABLE` Scenario/adapter 值，不得借用 Ability 总分。

## 5. Key Duty Resolver 与 Performance 测试

对每种合法 key part（Opening Sabi、1/2 Sabi、Bridge、Ochi、Last Sabi）测试 resolver；普通 1A/1B/2A/2B 即使 solo 也不可创建 key bonus。

| ID | 场景 | 必须断言 |
| --- | --- | --- |
| K01 | first 可用 | 选 first，并存 `source=first` |
| K02 | first 缺席/不在 lineup | 选 second，second 使用自己的 palette/技术/实际 F |
| K03 | first、second 均不可用 | 选 third |
| K04 | 全候补不可用或为空 | Staff 仅从 lineup 中决定并存 `source=staff` |
| K05 | 显式玩家顺序 | 自动评分不得改写用户指定顺序 |
| K06 | 9 人 B 普通 Live | 九人均在 lineup；assignment 不引入第十人或常规轮换 |
| K07 | 15 人 A 轮换 | 未入选成员不可 resolve duty、获得该 duty 的 stage/F/EXP |
| K08 | Key Contrast | duty 的真实 palette 与 F 进入 `finalPaletteExecution`；总 key bonus ≤12，非 key part 为 0 |
| K09 | Replay | 同 liveId 使用已存 resolved duties，不能重新抽 Staff 候补或重复结算 |

不得擅自创造额外 key part、额外演出时长或独立 Performance bonus。唯一允许的变化是已有 LOCKED Key Contrast/Familiarity 链接获得真实输入。

## 6. 莉奈毕业后的重编排

2014-05-11 的毕业 Live 完成后，按 v0.10：

1. 莉奈退出 active、后续 lineup、Cheki 与 duty 候补；
2. 受影响歌曲必须产生新 `arrangementVersion`，旧版本 F 保留历史记录且不可被新版本当作 100% F；
3. 新版本的初始 F / 继承比例没有 LOCKED 数值时，必须用一个具名 Scenario TUNABLE，记录来源、before/after 与敏感性；
4. Staff 在毕业后的真实可用训练 slot 安排重新排练，随后 Live 才能使用新版本 F；
5. 5/11 前已完成 Live immutable，不得被重写；5/11 后莉奈绝不出现在 lineup/resolved duty/EXP/interaction。

至少覆盖：无后继排练、最小合法排练、首场后继 regular、重放毕业周、毕业后 TIF 五个案例。

## 7. 结算守恒与财务不变量

每个 S3-C fixture 和 B 回归均需检查：

- training/stage hours 分别按 `memberId/songId/arrangementVersion/liveId` 幂等；
- 单一 Condition 只按已有活动链改变，F/duty 不另建 fatigue 或恢复；
- Attribute EXP、Palette exposure、F 各有独立可追溯来源；同一小时不会在同一出口重复；
- Fan 事件 momentum、Cheki 成交与 Finance ledger 的 event idempotency 不因 F/duty adapter 改变；
- 开收现金 + posted receipts − posted outlays ± loans = 关账现金；免费商场/未完成 Live 不生成收费收入；
- 旧 `liveId` 再提交不会重复写 completed outcome、F/EXP/Condition、Fan 或财务。

## 8. S3-A / S3-B / S3-C 对照与回归

三组使用相同 B 开局、默认 Staff、contracts、seed 集合、Fan/Finance/grade 配置：

| 组别 | 内容 | 用途 |
| --- | --- | --- |
| S3-A | 当前 v4 基线；无持久 F、无 key-duty adapter | 比较基准，只读重放 |
| S3-B | 仅持久 Familiarity、实际训练/舞台小时与周结算；key duty 仍为空 | 隔离 F 数据流影响 |
| S3-C | S3-B + 实际 key-duty resolver + 毕业后重编排 | 完整目标实现 |

1. 先固定 seed 1 逐日/逐 Live 运行并保存差异账；首个错误必须记录 date/liveId/song/version/duty/member/ledgerId。
2. 每组 B 跑 seeds `1..20`；S3-C 稳定后每组 B 跑 `1..100`。不以 20-seed 代替 100-seed。
3. S3-C 后运行 A/C 各 `1..20`，确认创始 seed、新人、轮换与毕业边界未回归。
4. 同 seed 同版本须确定；跨组只允许由 F/duty 真实输入导致 Performance 以及下游既有 Fan/Cheki 结果变化，报告不得把相关性写成新增 Fan/Finance 参数。

记录：event Performance（均值/分位/每场）、Final PE/key bonus/F、resolved duty source 分布、每成员真实训练/舞台小时、Condition min/mean、期末 P/O/A/W、Cheki gross、期末/最低现金、Fans/Performance/Business/Overall 等级分布、TIF 完成/债务状态。

## 9. 交付、验收与停止条件

提交到 `reports/staff-baseline/s3c/`：

- `baseline-s3a.json`、`s3b-20seed.csv`、`s3c-20seed.csv`、`s3c-100seed.csv`；
- `familiarity-weekly-ledger.csv`、`resolved-key-duties.csv`、`rina-graduation-rearrangement.md`；
- `performance-before-after.md`、`invariants.md`、`failure-cases.md`；
- 可重复执行的生成命令与 Scenario/tuning/config SHA。

运行 `npm test`、`npm run lint`、`npm run build`，以及专用 S3-C 测试/报告命令。只有在 F、duty、毕业、幂等和 100-seed 均有真实运行证据后，才可声明 S3-C 完成。若缺 Scenario 初值/改编继承参数或合同数据，则停止在对应 `NOT_IMPLEMENTED` 边界并报告，不通过猜数推进实现。
