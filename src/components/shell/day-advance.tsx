"use client";

import { Button } from "@/components/ui/button";
import { useGame } from "@/components/game/game-provider";
import { ChevronRight } from "lucide-react";

export function DayAdvance({ compact = false }: { compact?: boolean }) {
  const { dateLabel, advanceOneDay } = useGame();

  return (
    <div
      className={
        compact
          ? "flex items-center gap-2"
          : "flex flex-wrap items-center justify-between gap-3"
      }
    >
      <p className="text-sm tracking-wide text-muted-foreground">
        <span className="font-medium text-foreground">{dateLabel}</span>
        <span className="mx-1.5 text-border">·</span>
        <span>JST</span>
      </p>
      <Button
        type="button"
        size={compact ? "sm" : "default"}
        onClick={advanceOneDay}
        className="gap-1 bg-[var(--stage-ink)] text-[var(--stage-paper)] hover:bg-[var(--stage-ink)]/90"
        aria-label="Advance 1 Day"
      >
        翌日へ
        <ChevronRight className="size-3.5 opacity-80" />
      </Button>
    </div>
  );
}
