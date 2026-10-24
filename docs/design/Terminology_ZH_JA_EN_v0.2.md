# Idol Producer: Chronicle｜中日英术语规范 v0.2

**日期**：2026-10-24　**性质**：本地化与字段语义约定（非新增玩法／公式）。

## 一、最重要的术语边界：Public ≠ 新规

- **Public / 認知 / 公众认知**：**团队级注意力／认知人群层**。可能只是看过视频、听说过成员，既没有来过现场，也不一定有明确支持意愿；这是后台三层漏斗的状态之一。
- **新規 / 新规 / Newcomer**：**一次互动里的首次身份**，不是粉丝层级。需要说明『首次接触／首次到场／首次特典会』，否则没有足够信息判断具体哪一种。
- **实际交叉关系**：第一次来现场的观众可能已在网上关注很久；已有 Otaku 也可能第一次购买 Cheki；拼盘的他团观众临时按 Public 参与本团转化计算，并不等于他们此前不知道偶像文化。
- **Core** 按 Game Design v0.3 必须绑定一个 oshimen；**Otaku** 可以具有箱推或成员倾向；**Personal Public** 不是 Otaku/Core，也不会自动计入团队粉丝数。
- **界面规则**：没有票务识别或成员明确转述时，不应显示可核实的『新规 N 人』；可以显示估算的 Public 曝光，但应明示为估计值。后台 Public→Otaku→Core 的概率转化不等于观察到个体身份。

### 三维交叉示例

| 场景 | Public / Otaku / Core（后台层） | 新规标签（事件层） | 能否确证 |
|---|---|---|---|
| 看过官方 YouTube，第一次买票来看 Live | 可能仍属 Public，也可能已有 Otaku 兴趣 | 首次到场 | 若有票务历史记录可确认 |
| 三个月常看 Live，第一次排 Cheki | 通常 Otaku（但需按模型结算） | 首次特典会 | 有交易记录才确认 |
| 支持其他团多年的拼盘观众第一次看本团 | 结算时临时 Public | 对本团首次接触 | 无访谈时通常不确定 |
| 已有固定推し，每周买 Cheki | Core | 非新规 | 只能确认交易行为，隐藏 Core 分类 |

## 二、三层用语：内部字段、UI 标签、成员说话

**内部字段永远不改名**：`public` / `otaku` / `core`，中文与日文 UI 不直接使用研究报告式的「〜層」。

| 内部概念 | 简体中文 UI | 日本語 UI | English UI | 成员对话自然用词 |
|---|---|---|---|---|
| Public | 认知 | 認知 | Awareness | 「知ってくれる人」「見てくれた人」 |
| Otaku（不含 Core） | 普通粉丝 | ファン | Fans | 「ファンの人」「来てくれる人」 |
| Core | 核心粉丝 | コア | Core | 「常連さん」「いつもの人」「応援してくれる人」 |
| Otaku + Core | 稳定粉丝合计 | ファン合計 | Total Fans | 「ファンのみんな」 |
| 新規（事件标签） | 新规 | 新規 | Newcomer | 「初めて来てくれた人」等，依语境说 |
| 本团现场动员 | 动员 | 動員 | Attendance | 「今日来てくれたお客さん」 |

**统计口径非常重要**：当 UI 同时列出「ファン」和「コア」两栏时，`ファン` **只表示 Otaku，不包含 Core**，两栏不能重复计数；如果单独说日常语言中的「ファンのみんな」，可以包含两者，但不能拿来标注 Otaku 的统计数字。合计栏必须明确写作「ファン合計」= Otaku + Core。

日语人物台词中避免「一般認知層」「コアファン層」「オタク層」「転換率」等研究／系统术语。角色只描述可观察的到场、交流、应援及自身感受；Staff 财务或经营报告才可用较正式的短标签。

**数值可见性**：简短标签并不授权前台展示隐藏的粉丝精确规模；在系统调试、设计工具或明确允许公开的统计面板使用，玩家周报以实际销售／动员和谨慎趋势表达。

### 三语示例

- 中文经营摘要：「最近来场人数有所增加。特典会也有更多熟面孔。」
- 日语经营摘要：「最近は動員が少しずつ伸びています。特典会でも常連の方が増えてきました。」
- 英文经营摘要：“Attendance has been growing gradually, and we're seeing more familiar faces at meet-and-greets.”
- 日语成员发言：「今日は初めて来てくれた人もいたよ。次も来てくれたら嬉しいな。」（**不保证其转化为 Otaku 或 Core**）

## 三、正式术语表

