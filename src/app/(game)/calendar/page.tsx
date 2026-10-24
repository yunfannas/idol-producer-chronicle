import { AppHeader } from "@/components/shell/app-header";
import { MOCK_CALENDAR } from "@/lib/mock/calendar";

export default function CalendarPage() {
  return (
    <>
      <AppHeader
        title="Calendar"
        subtitle="JST 日程・招待・日推進。"
        showAdvance
      />
      <main className="space-y-1 px-4 pt-2">
        <ul className="divide-y divide-[var(--stage-line)]">
          {MOCK_CALENDAR.map((event) => (
            <li key={event.id} className="py-4">
              <p className="text-xs tracking-wide text-[var(--stage-teal)]">
                {event.dateLabel}
                <span className="mx-1.5 text-border">·</span>
                {event.kind}
              </p>
              <p className="mt-1 font-medium text-[var(--stage-ink)]">
                {event.title}
              </p>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                {event.note}
              </p>
            </li>
          ))}
        </ul>
        <p className="pt-4 pb-2 text-xs leading-relaxed text-muted-foreground">
          未来の出演はここから確認し、Setlist や人員の変更は Manage → Live
          の会議へ。この画面はモック予定表です。
        </p>
      </main>
    </>
  );
}
