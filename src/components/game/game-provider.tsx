"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  advanceIsoDate,
  formatGameDateJa,
  GAME_START_ISO,
} from "@/lib/mock/game-date";

type GameContextValue = {
  isoDate: string;
  dateLabel: string;
  advanceOneDay: () => void;
  resetDate: () => void;
};

const GameContext = createContext<GameContextValue | null>(null);

export function GameProvider({ children }: { children: ReactNode }) {
  const [isoDate, setIsoDate] = useState(GAME_START_ISO);

  const advanceOneDay = useCallback(() => {
    setIsoDate((current) => advanceIsoDate(current, 1));
  }, []);

  const resetDate = useCallback(() => {
    setIsoDate(GAME_START_ISO);
  }, []);

  const value = useMemo(
    () => ({
      isoDate,
      dateLabel: formatGameDateJa(isoDate),
      advanceOneDay,
      resetDate,
    }),
    [isoDate, advanceOneDay, resetDate],
  );

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) {
    throw new Error("useGame must be used within GameProvider");
  }
  return ctx;
}
