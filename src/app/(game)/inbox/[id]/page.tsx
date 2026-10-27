import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ChevronRight } from "lucide-react";
import { startTestRouteAction } from "@/app/actions/advance-day";
import { InboxTierBadge } from "@/components/inbox/inbox-tier-badge";
import { Separator } from "@/components/ui/separator";
import { getInboxItem } from "@/lib/presentation/prologue-ui";
import { loadOrCreateSave } from "@/lib/runtime/save-repository.server";

function DetailHeader({ label }: { label: string }) {
  return (
    <header className="sticky top-0 z-30 border-b border-[var(--stage-line)] bg-[var(--stage-paper)]/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-lg items-center gap-3 px-3 py-3">
        <Link href="/inbox" className="inline-flex size-8 items-center justify-center rounded-lg text-[var(--stage-ink)] transition-colors hover:bg-muted" aria-label="Inbox に戻る">
          <ArrowLeft className="size-5" />
        </Link>
        <div className="min-w-0">
          <p className="text-xs tracking-wide text-muted-foreground">Inbox · Detail</p>
          <p className="truncate text-sm font-medium text-[var(--stage-ink)]">{label}</p>
        </div>
      </div>
    </header>
  );
}

function OpeningDecisionEditor() {
  return (
    <section className="space-y-4">
      <div>
        <h2 className="font-[family-name:var(--font-display)] text-xl text-[var(--stage-ink)]">契約メンバーを確認する</h2>
        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
          15名の統一面接を記録したうえで、下記人数を正式契約します。選んだ人数はそのまま保存済み roster と初期制作費に反映されます。
        </p>
      </div>
      <form action={startTestRouteAction} className="space-y-3 rounded-xl border border-[var(--stage-line)] bg-white p-4">
        <fieldset className="space-y-2">
          <legend className="text-xs font-semibold tracking-[0.14em] text-[var(--stage-teal)] uppercase">Initial roster</legend>
          {[3, 5, 9, 15].map((size) => (
            <label key={size} className="flex cursor-pointer items-center justify-between rounded-lg border border-[var(--stage-line)] px-3 py-3 has-checked:border-[var(--stage-teal)] has-checked:bg-[var(--stage-mist)]">
              <span>
                <span className="font-medium text-[var(--stage-ink)]">{size}名で開始</span>
                <span className="ml-2 text-xs text-muted-foreground">創設3名を含む</span>
              </span>
              <input type="radio" name="rosterSize" value={size} defaultChecked={size === 9} className="accent-[var(--stage-teal)]" />
            </label>
          ))}
        </fieldset>
        <p className="text-xs leading-relaxed text-muted-foreground">
          R1 の日常調整は承認済み Staff 方針で開始します。章固定の R2–R4 はこの画面では変更しません。
        </p>
        <button type="submit" className="inline-flex h-10 w-full items-center justify-center gap-1 rounded-lg bg-[var(--stage-ink)] px-3 text-sm font-medium text-[var(--stage-paper)] hover:opacity-90">
          契約と初期制作を確定する <ChevronRight className="size-4" />
        </button>
      </form>
    </section>
  );
}

export default async function InboxDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const state = await loadOrCreateSave();
  const item = getInboxItem(state, id);
  if (!item) notFound();

  return (
    <>
      <DetailHeader label={item.tier === "blocking" ? "Decision" : "Record"} />
      <main className="space-y-6 px-4 py-5">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2"><InboxTierBadge tier={item.tier} /><span className="text-xs text-muted-foreground">{item.dateLabel}</span></div>
          <h1 className="font-[family-name:var(--font-display)] text-2xl leading-snug tracking-tight text-[var(--stage-ink)]">{item.title}</h1>
          <p className="text-sm text-muted-foreground">{item.from}</p>
        </div>
        <Separator />
        <div className="space-y-4">
          {item.body.map((paragraph) => <p key={paragraph} className="text-[0.95rem] leading-relaxed text-[var(--stage-ink)]/90">{paragraph}</p>)}
        </div>
        {id === "decision-opening" ? <OpeningDecisionEditor /> : null}
        {id !== "decision-opening" && item.action ? (
          <Link href={item.action.href} className="inline-flex h-10 w-full items-center justify-center gap-1 rounded-lg bg-[var(--stage-ink)] px-3 text-sm font-medium text-[var(--stage-paper)] hover:opacity-90">
            {item.action.label} <ChevronRight className="size-4" />
          </Link>
        ) : null}
        <Link href="/inbox" className="inline-flex w-full items-center justify-center py-2 text-sm text-muted-foreground hover:text-foreground">← Inbox に戻る</Link>
      </main>
    </>
  );
}
