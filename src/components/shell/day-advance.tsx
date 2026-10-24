import { advanceOneDayAction } from "@/app/actions/advance-day";
import { ChevronRight } from "lucide-react";

export function DayAdvance({
  dateLabel,
  compact = false,
}: {
  dateLabel: string;
  compact?: boolean;
}) {
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
      <form action={advanceOneDayAction}>
        <button
          type="submit"
          aria-label="Advance 1 Day"
          className="inline-flex h-8 items-center gap-1 rounded-lg bg-[var(--stage-ink)] px-2.5 text-sm font-medium text-[var(--stage-paper)] transition-opacity hover:opacity-90"
        >
          翌日へ
          <ChevronRight className="size-3.5 opacity-80" aria-hidden />
        </button>
      </form>
    </div>
  );
}