本表的 `key` 采用稳定英文标识；日本语／中文是 UI 建议写法，数据结构保留引擎既有字段名。个别中文与日文并非严格逐字互译，优先考虑真实现场语境。`source` 标明引用 Game Design v0.3、Chronicle v0.7 的既有概念，或本次明确化的新 UI 术语。

### 粉丝与获客

| Key | 中文（简体） | 日本語 | English | 使用边界 |
|---|---|---|---|---|
| `fan.public` | 公众认知 | 認知 | Awareness | 团队级注意与潜在受众，不要求到场、消费或绑定成员；不等于新规。 |
| `fan.otaku` | 普通粉丝 | ファン | Fans (non-Core) | 已经持续关注团队或成员的粉丝层，可箱推或偏向个人；不要求单推。 |
| `fan.core` | 核心粉丝 | コア | Core Fans | 更深的持续支持者；每人必须绑定一位推し成员，团队数由成员 Core 汇总。 |
| `fan.personal_public` | 个人认知 | 個人認知 | Personal Awareness | 独立于团体的个人关注与知名度；不自动算为团队 Otaku/Core。 |
| `fan.newcomer` | 新规／首次接触者 | 新規 | Newcomer | 一次活动中首次接触该团、或首次来本团特典会的人；是事件级身份标签，不是 Public 层同义词。必须写明是哪种首次。 |
| `fan.first_attendee` | 首次到场者 | 初来場者 | First-time Attendee | 首次实际到场观看本团演出的观众（需可观察的票务或自述证据）。 |
| `fan.first_cheki` | 首次特典会顾客 | 初特典会参加者 | First-time Cheki Customer | 首次购买本团 Cheki/参加特典会的观众；不推定首次知道本团。 |
| `fan.new_contact` | 首次接触 | 初接触 | First Exposure | 通过视频、电视、现场等第一次知道团队；是曝光事件，不代表到场或成为 Otaku。 |
| `fan.returning_attendee` | 回访观众 | 再来場者 | Returning Attendee | 同一个人再次来到本团演出时的观测身份；不直接决定 Core。 |
| `fan.box_oshimen` | 团推／箱推倾向 | 箱推し | Group-focused Support | 支持团体整体的倾向；可存在于 Otaku，不设置独立的 Box Core 类别。 |
| `fan.oshimen` | 首推成员 | 推しメン | Oshimen | Core 的单一绑定成员；不要译成官方成员色。 |
| `fan.box_rate` | 团体依附／箱推率 | 箱推し率 | Box Rate | 衡量成员变动后继续支持团体的倾向，不是第四种粉丝层。 |
| `fan.retention` | 粉丝留存 | ファン定着率 | Fan Retention | 重复关注／到场形成稳定支持；以特典会体验为主，Live 表现次之。 |
| `fan.attendance` | 本团动员 | 自グループ動員 | Own Attendance | 本团带来的到场人次，不等于场内全部观众，不等于唯一粉丝数。 |
| `fan.casual_audience` | 他团观众（临时公众） | 他グループ目当ての観客 | Other-group Audience | 拼盘中由他团吸引的观众；在本团 Live 转化计算中临时按 Public 看待，不改变其永久分类。 |
| `fan.conversion` | 粉丝层转化 | ファン層転換 | Fan Conversion | Public→Otaku→Core 的概率流动；后台不追踪每个个体为何转化。 |
| `fan.cheki` | 拍立得合影 | チェキ | Cheki | 特典会常见商品／拍摄形式；销量与独立购买人数分开。 |
| `fan.tokutenkai` | 特典会 | 特典会 | Meet-and-Greet | 演出后的成员交流与拍摄环节；并非所有类型的商演都提供。 |
| `fan.slot` | 特典会接待时段 | 特典会枠 | Meet-and-Greet Slot | 每位成员可提供接待的时间／容量单位。 |

### 成员与招聘

