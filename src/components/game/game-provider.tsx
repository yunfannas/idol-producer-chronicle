"use client";

/**
 * Layout shell no longer needs client game date state —
 * date lives in a cookie + server action (see advance-day).
 * This file kept as a thin passthrough for future client session UI.
 */
export function GameProvider({ children }: { children: React.ReactNode }) {
  return children;
}
