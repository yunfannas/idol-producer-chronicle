# Chronicle Palette v2.1 — 八色定义、顺序与显示契约

> 状态：2026-10-28 已确认的游戏设计规范。与旧八色的语义不完全兼容；旧 L2B/历史曲目须经显式版本迁移，不能只换可视化。参见 idol-data-lab 的 Palette v2.1 migration spec。此文件只冻结 Chronicle 目标规范，不表示 Runtime 或历史校准已迁移。

## 1. 三条正交语义轴

- **Stance — Request / Assurance（请求／确信）**：Request 为主体的核心诉求、关系或希望尚待回应/确认；Assurance 为主体对自身情感、价值或行动立场已经确立，**不要求外部目标客观实现**。不等同情绪强弱、开心/悲伤或是否主动采取行动。
- **Purpose — Cute / Cool（可爱／飒爽）**：Cute 的最终目的是可爱、喜欢、亲密关系及其共享；Cool 的最终目的是改变状态、克服困难、守护原则或实现行动目标。帮助他人开心、支持别人不能单独推导 Cool，须看最终目的。
- **Participation — Witness / Co-action（见证／共同参与）**：Witness 是听众作为观察、见证者；Co-action 是歌曲的表达成立依赖受众回应、协作、参与。Live 有 Call 不自动推导 Co-action。

## 2. 权威 Color Code 与固定索引

**一维顺序 / Radar 顺时针顺序：`R, O, Y, G, A, B, V, P`。** Radar 从正上方 R 开始；歌曲和 Team 的一维色条按此索引，**不按照权重排序**。

| index | Code | 色名 | Stance | Purpose | Participation | 示例侧重 |
| ---: | --- | --- | --- | --- | --- | --- |
| 0 | R | 赤 / Red | Assurance | Cool | Co-action | 坚定宣言、邀请共同挑战 |
| 1 | O | 橙 / Orange | Assurance | Cute | Co-action | 分享快乐与可爱、共同喜欢 |
| 2 | Y | 黄 / Yellow | Assurance | Cute | Witness | 已确认的可爱、自我肯定或明确表达喜欢 |
| 3 | G | 绿 / Green | Assurance | Cool | Witness | 坚守原则、独立前行 |
| 4 | A | 水 / Aqua | Request | Cute | Witness | 尚待回应的喜欢、憧憬、期待 |
| 5 | B | 蓝 / Blue | Request | Cool | Witness | 寻求答案、面对困境和未解决状态 |
| 6 | V | 紫 / Violet | Request | Cool | Co-action | 邀请共同寻求改变和突破 |
| 7 | P | 粉 / Pink | Request | Cute | Co-action | 请求喜欢的回应、共同建立亲密 |

**严格正对**：`R↔A`、`O↔B`、`Y↔V`、`G↔P`。每对都在三轴上同时取反（index 差 4）。

## 3. 数值和可视化规则

- Song/Team 为八色归一化向量，非负，合计 **1.00**，展示两位小数；建议内部存 0–100 的整数百分比，避免舍入漂移。
- Song 缩略图与 Team 一维条使用**全部非零分量的实际宽度**，按固定索引排序；不按主色移动位置、不因小于阈值而隐藏副色。
- 标签：最大权重为主色；当第二大权重严格 **>0.25** 时显示 `主色/副色` 双 Code，否则只显示主色。相等权重用固定索引排序。标签不改变底层向量。
- Member 为八个独立 Palette Proficiency，**不归一化**；八角 Radar 使用上述相同的固定索引和 Code，范围随游戏能力尺度确定。
- 出道第一首原创固定 `P0.80 Y0.20`，标签为 `P`，但色条保留 80% 粉、20% 黄；第二首由玩家选择 Palette。
- UI 展示比例与 Performance/Palette Fit 用的数据必须取同一源向量；不能因标签单色而抹去次色权重。

## 4. 数据兼容性声明

- 旧八色 L2B 的 `yellow = Vulnerable/Cute/Witness`、`aqua = Confident/Cute/Witness`；此版改为 `Y = Assurance/Cute/Witness`、`A = Request/Cute/Witness`。其余六色在三轴的语义位置不变。
- 对**旧语义标签**迁移为本版语义时：旧 `yellow → A`、旧 `aqua → Y`；其余颜色保持原 Code。**该映射是语义保留，不是颜色外观保留**；因此旧歌曲会发生部分视觉颜色变化。
- 已批准歌曲的视觉配色如需保持不变，不能同时宣称语义完全保留；必须明确记为 `appearance_preserving` 例外并接受新语义，或重新审稿。未标注来源版本的数据不允许盲目批量交换。
- 旧固定索引数组必须按**旧源索引→新索引**重新排列；字典形式按 code 映射。迁移版本须持久化，避免重复交换。旧数据快照、成员 Proficiency 与 Team 聚合各有独立迁移/重算要求，详见研究仓库迁移规范。

## 5. 日语 UI 命名与术语表（2026-10-28 确认）

以下为**玩家可见日语 UI** 正式用词；英文语义键、Color Code 与储存字段保持稳定。中文为设计文档用词。

| Code | 中文 | 日本語 UI | English |
| --- | --- | --- | --- |
| R | 红 | 赤 | Red |
| O | 橙 | オレンジ | Orange |
| Y | 黄 | 黄 | Yellow |
| G | 绿 | 緑 | Green |
| A | 水 | 水色 | Aqua |
| B | 蓝 | 青 | Blue |
| V | 紫 | パープル | Purple |
| P | 粉 | ピンク | Pink |

注意：内部 Code **V** 保持不变，但正式英文显示为 **Purple**、日语 **パープル**，不显示 Violet/バイオレット；中文 Red 用「红」，不是「赤」。日语 Orange 使用「オレンジ」，不是「橙」。固定索引不变。

### 5.1 确定的轴名称与成员能力名称

| 内部英文 | 日本語 UI（锁定） | 中文 |
| --- | --- | --- |
| Request / Assurance | **願望 / 確信** | 请求 / 确信 |
| Cute / Cool | **可愛い / かっこいい** | 可爱 / 帅气（作为歌曲目的轴） |
| Witness / Co-action | **見守る / 一緒に** | 见证 / 共同参与 |
| Member Palette Proficiency | **色表現力** | 成员颜色表现力／成员 Palette 熟练度 |

**「色表現力」语义边界：** 指每位成员对八种 Palette 方向各自的、可以通过训练、舞台经验及实际演出提高的表现能力；数值独立，**不归一化**。不是先天「色適性」，不是单次 Live 的「色表现评分」，也不是官方成员担当色。界面以八角 Radar 展示，代码/存档继续保留原有 Member Palette Proficiency 字段概念。

**日语 UI 文案与判别逻辑分离：** 願望/確信 仍按 Request/Assurance 的立场确定性判断；見守る/一緒に 仍按 Witness/Co-action 对听众实际参与角色判断。简短 UI 词不构成新的歌词分类规则。

### 5.2 尚未正式锁定的其他术语

此前讨论过的 `楽曲パレット`、`グループパレット`、`パレット適合度`、`仕上がり度` 等属于建议候选，不能与上述已确认术语混为一谈；后续逐项确认。
