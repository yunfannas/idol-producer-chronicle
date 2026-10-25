# Chronicle｜Policy、Scenario 与 Producer 操作权限 v1.0

**本地实施权威 · 2026-10-24**。下方包含 R1–R4 分类、自动化矩阵、Standard/Extended Schema 和 Live/Fan 运营规则。**重要：Chronicle 权限覆盖父模拟系统的开放式编辑权限；以本文件“Chronicle 权限”优先。**实现无需查阅外部文档。

## 1. Chronicle 权限（LOCKED）

| Level | Chronicle 可编辑性 | 何时可变 | 运行时约束 |
|---|---|---|---|
| R4 Group Policy | **不可编辑** | 整个 Chronicle 固定，是剧本背景 | 不因 Tier/Staff/成就解锁；UI read-only |
| R3 Operating Model | **不可自由编辑** | 仅 Scenario 在章节切换时显式更新 | 章节内固定；如商品菜单/基础价格、Travel Acceptance、SNS model |
| R2 Operational Rule | **不可自由编辑** | 仅 Scenario 在章节切换时显式更新 | 章节内固定；如购买上限、常规 Live 准备、远征返回规则 |
| R1 Routine Tuning | **允许调整/委托** | 章节内短期可逆微调 | 如特典会互动时间、queue threshold、late-return cutoff；遵守本章硬约束 |

- R2/R3 的“章节固定”不意味着每章**必须**变化；没有 Scenario 指令就沿用当前值。
- `DecisionBoundary` 是“谁处理 recurring decision”，`PolicyRule` 是“如何处理”；Chronicle 的 R2/R3/R4 边界由 Scenario 配置，玩家不可在开局自由覆写。Staff Automation Grade 只影响提议/执行/通知，**不能覆盖不可编辑级别**。
- 开局的训练方针是 Scenario 提供的**一次性 Workflow Choice**，并非开放长期 R2/R3 编辑器；玩家不需每周重设。
- Team Positioning 是固定背景 Policy、已制作曲库、成员和市场实际发展共同呈现的状态；不设置“王道→Cool”自由滑块。
- 成员个人重要决定、制作/发行、重大 Live 预算和 Setlist 是**一次性 Workflow Decision**，不算 Policy 修改。此类选择仍受 Scenario 允许范围约束。

## 2. Audition 只由剧本触发（LOCKED）

- **全章节禁止玩家主动发起 Audition**；不提供自由招募按钮、自由决定候选池、自由生成补员事件。
- 2013-01-07 序章强制 15 人面试，额外 6 AP 提问，录取在本次剧本许可人数/条件内选择。
- 2013-10 小团（3–7 人）按剧本条件可触发第二次公司甄选；8–10/11–18 人团不触发该剧情；不能复活旧候选池。
- 后续章节甄选/转入/补员均只能由对应 Scenario Event 发生，玩家在事件给出的候选人、合同和录取范围内决策。
- 关键人事（毕业/续约/Leader）亦是剧本允许的 Workflow，成员有独立意志；不允许靠高关系数值无限阻止固定毕业。

## 3. 日常操作与决策触发

| 操作 | 产生时点 | 玩家 | Staff |
|---|---|---|---|
| 普通 Live | Calendar/合同、既定 R2/R3 | 无须逐场批准 | 自动合法排期、Lineup、Cheki、结算 |
| 少数小型商演/特别邀请 | Scenario Offer | 接受/拒绝（受事件范围限制） | 成本/冲突/可用性检查 |
| Training | 开局/章节设定 | 在剧本选项内决定一次；之后少动 | 按既定 intensity、维护/成长优先级自动排课 |
| 新曲 | 章节允许的制作窗口/预算/资源（不要求必须有 Audition 式事件） | 选择授权的制作方向、关键段落 first/second/third（可留空） | 普通 part 编排、排练 |
| Setlist | **每场必须最终确定** | 可编辑、使用自动推荐/模板 | 普通场自动推荐/复用、合法轮换和替补；重要场按剧情需确认 |
| Cheki | 每场有许可时 | 可做 R1 微调；不能自由修改章节商品/限购/基础价 | 时长/排队/真实销售、交流反馈 |
| 成员日常关系 | 日常 | 一般无须逐人维护 | 自动处理普通沟通、状态反馈 |
| 重要个人决定 | 事件/面谈 | 剧本授权范围内慎重决定 | 提供意见和可观察事实 |
| Major Live | 章节允许的主动策划或里程碑/授权项目 | 场馆/预算/概念等允许选项 | 合同、执行、宣传、Staff |
| Finance | 超预算/融资/重大项目 | 决定授权范围内的投入 | 工资/日常费用/账本自动 |
| Policy | R1 短期微调 | 可选或委托 | 自动建议/执行合法 R1 |
| Audition | **仅剧本** | 参与限定面试/录取 | 组织事件、合同手续 |

