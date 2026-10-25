# Chronicle｜idol-data-lab → Game Simulation Model Extraction v0.1

**状态**：Implementation handoff / 第一批可执行公式与模型迁移清单；2026-10-24。**不是已实现的 Runtime**，未锁定的转化/留存概率不得伪装成历史校准公式。  
**作用域**：将研究数据和设计规则转化为 Chronicle 自有的游戏状态、函数接口、结算顺序和测试，不在游戏里导入研究脚本或复制 L1/L2 推断流程。  
**与 Chronicle v0.10 的关系**：v0.10 负责剧情、时间、产品交互和序章合同；本文件负责共用 Simulation Kernel 的**当前权威模型迁移边界**。遇到旧 v0.10 对 persistent Core 的描述，以本文件引用的 Fan Market v0.2 为准；待正式合并时清除旧字段。

## 已完成的专项公式提取（2026-10-24）

- **[Key-Part Assignment & Rotation v0.1](Chronicle_Key_Part_Assignment_and_Rotation_v0.1.md)**：Chronicle 专用简化；不模拟站位加成；关键段落 first/second/third 候补，缺省 Staff 自动，兼容 9 人全员与 15 人轮换；14 项验收。优先于 Lab 的 StandingExposure 细节。


> **更新**：`idol-data-lab/main@5499e7c5355b` 已补齐八色 Palette Execution；下方旧 `SOURCE_PENDING` 仅为前次提取的历史状态。以 [Eight-Color Palette · Performance Kernel v0.2](Chronicle_Eight_Color_Palette_Performance_Kernel_v0.2.md) 的八色规则为准。仍待完成的是 EnvPalette 与 PE 的单次结合、Part Fit 等参数回归，不是八色坐标或 Opp3 公式。

- **[Eight-Color Palette · Performance Kernel v0.2](Chronicle_Eight_Color_Palette_Performance_Kernel_v0.2.md)**：八色语义轴/对向、BasePE、KeyPart Opp3、Familiarity、FinalPE→Impression倍率、八色容量/成长、L3截止过滤与14项测试；源 SHA `5499e7c5355b`。另记录 Performance Analyzer MVP 合并及数据证据边界。

- **[Member · Training · Condition · Performance Kernel v0.1](Chronicle_Member_Training_Condition_Performance_Kernel_v0.1.md)**：17 Attr、EXP、Formation Familiarity、Condition、逐曲消耗/恢复、Part/Team/Member Impression、Staff AP 约束与 12 项测试。八色 Palette 的精确公式仍为 `SOURCE_PENDING`，不把旧十色算法当最终实现。
- **[Fan Market · Cheki · Commercial Kernel v0.1](Chronicle_Fan_Cheki_Commercial_Kernel_v0.1.md)**：P/O/A_i/W_i、逐成员购买力与双档 Cheki、5 秒换粉 overhead、60 分钟基线、收入唯一性、周转化接口与 12 项测试。获客/留存概率和队列购买行为仍为 `TUNABLE`。
- **后续待提取**：八色 Palette v2.0 最新冻结数据契约、World/Operations/Staff 的完整可执行参数、L3 导出 schema 与历史回归 fixtures。专项文件优先于本总索引中简化摘要；旧 03 v0.3 的十色/Core/旧 Overall 不得复活。

## 1. 来源权威与迁移纪律

