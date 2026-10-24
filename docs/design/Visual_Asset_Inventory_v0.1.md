# Idol Producer: Chronicle｜视觉资产登记 v0.1

**整理原则**：仅登记当前可验证存在的文件；图片中的排版草稿不等于可交互页面，三人合图不等于三张单独肖像。文件名为当前对话工作区路径，落入仓库前需分配稳定资源路径。

| 资源 ID | 文件名 | 状态 | 尺寸 | 用途和说明 |
|---|---|---|---|---|
| `KV-APPROVED` | `backstage_idol_concert_spotlight.png` | 正式采用 | 1297×1212 | 标题主视觉：后台舞台边缘、Cheki 队列、暖色聚光、两只地返、1-0-2 位置贴、右下麦克风和 Setlist。无排版标题，菜单另叠加/排版。 |
| `KV-ITERATION-1` | `a_detailed_anime_style_illustration_of_a_dim_mood.png` | 探索版 | 1122×1402 | 后台与特典会构图迭代，非最终采用。 |
| `KV-ITERATION-2` | `a_moody_cinematic_anime_style_illustration_of_a.png` | 探索版 | 1122×1402 | 后台与特典会构图迭代，非最终采用。 |
| `KV-ITERATION-3` | `backstage_view_of_an_idol_cheki_line.png` | 探索版 | 1149×1369 | Cheki 与舞台布局迭代，非最终采用。 |
| `KV-ITERATION-4` | `backstage_spotlight_at_the_indie_live_house.png` | 探索版 | 1199×1312 | 聚光灯、舞台布局迭代，非最终采用。 |
| `KV-ITERATION-5` | `backstage_idol_cheki_moment.png` | 探索版 | 1189×1323 | 最终主视觉之前的迭代，非最终采用。 |
| `PORTRAIT-STRIP` | `a_wide_clean_anime_style_illustration_in_a_tript.png` | 肖像原图／三人合图 | 2172×724 | 三位创始成员的横向并排肖像；为卡片和人物页面分切时需建立 character_id→裁切区域映射。 |
| `PORTRAIT-PROFILE` | `a_clean_pastel_anime_style_character_profile_lay.png` | 已生成概念排版 | 1536×1024 | 三位创始成员形象与档案布局在同一张图中；不是可运行 UI，也不是三张独立立绘。 |
| `PORTRAIT-PROFILE-ALT` | `a_bright_clean_anime_manga_illustration_poster_st.png` | 已生成候选稿 | 1536×1024 | 三人肖像与档案版式变体，用于风格比对，不直接作为最终 UI。 |
| `UI-CARD-LIST` | `wide_clean_anime_ui_character_selection_profile_p.png` | 已生成界面预览 | 1672×941 | 三名创始成员的卡片／角色选择概念 UI；实际 Card/List/Detail 的控制与未知属性规则以设计文档为准。 |
| `UI-REFERENCE` | `2B01CCC6-FCEA-4EDF-83F4-39F3D2D4274F.jpeg` | 外部参考图，非游戏原创 | 1200×1800 | 用户提供的白底封面与标题、按钮布局参考。不可误列为 Chronicle 生成主视觉，也不应作为游戏发行素材。 |

## 三位创始成员肖像的拆分要求

- 星野莉奈 `IPC1-001`、宮原優花 `IPC1-002`、小日向陽菜 `IPC1-003` 使用**既有三人横向肖像**，禁止在实现时擅自重新生成替代形象。
- 当前图像为横向三连图和含文字的档案草图，尚未核验各自独立透明背景立绘与每人精确裁切边界。实施时需由美术确认左／中／右对应身份、导出肖像裁切、检查分辨率与构图。
- 正式 UI 中角色的姓名、数值与文字必须为组件渲染，不能将概念图中的烘焙文字当作真实档案数据。

## 标题首页与操作区域

- `KV-APPROVED` 为封面主视觉的唯一当前采用版本，延续后台远望特典会的叙事视角。
- 参考白底封面 `UI-REFERENCE`：手机端上半部完整图片、下部洁净留白区域放 `IDOL PRODUCER` / `CHRONICLE`、`The Stages We Shared.`、New Game / Load Game / Continue 和右下 Language。
- 封面底部渐变与裁切须保留前景 Setlist、麦克风，不能遮住远端偶像与聚光灯；建议不同手机比例进行安全区测试。
- 已有概念排版仅供设计参考，**标题页成品与交互按钮尚未烘焙为一个最终图像文件**。

## 建议的仓库资源结构（尚未提交）

```text
public/assets/chronicle/
  title/key-visual.png
  characters/founders/portrait-triptych.png
  ui-references/character-selection-concept.png
  ui-references/profile-layout-concept.png
docs/design/visual-asset-inventory.md
```

## 核验与待办

- 本次已验证以上图片在工作区存在，且能读取尺寸；没有证据显示它们已进入 GitHub 仓库或已接入运行界面。
- 需要继续核验肖像与角色姓名的一一对应关系、授权/使用来源、移动端安全裁切、UI 文字本地化、图片优化和三种人物视图的实际实现。