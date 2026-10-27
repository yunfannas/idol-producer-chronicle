import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ChevronRight } from "lucide-react";
import { AppHeader } from "@/components/shell/app-header";
import { eventDisplayName, formatYen, getReadonlyLiveDetail } from "@/lib/presentation/prologue-ui";
import { loadOrCreateSave } from "@/lib/runtime/save-repository.server";

function Amount({ amount }: { amount: number }) {
  return <span className={amount < 0 ? "text-[var(--tier-blocking)]" : "text-[var(--stage-ink)]"}>{formatYen(Math.abs(amount))}</span>;
}

export default async function ReportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const state = await loadOrCreateSave();
  const opening = id === "opening" && state.gates.G03;
  const month = id.startsWith("month-") ? id.slice("month-".length) : undefined;
  const monthReport = month ? state.monthlyReports.find((report) => report.month === month) : undefined;
  const liveId = id.startsWith("live-") ? id.slice("live-".length) : undefined;
  const live = liveId ? getReadonlyLiveDetail(state, liveId) : undefined;
  if (!opening && !monthReport && (!live || live.event.status !== "RESOLVED")) notFound();

  const openingEntries = opening ? state.finance.entries.filter((entry) => entry.id.startsWith("making:")) : [];
  return (
    <>
      <AppHeader title="Report" subtitle="保存済みの事実のみを読む。" />
      <main className="space-y-5 px-4 pt-4">
        <Link href="/inbox" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="size-4" /> Inbox に戻る</Link>
        {opening ? (
          <section className="space-y-4 rounded-xl border border-[var(--stage-line)] bg-white p-4">
            <div><p className="text-xs tracking-wide text-[var(--stage-teal)]">STAFF EXECUTION RECORD</p><h1 className="mt-1 font-[family-name:var(--font-display)] text-2xl text-[var(--stage-ink)]">開局実行記録</h1></div>
            <p className="text-sm leading-relaxed text-muted-foreground">統一面接、契約、初期制作は保存済み Scenario と Finance ledger に反映されています。通常運営は承認済みの Staff 方針で続きます。</p>
            <dl className="grid grid-cols-2 gap-3 text-sm"><div><dt className="text-muted-foreground">正式契約</dt><dd className="mt-1 text-lg font-medium text-[var(--stage-ink)]">{state.members.filter((member) => member.active).length}名</dd></div><div><dt className="text-muted-foreground">現在の現金</dt><dd className="mt-1 text-lg font-medium text-[var(--stage-ink)]">{formatYen(state.finance.cash)}</dd></div></dl>
            <ul className="divide-y divide-[var(--stage-line)] text-sm">{openingEntries.map((entry) => <li key={entry.id} className="flex justify-between gap-3 py-2"><span>{entry.note}</span><Amount amount={-entry.amount} /></li>)}</ul>
            <Link href="/manage/live" className="inline-flex h-9 w-full items-center justify-center gap-1 rounded-lg border border-[var(--stage-line)] text-sm font-medium hover:bg-muted">次の Live 契約を見る <ChevronRight className="size-4" /></Link>
          </section>
        ) : null}
        {monthReport ? (
          <section className="space-y-4 rounded-xl border border-[var(--stage-line)] bg-white p-4">
            <div><p className="text-xs tracking-wide text-[var(--stage-teal)]">MONTHLY OPERATING REPORT</p><h1 className="mt-1 font-[family-name:var(--font-display)] text-2xl text-[var(--stage-ink)]">{monthReport.month}</h1></div>
            <dl className="grid grid-cols-2 gap-4 text-sm"><div><dt className="text-muted-foreground">期首現金</dt><dd className="mt-1 font-medium">{formatYen(monthReport.openingCash)}</dd></div><div><dt className="text-muted-foreground">期末現金</dt><dd className="mt-1 font-medium">{formatYen(monthReport.closingCash)}</dd></div><div><dt className="text-muted-foreground">営業収益</dt><dd className="mt-1 font-medium">{formatYen(monthReport.operatingRevenue)}</dd></div><div><dt className="text-muted-foreground">営業費用</dt><dd className="mt-1 font-medium">{formatYen(monthReport.operatingCost)}</dd></div><div><dt className="text-muted-foreground">資産計上</dt><dd className="mt-1 font-medium">{formatYen(monthReport.capitalizedAssets)}</dd></div><div><dt className="text-muted-foreground">借入増減</dt><dd className="mt-1 font-medium">{formatYen(monthReport.loans)}</dd></div></dl>
            <p className="text-xs leading-relaxed text-muted-foreground">{monthReport.note}</p>
            <Link href="/manage/finance" className="inline-flex h-9 w-full items-center justify-center gap-1 rounded-lg border border-[var(--stage-line)] text-sm font-medium hover:bg-muted">Finance ledger を読む <ChevronRight className="size-4" /></Link>
          </section>
        ) : null}
        {live && live.event.status === "RESOLVED" ? (
          <section className="space-y-4 rounded-xl border border-[var(--stage-line)] bg-white p-4">
            <div><p className="text-xs tracking-wide text-[var(--stage-teal)]">LIVE REPORT</p><h1 className="mt-1 font-[family-name:var(--font-display)] text-2xl text-[var(--stage-ink)]">{eventDisplayName(live.event)}</h1><p className="mt-1 text-sm text-muted-foreground">{live.event.date} JST</p></div>
            <p className="text-sm leading-relaxed text-muted-foreground">このイベントに紐づく契約・参加メンバー・Finance ledger を表示します。内部 Performance／Impression や転化原因は公開しません。</p>
            <div className="text-sm"><p className="text-muted-foreground">実出演メンバー</p><p className="mt-1 font-medium">{live.participants.length ? live.participants.join("・") : "記録なし"}</p></div>
            <Link href={`/manage/live/${live.event.id}`} className="inline-flex h-9 w-full items-center justify-center gap-1 rounded-lg border border-[var(--stage-line)] text-sm font-medium hover:bg-muted">Live / Finance 詳細 <ChevronRight className="size-4" /></Link>
          </section>
        ) : null}
      </main>
    </>
  );
}