| Key | 中文（简体） | 日本語 | English | 使用边界 |
|---|---|---|---|---|
| `people.producer` | 制作人／玩家 | プロデューサー | Producer | 负责方向与关键决策。 |
| `people.staff` | 工作人员 | スタッフ | Staff | 按照战略会议授权处理日程和执行。 |
| `people.leader` | 队长 | リーダー | Leader | 周报及成员协调角色，非默认固定由某一位长期担任。 |
| `people.audition` | 甄选 | オーディション | Audition | 候选人的招募流程。 |
| `people.document_screening` | 书类选考 | 書類選考 | Application Screening | 审查申请资料；通过不代表入团。 |
| `people.interview` | 统一面试 | 合同面接／審査面接 | Group Audition Interview | 必须出席，通过有限 AP 提问。日文正式 UI 建议统一『審査面接』。 |
| `people.action_point` | 行动点 | 行動ポイント | Action Point (AP) | 面试提问可消耗资源；不是人物能力值。 |
| `people.producer_knowledge` | 制作人已知信息 | プロデューサーの把握情報 | Producer Knowledge | 候选人能力仅显示估计区间而非后台真实值。 |
| `people.radar` | 能力雷达图 | 能力レーダーチャート | Ability Radar | 按知识权限显示五轴估计范围。 |
| `people.attributes` | 基础属性 | 基礎能力値 | Attributes | 17 项 0–20 能力；技能平均与属性值不混同。 |
| `people.trait` | 职业专长经验 | 特性経験値 | Trait Experience | Singing、Dancer、Model 等独立经验体系 0–400。 |
| `people.model` | 模特经验 | モデル経験 | Model Trait | 宮原初始 Model 100／Junior。 |
| `people.contract` | 活动合同 | 活動契約 | Activity Contract | 早期统一两年合同，低中高保障＋特典分成。 |
| `people.fulltime` | 全职合同 | 専属契約 | Full-time Contract | 后期保底高、特典分成低的工作合同；与实际劳动关系分开判断。 |
| `people.graduation` | 毕业／离队 | 卒業 | Graduation | 正常发展离队；区别于期满不续约或违约解约。 |

### 歌曲与演出

| Key | 中文（简体） | 日本語 | English | 使用边界 |
|---|---|---|---|---|
| `song.making` | 歌曲制作 | 楽曲制作 | Song Production | 原创歌曲经过多阶段制作。 |
| `song.cover` | 翻唱 | カバー曲 | Cover Song | 初期可自由选用，需考虑游戏内年度许可与伴奏制作。 |
| `song.original` | 原创歌曲 | オリジナル曲 | Original Song | 制作完成后方可首次公开，2013 年 5 月出道首次披露。 |
| `song.palette` | 歌曲色谱 | 楽曲パレット | Song Palette | 八色歌曲固有主题表达；大多单色，少量双色，不等于成员应援色。 |
| `song.member_palette` | 成员色谱熟练度 | メンバーのパレット習熟度 | Member Palette Proficiency | 靠排练和舞台经验成长；甄选生初始八色 0。 |
| `song.member_color` | 应援色／成员色 | メンバーカラー | Member Color | 舞台／粉丝视觉颜色，不等于歌曲 Palette 或熟练度。 |
| `song.appeal` | 歌曲吸引力 | 楽曲アピール度 | Song Appeal | 歌曲自身对观众的潜在吸引度，不是已产生的实际动员。 |
| `song.vocal_difficulty` | 歌唱难度 | 歌唱難易度 | Vocal Difficulty | 歌曲对歌唱能力的要求。 |
| `song.dance_difficulty` | 舞蹈难度 | ダンス難易度 | Dance Difficulty | 歌曲对舞蹈能力的要求。 |
| `song.original_members` | 原版人数 | オリジナル編成人数 | Original Lineup Size | 原版编制人数，不等于当前演出人数。 |
| `song.formation` | 站位／阵型 | フォーメーション | Formation | 本团版本的站位和编排。 |
| `song.center` | 中心位 | センター | Center | 歌曲编排中的中心成员。 |
| `song.setlist` | 演出曲目表 | セットリスト | Setlist | Live 的实际曲目安排；没有硬性八曲门槛。 |
| `live.taiban` | 拼盘演出 | 対バン | Multi-act Live | 多个团体同场出演，其他团观众按临时 Public 计算。 |
| `live.oneman` | 专场／One-man | ワンマンライブ | One-man Live | 由本团独立承担主要出演的公演。 |
| `live.regular` | 定期公演 | 定期公演 | Regular Live | 固定档期的公演合同与重复经营循环。 |
| `live.impression` | 现场印象总量 | インプレッション | Live Impression | 后台结算中间量；通常不在 Live Report 展示原始值。 |
| `live.weekly_review` | 周评 | ウィークリーレビュー | Weekly Review | 由当前 Leader 汇总趋势与建议，不是固定月会。 |
| `live.member_feedback` | 成员反馈 | メンバー報告 | Member Feedback | 成员亲眼见闻与谈话转述，不能充当粉丝概率模型的因果证据。 |

### 组织与财务

