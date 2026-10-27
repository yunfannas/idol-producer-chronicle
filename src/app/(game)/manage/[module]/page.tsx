import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ChevronRight } from "lucide-react";
import { MANAGE_MODULES } from "@/lib/mock/manage";
import { eventDisplayName, formatYen } from "@/lib/presentation/prologue-ui";
import { loadOrCreateSave } from "@/lib/runtime/save-repository.server";

export default async function ManageModulePage({
  params,
}: {
  params: Promise<{ module: string }>;
}) {
  const { module: moduleId } = await params;
  const mod = MANAGE_MODULES.find((m) => m.id === moduleId);
  if (!mod) notFound();
  const state = await loadOrCreateSave();

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-[var(--stage-line)] bg-[var(--stage-paper)]/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-lg items-center gap-3 px-3 py-3">
          <Link
            href="/manage"
            className="inline-flex size-8 items-center justify-center rounded-lg text-[var(--stage-ink)] transition-colors hover:bg-muted"
            aria-label="Back to Manage"
          >
            <ArrowLeft className="size-5" />
          </Link>
          <div>
            <p className="text-xs tracking-wide text-muted-foreground">
              Manage
            </p>
            <h1 className="font-[family-name:var(--font-display)] text-lg text-[var(--stage-ink)]">
              {mod.nameJa}
            </h1>
          </div>
        </div>
      </header>
      <main className="space-y-4 px-4 py-6">
        <p className="text-sm tracking-wide text-[var(--stage-teal)]">
          {mod.nameEn}
        </p>
        <p className="text-[0.95rem] leading-relaxed text-[var(--stage-ink)]/90">
          {mod.blurb}
        </p>
        {moduleId === "live" ? (
          <section className="space-y-3 rounded-xl border border-[var(--stage-line)] bg-white p-4">
            <div><h2 className="font-medium text-[var(--stage-ink)]">Live contract record</h2><p className="mt-1 text-sm leading-relaxed text-muted-foreground">契約・出場記録・既存台帳を読む専用です。未結算の Live に実績は表示しません。</p></div>
            <ul className="divide-y divide-[var(--stage-line)]">
              {state.events.filter((event) => event.status === "OFFERED" || event.status === "RESOLVED").slice(0, 12).map((event) => (
                <li key={event.id} className="py-3">
                  <Link href={`/manage/live/${event.id}`} className="flex items-center justify-between gap-3 hover:text-[var(--stage-teal)]"><span><span className="block text-xs text-muted-foreground">{event.date} JST · {event.status}</span><span className="mt-1 block font-medium text-[var(--stage-ink)]">{eventDisplayName(event)}</span></span><ChevronRight className="size-4 shrink-0" /></Link>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
        {moduleId === "finance" ? (
          <section className="space-y-4 rounded-xl border border-[var(--stage-line)] bg-white p-4">
            <div><h2 className="font-medium text-[var(--stage-ink)]">Finance ledger</h2><p className="mt-1 text-sm leading-relaxed text-muted-foreground">現金、営業収益、費用、資産、借入を区別して表示します。ここから仕訳は追加・変更できません。</p></div>
            <dl className="grid grid-cols-2 gap-3 text-sm"><div><dt className="text-muted-foreground">現金</dt><dd className="mt-1 text-lg font-medium">{formatYen(state.finance.cash)}</dd></div><div><dt className="text-muted-foreground">営業収益</dt><dd className="mt-1 text-lg font-medium">{formatYen(state.finance.operatingRevenue)}</dd></div><div><dt className="text-muted-foreground">営業費用</dt><dd className="mt-1 text-lg font-medium">{formatYen(state.finance.operatingCost)}</dd></div><div><dt className="text-muted-foreground">資産計上</dt><dd className="mt-1 text-lg font-medium">{formatYen(state.finance.capitalizedAssets)}</dd></div></dl>
            <ul className="divide-y divide-[var(--stage-line)] text-sm">{state.finance.entries.slice().reverse().slice(0, 12).map((entry) => <li key={entry.id} className="flex items-start justify-between gap-3 py-2"><span><span className="block text-xs text-muted-foreground">{entry.date} · {entry.category}</span><span>{entry.note}</span></span><span className={entry.kind === "operating_revenue" || entry.kind === "loan_proceeds" ? "text-[var(--stage-teal)]" : "text-[var(--tier-blocking)]"}>{entry.kind === "operating_revenue" || entry.kind === "loan_proceeds" ? "+" : "−"}{formatYen(entry.amount)}</span></li>)}</ul>
          </section>
        ) : null}
        {!(["live", "finance"] as string[]).includes(moduleId) ? <p className="text-sm leading-relaxed text-muted-foreground">このモジュールの会議は、該当する Scenario gate が開いた時だけ Inbox から入ります。章固定の Policy を通常画面で変更することはできません。</p> : null}
        <Link
          href="/manage"
          className="inline-flex text-sm text-muted-foreground hover:text-foreground"
        >
          ← Back to Manage
        </Link>
      </main>
    </>
  );
}
