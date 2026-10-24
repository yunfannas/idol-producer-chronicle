import type { CalendarEvent } from "./types";

export const MOCK_CALENDAR: CalendarEvent[] = [
  {
    id: "cal-orientation",
    dateLabel: "2013-01-07（月）",
    title: "創立会議",
    kind: "Blocking",
    note: "団体名・当面方針。日推進の前に完了。",
  },
  {
    id: "cal-audition-window",
    dateLabel: "2013-01 中旬",
    title: "統一面接ウィンドウ",
    kind: "Audition",
    note: "書類通過 15 名。試唱・短ダンス、質問 AP 6。",
  },
  {
    id: "cal-strategy",
    dateLabel: "面接後",
    title: "Team Strategy Meeting",
    kind: "Meeting",
    note: "訓練帯・Live 侧重・初期 Making。以後の変更は再会議。",
  },
  {
    id: "cal-debut",
    dateLabel: "2013-05",
    title: "JUKEBOX AKIBA 出道（予定枠）",
    kind: "Story gate",
    note: "二首オリジナル初公開。機会は保送、成績は実算。",
  },
];
