import { AppHeader } from "@/components/shell/app-header";
import { InboxList } from "@/components/inbox/inbox-list";
import { buildInbox } from "@/lib/presentation/prologue-ui";
import { loadOrCreateSave } from "@/lib/runtime/save-repository.server";

export const dynamic = "force-dynamic";

export default async function InboxPage() {
  const state = await loadOrCreateSave();
  return (
    <>
      <AppHeader
        title="Inbox"
        subtitle="決定、実行記録、報告の入口。"
        showAdvance
      />
      <main className="px-4 pt-2">
        <InboxList items={buildInbox(state)} />
      </main>
    </>
  );
}