- **L1**（可核事实）→ **L2A/L2B**（证据/研究与推断）→ **L3**（特定剧本日期的游戏开档状态）→ **L4**（玩家存档、反事实世界）。只把 L3 经过校验的静态数据和 Runtime 参数带进 Chronicle；**L2 评分、销量和历史推断不应在玩家每周更新时重复施加**。
- 现实证据的 `observed / inferred / generated / manual / final`、时间截止和置信度必须保留。场馆最大容量≠上座人数；历史销量≠玩家未来保底销量。
- 当前模型权威：
  - Fan: `idol-data-lab/docs/Idol_Fan_Market_Model_v0.2.md`（2026-09-21，**覆盖** 03 v0.3 中旧 Core/BoxRate/O→C）。
  - Tier: `idol-data-lab/docs/Idol_World_Tier_Calibration_v1.0.md`（2026-09-17，覆盖旧手工 Overall）。
  - Member: `idol-data-lab/docs/member-attributes.md`、`docs/member-attribute-l2-l3-generation-guide.md`（17 Attr、L2→L3）。
  - Policy: `idol-data-lab/docs/Idol_Producer_Policy_Rules_Spec_v0.1.md`（2026-09-22）。
  - 总设计参考：`idol-data-lab/docs/Idol_GPT_03_Game_Design_v0.3.md`；**旧 persistent Core、十色色轮、旧双疲劳和已废弃隐藏属性段落不能直接照搬**。
  - Live/Condition/Staff 旧专项可作公式线索，先做当前版本冲突检查：`docs/Idol_GPT_03E_Live_Impression_System_v0.1.md`、`docs/Idol_GPT_03H_Palette_Performance_v0.1.md`、`docs/Idol_GPT_03D_Condition_Status_System_v0.1.md`、`docs/idol_producer_portable_system_spec_v2.md`。
  - **八色 Palette v2.0** 已替换旧十色；在找到其最新冻结定义、坐标与导出 schema 前，**不允许把十色权重或旧 contrast 公式当正式八色实现**。
- 规范中每个公式应标记 `LOCKED`（已定机制/参数）、`TUNABLE`（已定形式但系数待校准）、`SOURCE_PENDING`（没有可直接执行的完整定义）、`DEPRECATED`（不得实现）。下面严格区分。

## 2. 迁移模块与数据所有权

| 模块 | 持久状态（L4） | 事件输入 | 输出/唯一账本所有者 | 当前提取 |
|---|---|---|---|---|
| Member | 17 Attr(0–20)、EXP、Condition、Trait、成员 Palette/熟练度 | 训练、排练、Live、休息 | 属性和状态增量 | 部分，见§6 |
| Song/Arrangement | Song 静态信息、当前阵型/Part、Familiarity | Making、练习、换人 | 当场表演准备状态 | SOURCE_PENDING：八色 v2 |
| Performance | 不持久化重复的“现场结果”；按 Live 保存不可变 outcome | 阵容、Part、有效能力、场馆/观众 | `team_impression`、`member_impression_i`、有效曝光 | SOURCE_PENDING：完整公式 |
| Fan | **P、O、成员 A_i/W_i、临时 unassigned** | 曝光、Impression、SNS、特典会互动、毕业 | Fan 状态更新和需求期望 | 状态/商业公式 LOCKED；转化系数 TUNABLE |
| Cheki | 各成员产品/价目/slot/销售明细 | Fan demand、到场、时长/容量、合同 | **成员级实际成交、互动反馈**；Finance 只记实际现金 | 逐成员接口 LOCKED；需求/排队 TUNABLE |
| Live | 真实合同、票务、出场、到场、节目、完成标志 | Calendar、Staff、Performance/Fan | 票房/场贩（**不含 Cheki**） | Chronicle v0.10 已定合同 |
| Finance | 现金、资产、贷款、逐项 ledger | Live、Cheki、制作、工资、训练 | **唯一现金/费用 ledger** | Chronicle 已有基础 |
| Policy/Staff | Standard/Extended、决策权限、AP/排程 | Strategy、日历冲突 | 合法计划、临时工成本、阻塞/通知 | 等待完整 AP adapter |
| Tier/Brand | rolling Live/Music、group_reputation | 真实已完成活动、媒体/发行 | 月度 Live/Music/Brand/Overall | 部分公式 LOCKED，插值待校准 |

**不能跨模块重复入账**：Live 负责门票和普通场贩；Fan/Cheki 负责特典会；Music 负责实体/流媒；External Work 负责外务；Finance 负责现金 ledger。Fan demand 不是一笔收入，只有实际成交才记账。

## 3. Fan Market v0.2（本次最关键的纠错）

### 3.1 持久状态 `LOCKED`