- Live Report、Weekly Review、普通训练与已批准的周三定期不 Blocking；关键合同、超预算、硬性冲突、剧情人事才 Blocking。
- 允许连续推进最多 7 天或下个重要节点；不得越过待处理 OFFERED 事件；同日多场各有独立 live_id。
- 3–10 人团常规全员出演；11–18 人团遵循本章固定轮换 Policy；Key-Part duty 第一/二/三候补独立于 Lineup，缺省 Staff 自动。
- 页面是信息空间，会议是决策空间；Staff 提案是基于模拟状态的可选决策，不用固定周会/月会制造操作。

## 4. 分类与 Staff 自动化参数（历史矩阵只供参考）

> **Chronicle override（优先于下方历史矩阵）**：Staff `automationGrade` 由每章 Scenario 提供，或根据本章 Staff 能力/规模生成，不从完整 Group Tier 推导；不需要世界团体评级库。历史的 `Tier × Operational Staff HC` 矩阵不是 Chronicle 的必实现要求。即使 G3 也不能解锁 R2/R3/R4 的玩家编辑。

## 2. R1–R4

| Level | 名称 | 定义 | 典型例子 |
| --- | --- | --- | --- |
| R1 | Routine Tuning | 小幅、短期、可逆参数微调 | cheki/talk 时长、queue threshold、late-return cutoff |
| R2 | Operational Rule | 稳定重复执行的日常规则 | purchase limit、ordinary-live prep、post-show travel rule |
| R3 | Operating Model | 改变一类工作的基本运行方式 | fan-service menu/pricebook、travel acceptance、SNS model、publishing cadence |
| R4 | Group Policy | 长期组织哲学或结构性边界 | Activity Region、Live Strategy、Member Autonomy |

R4 永远不 `AUTO_EXECUTE`。

## 3. Automation Grade

默认 automation 只由 **Group Tier + Operational Staff HC** 生成。Archetype 只生成 policy value 的默认倾向，不生成 automation grade。

| Grade | R1 | R2 | R3 | R4 |
| --- | --- | --- | --- | --- |
| G0 | AUTO_PROPOSE | NOTIFY_ONLY | NOTIFY_ONLY | NOTIFY_ONLY |
| G1 | AUTO_EXECUTE | AUTO_PROPOSE | NOTIFY_ONLY | NOTIFY_ONLY |
| G2 | AUTO_EXECUTE | AUTO_EXECUTE | AUTO_PROPOSE | NOTIFY_ONLY |
| G3 | AUTO_EXECUTE | AUTO_EXECUTE | AUTO_PROPOSE | AUTO_PROPOSE |

| Tier / Operational Staff HC | 1 | 2–3 | 4–6 | 7+ |
| --- | --- | --- | --- | --- |
| E | G0 | G1 | G1 | G2 |
| D | G0 | G1 | G2 | G2 |
| C | G1 | G1 | G2 | G3 |
| B | G1 | G2 | G2 | G3 |
| A | G1 | G2 | G3 | G3 |
| S | G2 | G2 | G3 | G3 |

Operational Staff HC 只计算长期参与 recurring operations 的内部 staff；外部 creator、venue staff、一次性 contractor 不计入。

**Chronicle override：** 开档或章节接手时只展示已锁定的 Decision Boundaries 供阅读；不可由玩家覆写 R2/R3/R4。

## 4. Standard vs Extended

世界模拟使用 **Standard**；Producer 当前管理团 / Playable / focused group 使用 **Extended**。

Standard 不是“完整 policy 的缩小版”，而是：

> 影响大、容易采集的显式差异 + common filling + sparse overrides。

背景团不逐团实例化 Training / Member Career 等通常中性的细项；没有强证据时使用 common default。

### 4.1 Standard schema

