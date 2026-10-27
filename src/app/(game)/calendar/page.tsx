import Link from "next/link";
import { AppHeader } from "@/components/shell/app-header";
import { loadOrCreateSave } from "@/lib/runtime/save-repository.server";
import { formatGameDateJa } from "@/lib/mock/game-date";

export const dynamic = "force-dynamic";

export default async function CalendarPage() {
  const state = await loadOrCreateSave();
  const outstanding = state.events.find((event) => event.status === "OFFERED");
  return (
    <>
      <AppHeader
        title="Calendar"
        subtitle="JST 日程・招待・日推進。"
        showAdvance
      />
      <main className="space-y-4 px-4 pt-3">
        {outstanding ? (
          <section className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950">
            <p className="font-medium">結算待ち：{outstanding.id}</p>
            <p className="mt-1 leading-relaxed">Staff は契約を Offer しました。Performance／Fan／Cheki 需要の承認済みアダプターが未接続のため、実績を捏造せず日進行を停止しています。</p>
          </section>
        ) : null}
        <ul className="divide-y divide-[var(--stage-line)]">
          {state.events.filter((event) => event.date >= state.date).slice(0, 12).map((event) => (
            <li key={event.id} className="py-4">
              <p className="text-xs tracking-wide text-[var(--stage-teal)]">
                {formatGameDateJa(event.date)}
                <span className="mx-1.5 text-border">·</span>
                {event.kind}
              </p>
              <Link href={`/manage/live/${event.id}`} className="mt-1 inline-block font-medium text-[var(--stage-ink)] hover:text-[var(--stage-teal)]">{event.id}</Link>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                {event.status} · Cheki {event.chekiAllowed ? "可" : "不可"}
              </p>
            </li>
          ))}
        </ul>
        <section className="rounded-xl bg-muted/60 p-4 text-sm text-muted-foreground">
          <p>現金 ¥{state.finance.cash.toLocaleString("ja-JP")} · 営業収益 ¥{state.finance.operatingRevenue.toLocaleString("ja-JP")} · 費用 ¥{state.finance.operatingCost.toLocaleString("ja-JP")}</p>
          <p className="mt-1">月次レポート {state.monthlyReports.length} 件。保存はローカル Runtime repository に原子的に書き込みます。</p>
        </section>
        {state.monthlyReports.length > 0 ? (
          <section className="rounded-xl border border-[var(--stage-line)] p-4">
            <h2 className="font-medium text-[var(--stage-ink)]">月次運営レポート</h2>
            <ul className="mt-2 divide-y divide-[var(--stage-line)] text-sm">
              {state.monthlyReports.slice(-3).reverse().map((report) => (
                <li key={report.month} className="py-3">
                  <Link href={`/reports/month-${report.month}`} className="font-medium text-[var(--stage-ink)] hover:text-[var(--stage-teal)]">{report.month}</Link>
                  <p className="mt-1 text-muted-foreground">営業収益 ¥{report.operatingRevenue.toLocaleString("ja-JP")} · 費用 ¥{report.operatingCost.toLocaleString("ja-JP")} · 資産 ¥{report.capitalizedAssets.toLocaleString("ja-JP")}</p>
                  <p className="mt-1 text-xs text-muted-foreground">期首 ¥{report.openingCash.toLocaleString("ja-JP")} → 期末 ¥{report.closingCash.toLocaleString("ja-JP")}</p>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </main>
    </>
  );
}
