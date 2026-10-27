import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { AppHeader } from "@/components/shell/app-header";
import { eventDisplayName, formatYen, getReadonlyLiveDetail } from "@/lib/presentation/prologue-ui";
import { loadOrCreateSave } from "@/lib/runtime/save-repository.server";

function ledgerDirection(kind: string) {
  return kind === "operating_revenue" || kind === "loan_proceeds" ? "+" : "−";
}

export default async function LiveDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const state = await loadOrCreateSave();
  const detail = getReadonlyLiveDetail(state, id);
  if (!detail) notFound();
  const { event, participants, entries } = detail;
  return (
    <>
      <AppHeader title="Live" subtitle="契約と実績の読み取り専用。" />
      <main className="space-y-5 px-4 pt-4">
        <Link href="/manage/live" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="size-4" /> Live に戻る</Link>
        <section className="space-y-4 rounded-xl border border-[var(--stage-line)] bg-white p-4">
          <div><p className="text-xs tracking-wide text-[var(--stage-teal)]">{event.status}</p><h1 className="mt-1 font-[family-name:var(--font-display)] text-2xl text-[var(--stage-ink)]">{eventDisplayName(event)}</h1><p className="mt-1 text-sm text-muted-foreground">{event.date} JST · {event.id}</p></div>
          <dl className="grid grid-cols-2 gap-4 text-sm"><div><dt className="text-muted-foreground">特典会</dt><dd className="mt-1 font-medium">{event.chekiAllowed ? "契約上可" : "契約上不可"}</dd></div><div><dt className="text-muted-foreground">実出演</dt><dd className="mt-1 font-medium">{event.status === "RESOLVED" ? `${participants.length}名` : "未結算"}</dd></div></dl>
          {event.status === "RESOLVED" ? <div className="text-sm"><p className="text-muted-foreground">出演メンバー</p><p className="mt-1 font-medium text-[var(--stage-ink)]">{participants.length ? participants.join("・") : "記録なし"}</p></div> : <p className="rounded-lg bg-[var(--stage-mist)] p-3 text-sm leading-relaxed text-muted-foreground">契約の提示は演出完了を意味しません。到場、票務、Cheki、Performance の実績は、持久 Runtime 結算が接続された後にだけ表示します。</p>}
        </section>
        <section className="space-y-3 rounded-xl border border-[var(--stage-line)] bg-white p-4">
          <div><h2 className="font-medium text-[var(--stage-ink)]">Finance entries</h2><p className="mt-1 text-sm text-muted-foreground">この Live に紐づく確定済み仕訳。</p></div>
          {entries.length ? <ul className="divide-y divide-[var(--stage-line)] text-sm">{entries.map((entry) => <li key={entry.id} className="flex items-start justify-between gap-3 py-2"><span><span className="block text-xs text-muted-foreground">{entry.category}</span>{entry.note}</span><span className={ledgerDirection(entry.kind) === "+" ? "text-[var(--stage-teal)]" : "text-[var(--tier-blocking)]"}>{ledgerDirection(entry.kind)}{formatYen(entry.amount)}</span></li>)}</ul> : <p className="text-sm text-muted-foreground">確定済み仕訳はまだありません。</p>}
        </section>
      </main>
    </>
  );
}