| Domain | Field | Standard representation |
| --- | --- | --- |
| Live | `live_activity_model` | Selective / Balanced / High-frequency；表达全体 live 密度 |
| Live | `travel_acceptance` | Low / Moderate / High；用于 Activity Region 内 away invite |
| Live | `activity_region` | LOCAL / SELECTIVE / NATION / CONTINENT / WORLD |
| Live | `live_strategy` | Prestige-first / Balanced / Volume-driven |
| Live | `hosted_event_cadence` | annual equivalent count；只算主催、冠名拼盘、定期公演等，**不含 major live**；2-man/shared-host 按比例 |
| Live | `major_live_cadence` | annual count；大型自办 live，和 hosted 不重叠 |
| Fan | `post_live_product` | NONE 或一项 AVG_PRODUCT(price,time,units,frequency) |
| Fan | `standalone_offline_product` | NONE 或一项 AVG_PRODUCT(...) |
| Fan | `online_product` | NONE 或一项 AVG_PRODUCT(...) |
| Fan | `own_fc` | NONE / GROUP / MEMBER_SELECTABLE |
| Fan | `own_fc_member_addon` | 0 / amount |
| Fan | `union_fc` | NONE / union id |
| Publishing | `physical_route` | NONE / SMALL / MAJOR |
| Publishing | `physical_cadence` | bucket |
| Publishing | `digital_song_cadence` | bucket |
| Other | sparse overrides | public communication / brand / member-career / training only when clearly non-default |

### 4.2 Publishing buckets

Physical：

| Bucket | Rate |
| --- | --- |
| 基本不发 | <0.5 / year |
| 平均一年多一次 | 0.5–0.9 |
| 不到一年一次 | 1.0–1.5 |
| 一年两次 | 1.6–2.4 |
| 一年三次 | 2.5–3.4 |
| 一年四次 | 3.5–4.4 |
| 一年五次+ | 4.5+ |

Digital song：

| Bucket | Songs/year |
| --- | --- |
| 基本不发 | 0–1 |
| 低频 | 2–3 |
| 每2–3个月 | 4–6 |
| 每1–2个月 | 7–11 |
| 约每月 | 12–17 |
| 高频 | 18–23 |
| 每月2首+ | 24+ |

CD online signing 是 CD/release campaign，不属于 Fan Interaction。

## 5. Fan Interaction：Extended

Extended 保存真实 menu；Standard 只保留三个 channel 的平均项。

| Channel | Extended content | Standard projection |
| --- | --- | --- |
| Post-live tokuten | multi-select cheki/talk items + per-item base price/unit/time | `post_live_product` |
| Standalone offline | photo/video/handshake/talk 等 + per-item price/unit/time | `standalone_offline_product` |
| Online talk | timed 1-on-1 / slot bundle 等 | `online_product` |
| Fan Club | whole-group or member-selectable；member designation 可免费或额外收费 | own FC fields |
| Union FC | union 提供的 FC | `union_fc` |

Persistent service item 的增删、base price 或 purchase-unit mechanics 属于 R3；已存在商品的 interaction time 属于 R1；purchase/consecutive limit 属于 R2。

## 6. Live policy

`live_activity_model` 表达**所有 live** 的活动密度。

`hosted_event_cadence` 只表达除了普通邀请制 taiban/festival 之外的自办能力：

- 主催
- 冠名拼盘
- 定期公演
- 其他明确由本团主导的常规活动
- 2-man/shared-host 按比例

它**不含** major live。

`major_live_cadence` 单独统计大型自办 live。

Post-show travel rule 属于 R2：

- `RETURN_TO_BASE_FIRST`
- `STAY_LOCAL_IF_LATE`
- `STAY_LOCAL_PREFERRED`

Travel Acceptance 属于 R3；Activity Region 属于 R4。Routine live invite 先检查 Region + Travel Acceptance + schedule/recovery/budget，再进入 Decision Boundary。


## 5. 自动化验证

- R4/R3/R2 UI 和 API 拒绝玩家直接修改；Staff 无论 G0–G3 均不能绕过；只有带 Scenario Event ID 的章际迁移可更新 R2/R3，R4 永不更新。
- R1 修改须保存授权主体、有效期/回退、值范围；R1 不可改名伪装为商品基础价格或购买上限。
- 9 人团无常规选拔；15 人团 Staff 按章节 Policy 自动轮换；Audition 按剧本触发且无法手工创建。
- 常规 Live 自动 Setlist/合法演出，玩家可以预览/调整；每场仍保存唯一最终曲序和 resolved assignments。