| Key | 中文（简体） | 日本語 | English | 使用边界 |
|---|---|---|---|---|
| `ops.strategy_meeting` | 团队策略会议 | 運営方針会議 | Team Strategy Meeting | 设定长期训练、Live、外务、休息等策略；变更须再开会议。 |
| `ops.inbox` | 收件箱／工作台 | 受信箱 | Inbox | 日常决策与事件入口。 |
| `ops.calendar` | 日程表 | カレンダー | Calendar | Staff 自动排期、日程预览和推进。 |
| `ops.finance` | 财务 | 財務 | Finance | 贷款、合同、三表和资产管理模块。 |
| `ops.bank_loan` | 银行贷款 | 銀行融資 | Bank Loan | 按金额和既有负债计算报价，须按月还本付息。 |
| `ops.asset` | 资产 | 資産 | Asset | 歌曲权利、服装、设备和符合条件的场地使用权。 |
| `ops.book_value` | 账面价值 | 帳簿価額 | Book Value | 购入成本扣除折旧、摊销及减值；与市场估值分开。 |
| `ops.market_value` | 经营估值 | 推定市場価値 | Estimated Value | 歌曲、服装等经济价值估计；不能直接计入现金。 |
| `ops.member_market_value` | 成员职业估值 | メンバー推定市場価値 | Idol Market Value | FM 式职业价值参考，不把成员个人计入公司资产。 |
| `ops.cashflow` | 现金流量表 | キャッシュフロー計算書 | Cash Flow Statement | 反映经营、投资、融资现金变化。 |
| `ops.balance_sheet` | 资产负债表 | 貸借対照表 | Balance Sheet | 反映期末资产、负债和净资产。 |
| `ops.income_statement` | 利润表 | 損益計算書 | Income Statement | 反映收入、费用和利润。 |
| `ops.chapter_rating` | 章节评级 | チャプター評価 | Chapter Rating | Fans / Performance / Members / Operations 四项字母评级及综合评级，不公开数字分。 |

## 四、UI 与数据字段分离

| 内部计算字段 | 可公开的 UI | 不应直接泄露的内容 |
|---|---|---|
| `public_pool` / `PersonalPublic` | 公众认知趋势／曝光估计（可选择不显示人数） | 将 Public 称为『新规粉丝』 |
| `otaku_pool`, `core_by_member` | 已观察的到场与销售、长期趋势性周评 | 精确 Core/Otaku 隐藏真实人数与实时转化率 |
| `first_ticket_purchase`, `first_cheki_purchase`（仅在有交易记录时） | 首次购票、首次 Cheki 购买者数 | 未记录身份时推断『第一次认识本团』 |
| `live_impression` | 成员定性评价与舞台观察 | 内部 Impression 原始数值 |
| `fan_conversion_probability` | 不直接公开；根据多场数据谨慎描述趋势 | 针对具体粉丝的虚构转化原因 |

## 五、本地化规范

1. 内部保持 **Public / Otaku / Core** 为稳定技术术语；玩家可见页面优先用「認知 / ファン / コア」等简短本地化标签，且「ファン」与「コア」同列时必须互斥。不要把 `Public` 本地化为「新規」或「新粉丝」。
2. 在日本偶像现场，**新規** 可能口语地指第一次来看、第一次来特典会或初次认识偶像的人。游戏的埋点与报表必须指明是哪一种，否则只可在成员自由对话中宽泛使用。
3. 保留 **チェキ、特典会、対バン、ワンマン、推しメン** 等现场惯用词；英文本地化可用 Cheki、Meet-and-Greet、Multi-act Live、One-man Live、Oshimen，并在首次出现时用 tooltip 解释。
4. **Palette** 的八色含义与成员名义应援色不同，不可将『成员色』直接映射为 Palette 经验。
5. 三语文案使用独立 key；UI 标签可简短，帮助文档应保留完整定义。开发不得将 `newcomer_count` 直接从 `public_pool_delta` 生成。
6. 版本优先级：本术语表只统一翻译与定义；系统运算仍以已审核的 Fan / Live / Song 规范为准。没有证据的英文行业翻译属于产品本地化决定，而非历史事实。

## 六、文档与实现检查

- 检索所有把 `Public` 直接叫做「新規／新规」或把『新規』等同于 `P→O` 转化的文字，区分统计建模的临时 Public 与真实首次接触者。
- 在 Live Report、Weekly Review、YouTube 与外务报告的文字模板里应用上表的三语术语。
- 仅对有明确信息来源的字段显示『首次购票』和『首次 Cheki』人数；其余用模糊的定性描述，不暴露模型真值。
- 测试同一个 Otaku 第一次拍 Cheki、他团粉丝第一次看到本团、看过 YouTube 才第一次到场等例子，避免跨层重复计数。

## v0.2 修订记录

新增技术定义／简短 UI／角色口语三层对照，修正日语长标签，并明确「ファン」统计不含 Core，而「ファン合計」包含 Core；不更改模拟数据结构及公式。