import { DayAdvance } from "@/components/shell/day-advance";

export function AppHeader({
  title,
  subtitle,
  showAdvance = false,
}: {
  title: string;
  subtitle?: string;
  showAdvance?: boolean;
}) {
  return (
    <header className="sticky top-0 z-30 border-b border-[var(--stage-line)] bg-[var(--stage-paper)]/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-lg flex-col gap-3 px-4 pb-3 pt-4">
        <div className="flex items-end justify-between gap-3">
          <div className="min-w-0">
            <p className="font-[family-name:var(--font-display)] text-[0.65rem] font-semibold tracking-[0.22em] text-[var(--stage-teal)] uppercase">
              Idol Producer
            </p>
            <h1 className="font-[family-name:var(--font-display)] text-2xl leading-tight tracking-tight text-[var(--stage-ink)]">
              {title}
            </h1>
            {subtitle ? (
              <p className="mt-0.5 text-sm text-muted-foreground">{subtitle}</p>
            ) : null}
          </div>
        </div>
        {showAdvance ? <DayAdvance /> : null}
      </div>
    </header>
  );
}
