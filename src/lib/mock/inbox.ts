import type { InboxItem } from "./types";

/** Prologue sample Inbox — tone from Chronicle v0.6, mock only. */
export const MOCK_INBOX: InboxItem[] = [
  {
    id: "inbox-blocking-orientation",
    tier: "blocking",
    title: "創立会議：チームの名前と最初の一歩",
    summary: "2013-01-07。三人と会社側で、団体の呼び名と当面の方針を決める必要があります。",
    body: [
      "Game Start は 2013年1月7日（月）JST。星野莉奈、宮原優花、小日向陽菜の三人が、まだ名前のついていないチームの前に座っています。",
      "莉奈：「まずは、私たちが何を目指すチームなのかを一緒に決めましょう。名前も、最初のオーディションの進め方も、ここで揃えておきたいです。」",
      "日を進める前に、この会議を片付ける必要があります。Blocking Decision は詳細ページで処理し、モーダルで重ねません。",
    ],
    from: "会社・オリエンテーション",
    dateLabel: "2013-01-07（月）",
    actions: ["Attend（参加する）", "Follow Policy（方針に従う）"],
  },
  {
    id: "inbox-actionable-audition",
    tier: "actionable",
    title: "書類通過候補 15名：統一面接の日程",
    summary: "1月中に統一試唱・短ダンスを実施。Producer には質問 AP が 6 あります（使い切らなくてよい）。",
    body: [
      "会社から、書類審査を通過した 15 名の候補リストが届きました。全員が東京在住です。",
      "面接はスキップできません。試唱と短いダンスの結果は、定性的なリスト報告のみ。17属性の真値は漏らしません。",
      "面接後に三人会議で合格人数を決めます。推奨は合計九人前後ですが、実際の录取規模は自由です。",
    ],
    from: "Audition Desk",
    dateLabel: "期限：1月中",
    actions: ["日程を確認", "Delegate（莉奈に準備を任せる）", "Later"],
  },
  {
    id: "inbox-report-weekly-01",
    tier: "report",
    title: "Weekly Review｜星野莉奈",
    summary: "初週のリハーサルを整理しました。陽菜は動きを丁寧に覚え、優花は空気をすぐ作れます。",
    body: [
      "莉奈：「今日はみんなの練習の様子をまとめました。陽菜は動作を丁寧にメモしていて、優花はすぐに場の空気を持っていけるタイプです。」",
      "「第一場の本番は、本当に仕上げられる一〜二曲から始めましょう。焦って曲を増やしても、舞台ではごまかせません。」",
      "Weekly Review は非 Blocking。出席して議論しても、読んだあと Policy に任せて進めても構いません。内部 Performance 数値は出しません。",
    ],
    from: "星野莉奈（週評ホスト）",
    dateLabel: "2013-01 第1週",
    actions: ["読む", "曲目の相談をする", "既定方針で続ける"],
  },
  {
    id: "inbox-ambient-sns",
    tier: "ambient",
    title: "メンバー近況：優花の雑誌問い合わせ",
    summary: "Model Trait を持つ宮原へ、小さな撮影の打診がありました。学業優先で、確定ではありません。",
    body: [
      "事務所に、雑誌サイドから宮原優花への単発撮影の問い合わせが入りました。毛利規模は小さく、学業と未成年ルールが優先です。",
      "Ambient はアーカイブや後回しが可能。重要なら Actionable に昇格し、会議や Policy で扱います。",
      "個人外務は Cheki 提成と別会計です。今は記録だけ残し、急がなくて大丈夫です。",
    ],
    from: "Staff 自動集約",
    dateLabel: "今週",
  },
];

export function getInboxItem(id: string): InboxItem | undefined {
  return MOCK_INBOX.find((item) => item.id === id);
}