```ts
type FanState = {
  publicCount: number; // P，团队轻度消费者/认知池；统计存量
  otakuCount: number;  // O，稳定活跃偶像消费群；跨团允许重叠
  memberAffinity: Record<MemberId, {
    affinityCount: number;      // A_i；可与其他成员重叠
    purchaseWeightKJPY: number; // W_i；千日元等价消费强度
  }>;
  temporarilyUnassignedOtaku: number; // 仅毕业/换代后的短期过渡状态
};
```

**废弃** `Core`、`C_i`、`C_team`、独立存储的 `BoxRate`、成员级 `retention_weight`、团队 Otaku 消费硬上限和“多推消费必须守恒为一份”的限制。不要迁移旧 `Public→Otaku→Core` 周更新步骤。

```text
MemberPurchasePowerKJPY_i = A_i × W_i                 [LOCKED]
GroupMemberPurchasePowerKJPY = Σ_i A_i × W_i          [LOCKED]
BoxRate_derived = (Σ_i A_i) / O                       [LOCKED, O>0]
```

`BoxRate` 是**每个 Otaku 平均关联多少名成员**，不再是独立留存加成；当 `O=0`，返回 `null`（不可定义）而不是除零。允许 `Σ A_i > O`，且 `W_i` 无个人软上限。

### 3.2 获客、留存、互动 `LOCKED 方向 / TUNABLE 系数`

```text
外部曝光(SNS/TV/CM/个人外务) → P
舞台实际表现 × 有效成员曝光 + 重复互动 → O 和 A_i
成员交流/互动体验 + 购买体验 → A_i 留存/增长、W_i 变化
```

- 跨团拼盘其他团观众先是**本团的临时 Public 曝光**，不是直接加进本团持久 `P` 或 `O`；只有实际转化后更新。
- Performance 与有效曝光是新客转化主驱动；个人特典会能力、可接触性、持续互动是成员 affinity/消费强度留存主驱动。Palette 相似度只是跨团转化修正，不能凭空产生人。
- 旧 `Otaku→Core` 改为 `O → member affinity (A_i)`，以及 `W_i` 的动态变化。**源 v0.2 没有锁定完整转化/流失的数值方程和概率常数**；Agent 不得声称它已存在或暗用旧 Core 系数。要实现可运行模型，须提交单独的 `TUNABLE` 参数表、边界条件和历史回放结果供审阅。
- 成员毕业：删除该成员 affinity 边；仍有其他成员 affinity 的 O 保留；无存活 affinity 的进入临时 `O_unassigned`，后续随重分配/流失处理。仅有汇总 `A_i` 无法精确判断多推重叠，因此实现必须补**可重复的重叠近似或轻量关系表示**；不允许假定各成员粉丝互斥。
- 新人 seed 主要来自当时 Team Tier 和实际出道曝光，数量应小；替补成员可以吸收部分 `O_unassigned`，由形象、角色、能力、互动匹配决定；不得为满足经营指标硬补粉丝。
- 周结算的概念保留，但更新项为 `P/O/A_i/W_i`，不再是 `P/O/Core`。日/场次记录 momentum、周末结算持久 fan state，**同一 momentum 不能重复消费**。

### 3.3 特典会需求、成交与收入 `LOCKED 形式 / TUNABLE 参数`

```text
ExpectedMemberPaidDemandKJPY_i
  ≈ A_i × W_i × EventFactor + PublicTrialKJPY_i

DemandKJPY_i → 依据真实价目、购买选择、成员接待时长、slot和排队
             → ActualUnits_(live, member, tier) → GrossSales
MemberShare = GrossSales × ContractCommissionRate
Retained = GrossSales − MemberShare − ActualVariableCosts
```

