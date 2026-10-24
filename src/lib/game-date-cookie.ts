import { cookies } from "next/headers";
import {
  advanceIsoDate,
  formatGameDateJa,
  GAME_START_ISO,
} from "@/lib/mock/game-date";

export const GAME_DATE_COOKIE = "ipc-game-date";

export async function readGameDate(): Promise<{
  isoDate: string;
  dateLabel: string;
}> {
  const store = await cookies();
  const raw = store.get(GAME_DATE_COOKIE)?.value;
  const isoDate =
    raw && /^\d{4}-\d{2}-\d{2}$/.test(raw) ? raw : GAME_START_ISO;
  return { isoDate, dateLabel: formatGameDateJa(isoDate) };
}

export async function writeAdvancedGameDate(days = 1): Promise<string> {
  const { isoDate } = await readGameDate();
  const next = advanceIsoDate(isoDate, days);
  const store = await cookies();
  store.set(GAME_DATE_COOKIE, next, {
    path: "/",
    sameSite: "lax",
    httpOnly: false,
  });
  return next;
}
