# AKSB 序章角色美术规范与人员表 v0.3

状态：设计工作稿（2026-10-26）。本文件专用于 Chronicle 的 AKSB 序章；史实原型与虚构游戏角色分离，甄选者映射待核的不得标成已确认。

## 已锁定

- 序章全体角色：**一张全身舞台立绘 + 一张单独生成的甄选常服头像**；舞台头像如需要可从全身图裁切。
- 全身立绘 **1024 × 1536 PNG**；头像 **512 × 512 PNG**，纯白或无干扰浅色背景。
- **序章仅一套舞台演出服系列**：2013 年制服式白色主体、淡蓝色修饰、简洁短裙。允许领结、细纹样、裙边、袖口、发饰小幅差异；禁止大裙后蝴蝶结、繁复层叠荷叶边及近年华丽礼服式设计。
- **序章不设正式成员色**。横山利奈早期设想的颜色分配不可等同于最终选拔后的正式担当色；服装颜色不得回写 `member_color`。
- 人物统一日系偶像插画的线条、肤色、柔和上色和头身比例；不统一脸型、角度、表情和站姿。参考已通过的星野莉奈定稿及 HEROINES 三人画风参照。
- 出道/1st one-man 采用上述制服感演出服；**第一章 CD 发售／2nd one-man 才改用浅蓝色统一制服**。

## 三名创始人的角色差异化

| ID | 游戏名 | 现实原型 | 视觉方向 | 资产状态 |
|---|---|---|---|---|
| `aksb_f01` | 星野莉奈 | 横山利奈（りなはむ） | 深色长双马尾、粉色萌系、活泼伸手姿势；白/淡蓝演出服；甄选头像为粉色针织常服 | 全身与常服头像**定稿** |
| `aksb_f02` | 宮原優花 | 宮谷優恵 | 淡亚麻金/浅茶发、略带辣妹感、外向俏皮、站姿更舒展；腰部与裙上少量格纹/饰带 | 双人构图**方向稿**，独立全身图待制作 |
| `aksb_f03` | 小日向陽菜 | 計良日向子 | 黑长直、温柔清秀、直立端正、自然微笑；裙摆细小花纹等低调变化 | 双人构图**方向稿**，独立全身图待制作 |

三人的演出服属于**同一款基础制服**，仅微调装饰与花纹；头发颜色是角色形象，不是正式成员色。不可让三人统一歪头和同样的前伸手动作。

用户指明第一张早期官方宣传照中：宮谷参考人物为**右起第 4**、計良参考人物为**右起第 6**。此处仅按用户指定的参照位置使用，不通过图像面容独立识别真人身份。

## 第一章八人游戏名／原型参考

| 游戏名 | 原型 |
|---|---|
| 宮原優花 | 宮谷優恵 |
| 小日向陽菜 | 計良日向子 |
| 西園寺茉莉 | 荒川優那 |
| 高瀬千紘 | 石川夏海 |
| 瀬戸夏帆 | 船木沙織 |
| 朝倉七海 | 伊関亜美 |
| 藤咲美緒 | 大谷映美里 |
| 成瀬瑠菜 | 田口未彩 |

此表不表示八人都属于同一轮甄选。序章原计划另有 **15 名 audition 候选人**；现已回收的角色名线索：`水瀬紗月`、`橘ひより`、`藤咲美緒`、`朝倉七海`，其余待从剧本数据核验后补入，不补造姓名。

## 每人角色差异化模板

```yaml
character_id: aksb_f02
game_name: 宮原優花
prototype_name: 宮谷優恵
role: founder
prototype_evidence: prior_design_mapping
visual:
  face_shape: TBD
  eye_shape: TBD
  gaze: TBD
  hair: light_ash_brown
  demeanor: playful_gyaru_light
  pose: open_relaxed
  outfit_base: aksb_prologue_stage_uniform_v1
  variant: subtle_plaid_belt
  member_color: null
assets:
  stage_fullbody: pending
  audition_casual_portrait: pending
review:
  style_coherence: pending
  identity_consistency: pending
```

至少明确脸型、眼型、头发、姿态、表情与小装饰差异；同一角色全身与常服头像必须维持同一张脸。

## 资源路径与状态

目标放置目录：`public/assets/characters/aksb/prologue/`。

| 路径（相对于以上目录） | 规格 | 状态 |
|---|---|---|
| `hoshino_rina/stage_fullbody.png` | 1024×1536 | 定稿；待上传 PNG |
| `hoshino_rina/audition_casual.png` | 512×512 | 定稿；待上传 PNG |
| `reference/hoshino_rina_size_guide.png` | 示意图 | 完成；待上传 PNG |
| `reference/miyahara_kohinata_concept.png` | 双人设计方向稿 | 审美方向已确认；待上传 PNG |
| `miyahara_yuka/stage_fullbody.png` | 1024×1536 | 未完成 |
| `kohinata_hina/stage_fullbody.png` | 1024×1536 | 未完成 |

注意：设计图中出现的嵌入头像不等于已经完成独立 512×512 常服头像。不得将双人概念图冒充两张独立立绘。

## 美术验收

1. 全身图完整显示头、手、鞋，无裁切；头像 64×64 缩小时仍具有辨识度。
2. 共用同一演出服轮廓；饰物差异有限；拒绝混入近年复杂打歌服风格。
3. 三人并排避免同脸、同歪头、同姿势；星野萌系双马尾，宮原浅发轻辣妹，小日向黑长直温柔。
4. 身份对应与剧情人数在正式批量生产前依据 Chronicle 场景数据核验。
5. 图片二进制资源只有在上传并验证 GitHub 文件存在后才标记为 `in_repo`。

关联：`docs/art-direction.md`、`docs/portrait-generation.md`、`docs/design/Visual_Asset_Inventory_v0.1.md`。
