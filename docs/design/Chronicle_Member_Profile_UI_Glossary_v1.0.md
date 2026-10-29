# Chronicle — Member Profile UI & Glossary v1.0

Status: design confirmed 2026-10-28; runtime implementation unverified. This document specifies presentation only. Preserve all underlying simulation formulas and attribute keys.

## Default layout

Always show Overall Ability (0–100), five-axis Ability Radar (0–20 per axis), eight-color Palette Proficiency Radar (0–100 per independent axis), Condition, Morale, Confidence (0–100). Show abnormality warnings where applicable. The 17 detailed attributes and EXP are **collapsed by default**.

Overall Ability is display-only, not a stage performance prediction:
`round(5*(0.30*Singing+0.30*Dancing+0.20*Visual+0.12*FanEngage+0.08*MediaAppeal))`.
Use existing axis calculations; do not infer new weights.

## Core UI labels

| 中文 | 日本語 | English |
| --- | --- | --- |
| 成员资料 | メンバープロフィール | Member Profile |
| 综合能力 | 総合能力 | Overall Ability |
| 能力雷达 | 能力レーダー | Ability Radar |
| 颜色表现力 | 色表現力 | Palette Proficiency |
| 状态 | コンディション | Condition |
| 详细属性 | 詳細能力 | Detailed Attributes |
| 属性经验 | 能力経験値 | Attribute EXP |

## Five-axis radar

| 中文 | 日本語 | English | Ability weight |
| --- | --- | --- | ---: |
| 歌唱 | 歌唱力 | Singing | 30% |
| 舞蹈 | ダンス力 | Dancing | 30% |
| 外形 | ビジュアル | Visual | 20% |
| 粉丝互动 | ファン対応力 | Fan Engagement | 12% |
| 媒体表现 | メディア対応力 | Media Appeal | 8% |

## Eight-color radar

Follow Chronicle_Palette_v2.1.md. Clockwise from top R O Y G A B V P; eight independent member proficiencies, NOT normalized.

| Code | 中文 | 日本語 | English |
| --- | --- | --- | --- |
| R | 红 | 赤 | Red |
| O | 橙 | オレンジ | Orange |
| Y | 黄 | 黄 | Yellow |
| G | 绿 | 緑 | Green |
| A | 水 | 水色 | Aqua |
| B | 蓝 | 青 | Blue |
| V | 紫 | パープル | Purple |
| P | 粉 | ピンク | Pink |

## Seventeen detailed attributes

| Internal key / English | 日本語 UI | 中文 UI |
| --- | --- | --- |
| Pitch | 音程 | 音准 |
| Tone | 声質 | 音色 |
| Breath | **ブレス** | 气息 |
| Rhythm | リズム感 | 节奏感 |
| Power | **パワー** | 力度 |
| Stage Presence | ステージ存在感 | 舞台表现力 |
| Agility | **身体協調性** | **身体协调性** |
| Stamina | 持久力 | 耐力 |
| Natural Fitness | 回復力 | 恢复力 |
| Cute | 可愛さ | 可爱 |
| Pretty | 美しさ | 美貌 |
| Wit | 機転 | 机敏 |
| Humor | ユーモア | 幽默 |
| Talking | トーク力 | 谈话能力 |
| Teamwork | **チームワーク** | **团队合作** |
| Fashion | ファッションセンス | 时尚感 |
| Creativity | 創造力 | 创造力 |

Agility is bodily coordination (movement control and complex dance), while Teamwork is interpersonal cooperation. Compact UI may abbreviate Agility as 協調性, but use 身体協調性 in the glossary/detail. Breath = breathing/phrasing control, not voice volume. Power = force/impact of dancing. Never rename internal fields or alter technical checks as a consequence of translation.

## Condition and abnormalities

| 中文 | 日本語 | English |
| --- | --- | --- |
| 状态 | コンディション | Condition |
| 士气 | モチベーション | Morale |
| 自信 | 自信 | Confidence |
| 身体疲劳 | 身体疲労 | Physical Fatigue |
| 声乐疲劳 | 歌唱疲労 | Vocal Fatigue |
| 身体异常 | 身体の不調 | Physical Abnormality |
| 声乐异常 | 喉の不調 | Vocal Abnormality |
| 轻度 | 軽度 | Mild |
| 中度 | 中程度 | Moderate |
| 重度 | 重度 | Severe |
| 恢复中 | 回復中 | Recovering |

Condition / PF / VF are separate; recovery remains governed by Condition_Fatigue_Part_Kernel_v0.4.

## Song difficulty matching

In song selection and production, compare member radar values directly: ΔV = VocalDifficulty − Singing, ΔD = DanceDifficulty − Dancing. Show separate singing/dancing match labels. The thresholds and Chinese labels are design-confirmed; Japanese and English match labels below are provisional translations pending language review.

| Δ | 中文 | 日本語 (provisional) | English (provisional) |
| --- | --- | --- | --- |
| ≤ −5 | 简单 | 簡単 | Easy |
| −4 to −2 | 较简单 | やや簡単 | Fairly Easy |
| −1 to 0 | 适中 | 適正 | Appropriate |
| +1 | 较难 | やや難しい | Somewhat Difficult |
| +2 to +3 | 难 | 難しい | Difficult |
| ≥ +4 | 超难 | 非常に難しい | Extremely Difficult |

Match tiers should NOT fluctuate with current Condition. Before live, Staff separately communicates Condition/abnormality/familiarity risk. No numerical performance or impression projection; actual results appear after Live. The radar values are only UI matching, not replacements for Breath/Rhythm/Pitch/Agility/etc. execution.