- `EventFactor` 表示这次机会的时长、可售 slot、重要性和可接触性，**不是**另一套按团体人气倍增的“购买文化”系数；具体数值待校准。
- `¥1,000 = 1 KJPY`，`¥2,000 = 2 KJPY`，**不能把同一个¥2,000商品计为两张¥1,000 Cheki**。
- Chronicle 序章默认佣金 **20%**；每成员每场分两档真实成交并核算各档服务时间。场次不允许特典会或成员未参加时，实际销售必须为零。
- `A_i×W_i` 是购买需求的潜在强度，**不是无条件现金收入**；需要实际到场、容量和销售模型完成转换。历史 sold-out 是需求证据，不能在运行时再作为额外销量乘数。
- 不设全团固定 Cheki 张数、人数收入乘数或“每名成员每月保证盈利”；成员通常正边际贡献是校准方向，不是 Runtime 不变量。

## 4. Tier / Brand（可直接抽取的锁定公式）

```text
overall_score = round(0.45 × live_score
                    + 0.30 × music_score
                    + 0.25 × group_reputation)        [LOCKED]
rep_next = floor(rep × 0.9875) + gains − penalties     [LOCKED]
```

- Live/Music/Brand/Overall 共用 **0–10000** 连续分；Tier 显示分段以 `Idol_World_Tier_Calibration_v1.0.md §1` 完整表为准，**不得用 tier 中点替代真实连续分**。
- Live 优先用过去12个月可归属门票总收入，其次实际平均动员和可重复性；单场场馆是支持证据，不等于 rolling Live 等级。收入特殊捆绑的团体也受动员 gate 约束。
- TIF 普通出场 `+80`，首次普通再 `+100`；主舞台/HOT `+120`，首次主舞台 `+300`；**首次就主舞台不能再叠加首次普通的100**。序章 TIF 场次实际 stage tier 由活动合同/数据决定，不能默认主舞台。
- 重大自办 Live Brand 完成奖励：`VenueBaseGain × sqrt(min(1, AttendanceRate) × min(1, PriceFactor))`。具体场馆 base gain 与公告首达 bonus 取 Tier 文档 §4.4 表，不凭剧情自动加满。
- `rep` 的结构性维护还受运营和 `P/O` 支持；**来源未锁定精确维护函数**，列 `TUNABLE`，不能只有自然衰减而完全忽略 Fan Market。
- `LiveScore`、`MusicScore` 从原始指标映射到连续分的插值与门槛需要独立 calibration fixtures；缺测不能当零。史实日期之后的资料不可倒灌序章开档。

## 5. Policy / Staff：行为与授权分离

- Policy 保留父系统 `R1 Routine Tuning`、`R2 Operational Rule`、`R3 Operating Model`、`R4 Group Policy` 的**分类语义**，但 Chronicle 覆盖其**修改权限**：R4 整个游戏固定、R2/R3 每章固定（仅剧本章节切换可变）、玩家日常仅可修改 R1。R4 不仅不自动执行，也不开放玩家编辑。
- Automation Grade 仍由 `Group Tier + 内部 Operational Staff HC` 产生，不由 Archetype 直接决定；G0–G3 影响 Staff 对**现有固定规则**的执行、通知和 R1 提议。父系统允许开档覆写 Decision Boundary 的沙盒交互**不直接继承到 Chronicle**；R2/R3/R4 的决策边界由 Scenario 配置，非玩家自由编辑。
- 背景团采用 `Standard`（少量高影响显式字段+默认填充）；玩家团采用 `Extended`（真实产品菜单、价格/时间/购买限制、具体训练/排期）。
- Cheki/talk 已有商品的互动时长调整为可编辑 R1；购买/连续上限属于本章固定 R2，长期商品菜单和基础价属于本章固定 R3。**玩家不能把 R2/R3 伪装为一次性工作流绕过章节限制**；也不能把每周定期公演的例行执行升级为每周 Blocking Producer 决议。
- Audition 完全由 Scenario Event 触发，Chronicle 不提供玩家自主发起入口；剧本规定的录取和签约选择在事件授权范围内执行。
- 详细 AP、Calendar、成员 Condition 的完整公式在旧专项/portable spec 中存在多次版本变化；需抽取一份当前无冲突公式表后才编码，不能直接照搬 03 的旧 Physical/Vocal Fatigue。

## 6. Member / Performance / Palette：第二批公式抽取范围

