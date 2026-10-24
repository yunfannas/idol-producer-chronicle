import { AppHeader } from "@/components/shell/app-header";
import { InboxList } from "@/components/inbox/inbox-list";
import { MOCK_INBOX } from "@/lib/mock/inbox";

export default function InboxPage() {
  return (
    <>
      <AppHeader
        title="Inbox"
        subtitle="Producer の作業台。Blocking から Ambient まで。"
        showAdvance
      />
      <main className="px-4 pt-2">
        <InboxList initialItems={MOCK_INBOX} />
      </main>
    </>
  );
}
