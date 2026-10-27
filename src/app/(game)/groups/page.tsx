import { AppHeader } from "@/components/shell/app-header";
import { loadOrCreateSave } from "@/lib/runtime/save-repository.server";

export const dynamic = "force-dynamic";

export default async function GroupsPage() {
  const state = await loadOrCreateSave();
  const active = state.members.filter((member) => member.active).length;
  return (
    <>
      <AppHeader title="Groups" subtitle="現在章で必要なグループ情報。" />
      <main className="space-y-4 px-4 pt-3"><section className="rounded-xl border border-[var(--stage-line)] bg-white p-4"><p className="text-xs tracking-wide text-[var(--stage-teal)]">CHRONICLE / PROLOGUE</p><h2 className="mt-1 font-[family-name:var(--font-display)] text-2xl text-[var(--stage-ink)]">現在のチーム</h2><p className="mt-2 text-sm leading-relaxed text-muted-foreground">在籍 {active}名。共演者や他グループは、現在の契約・日程に必要な範囲だけで表示されます。</p></section></main>
    </>
  );
}
