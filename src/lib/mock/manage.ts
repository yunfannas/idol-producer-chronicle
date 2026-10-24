import type { ManageModule } from "./types";

export const MANAGE_MODULES: ManageModule[] = [
  {
    id: "making",
    nameJa: "Making",
    nameEn: "Song production",
    blurb: "オリジナル制作と翻唱ライセンス。Palette は完成後固定。",
  },
  {
    id: "training",
    nameJa: "Training",
    nameEn: "Rehearsal policy",
    blurb: "訓練帯とリハーサル室。方針変更は会議経由のみ。",
  },
  {
    id: "live",
    nameJa: "Live",
    nameEn: "Stages & setlists",
    blurb: "商演・拼盘・定期・One-man / TIF。統一 Live UI。",
  },
  {
    id: "audition",
    nameJa: "Audition",
    nameEn: "Casting",
    blurb: "統一面接、合格会議、十月補員プール。",
  },
  {
    id: "finance",
    nameJa: "Finance",
    nameEn: "Cash & assets",
    blurb: "現金・貸付・曲衣裳資産。身価は BS に載せない。",
  },
  {
    id: "policy",
    nameJa: "Policy",
    nameEn: "Team strategy",
    blurb: "訓練・出演・休息・外務の優先。Staff が自動排程。",
  },
];