- **17 Attr**，每项整数 0–20：physical(agility,natural_fitness,stamina)、appearance(cute,pretty)、performance(pitch,tone,breath,rhythm,power,stage_presence)、mental(wit,humor,talking,teamwork,fashion,creativity)。
- Lab `Ability` 是汇总/校准展示指标，**不是**当场 Performance 公式：`round(5 × (0.30 singing + 0.30 dancing + 0.20 visual + 0.12 fan_engage + 0.08 media_appeal))`；雷达各轴还须调用当前属性 schema 的权重，不得拿 Ability 直接替代演唱/舞蹈 Part Fit。
- 训练、Condition、Palette、Part Impression 的最终版本须逐项核对最新 authority（尤其八色 v2.0）再提取。预定模块顺序：`Condition → EffectiveAbility → PartBaseQuality → Palette/Environment → PartImpression → Member/TeamImpression → EffectiveExposure → Fan momentum`；**这是一条接口依赖图，不是未经核对的最终公式**。
- 已废弃的 persistent Core、双 Physical/Vocal Fatigue、旧十色 `Red→...→Pink` 与已移除 hidden personality stats **不得复活**。

## 7. Runtime 数据流与结算顺序

```text
L3 opening snapshot (cutoff-aware)
  ↓
Calendar + Staff legality + contracts
  ↓
Completed Live (actual participants, songs, audience, prices)
  ↓
Performance (part/member/team impression + effective exposure)
  ├─→ Live tickets / goods → Finance ledger
  └─→ Fan event momentum (P/O/A_i/W_i)
             ├─→ Member-level Cheki demand
             │       → slot/queue/actual sales/interaction feedback
             │       → Finance ledger (gross, commission, variable costs)
             └─→ Weekly Fan resolution (acquisition, affinity, churn)
  ↓
Monthly tier/brand update + report + save
```

- 同一 `live_id` 各系统 outcome 唯一、可重放、幂等。Performance outcome 与 Cheki demand 应共享同一已完成场次事实，但不能二次扣/二次加现金。
- 每日推进不能跳过 OFFERED 未结算事件；同一天可有多个独立场次，须逐一处理；月报使用事件发生日期账本，而非从已入账的下月现金倒推。
- Live 票房与 Cheki 结算分别入账；**免费商场 Live 现金收入零**；One-man、TIF 使用其合同，不直接套普通拼盘分账。

## 8. Agent 分阶段交付和验收

1. **Authority audit**：列出最新 Palette v2.0、Condition、Performance、Staff 的冻结来源及字段版本；记录冲突/缺失；为每个方程标 `LOCKED/TUNABLE/SOURCE_PENDING`。
2. **Fan v0.2 adapter**：引入 P/O/A/W、重叠/临时未分配、成员级 demand；彻底删除 persistent Core 代码/测试断言。为转化/留存/购买行为创建可配置、可解释的 `TUNABLE` 参数表和可重复 seeded RNG。
3. **Performance + Condition**：逐 Part 实现当前八色审美与有效曝光；只输出当前场次真实 outcome，隐藏内部值于 UI。
4. **Staff + Calendar**：AP、合法出勤、场次阻塞、多场同日、费用；周/月结算不可漏项。
5. **Tier + Finance**：rolling 12m、连续分、Brand 事件及维护、唯一现金账本。
6. **Full regression**：3/5/9/15 人路线、2013-01→2014-08 TIF；保存每月 P/O、每成员 A/W、成员级两档销量、票房/成本、最低现金、月度 Tier；固定 seed 便于复现，换 seed 检查统计范围。**旧 v0.6 现金结果和旧 Core 不能作 expected snapshots**。

**需显式留空并回审的公式**：P→O 概率、O/成员 affinity 的转化与流失、W_i 更新、multi-oshi overlap、EventFactor、PublicTrial、Cheki 排队/消费选择、Brand 结构维护、Live/Music 连续插值、八色 Palette/Impression 最新计算。缺少这些不等于可以拿旧模型或常数销量代替。
