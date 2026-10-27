import { AppHeader } from "@/components/shell/app-header";
import { loadOrCreateSave } from "@/lib/runtime/save-repository.server";

export const dynamic = "force-dynamic";

export default async function IdolsPage() {
  const state = await loadOrCreateSave();
  return (
    <>
      <AppHeader title="Idols" subtitle="現在のメンバーと契約記録。" />
      <main className="px-4 pt-2"><ul className="divide-y divide-[var(--stage-line)]">{state.members.map((member) => <li key={member.id} className="py-4"><p className="font-[family-name:var(--font-display)] text-xl text-[var(--stage-ink)]">{member.nameJa}</p><p className="mt-1 text-sm text-muted-foreground">{member.active ? "在籍" : "卒業"} · 契約 {member.contractEndsOn}</p></li>)}</ul></main>
    </>
  );
}
