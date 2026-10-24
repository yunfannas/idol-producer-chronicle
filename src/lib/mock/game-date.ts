/** Prologue Game Start (JST). */
export const GAME_START_ISO = "2013-01-07";

const WEEKDAYS_JA = ["日", "月", "火", "水", "木", "金", "土"] as const;

export function formatGameDateJa(isoDate: string): string {
  const [y, m, d] = isoDate.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  const weekday = WEEKDAYS_JA[date.getUTCDay()];
  return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}（${weekday}）`;
}

export function advanceIsoDate(isoDate: string, days: number): string {
  const [y, m, d] = isoDate.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  date.setUTCDate(date.getUTCDate() + days);
  const yy = date.getUTCFullYear();
  const mm = String(date.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(date.getUTCDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
}
