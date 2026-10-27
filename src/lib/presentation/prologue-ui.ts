import type { LedgerEntry, PrologueState, RuntimeEvent } from "@/lib/runtime/types";

export type InboxTier = "blocking" | "actionable" | "report" | "ambient";

export type ChronicleInboxItem = {
  id: string;
  tier: InboxTier;
  title: string;
  summary: string;
  body: string[];
  from: string;
  dateLabel: string;
  href: string;
  action?: { label: string; href: string };
};

export type ReadonlyLiveDetail = {
  event: RuntimeEvent;
  participants: string[];
  entries: LedgerEntry[];
};

export function formatYen(amount: number) {
  return `¥${amount.toLocaleString("ja-JP")}`;
}

function eventLabel(event: RuntimeEvent) {
  return event.kind === "debut" ? "デビュー公演" : event.kind === "free-mall" ? "無料公開 Live" : event.kind === "experimental-regular" ? "試験定期" : event.kind === "regular" ? "定期公演" : event.kind === "one-man" ? "1st One-man" : event.kind === "festival" ? "TIF" : event.kind === "graduation" ? "卒業公演" : "対バン Live";
}

function dateLabel(date: string) {
  return `${date} JST`;
}

/**
 * Builds the Inbox from persisted Scenario, event and ledger facts.  It is a
 * read model only: reports can link to a decision, but never mutate state.
 */
export function buildInbox(state: PrologueState): ChronicleInboxItem[] {
  const items: ChronicleInboxItem[] = [];
  if (!state.gates.G01) {
    items.push({
      id: "decision-opening",
      tier: "blocking",
      title: "創立会議：最初の契約メンバーを決める",
      summary: "15名の統一面接記録を確認し、最初の正式契約人数を決定します。",
      body: [
        "この決定は、統一面接の記録、契約メンバー、初期制作費を一つの保存済み Scenario state に反映します。",
        "通常運営の方針は、承認済みの Staff 運用を引き継ぎます。ここで R2–R4 を編集することはできません。",
      ],
      from: "会社・創立会議",
      dateLabel: dateLabel(state.date),
      href: "/inbox/decision-opening",
      action: { label: "会議を開く", href: "/inbox/decision-opening" },
    });
  }

  if (state.gates.G03) {
    items.push({
      id: "report-opening",
      tier: "report",
      title: "開局実行記録：契約と制作を反映しました",
      summary: `${state.members.filter((member) => member.active).length}名の契約と、初期制作の台帳を確認できます。`,
      body: [
        "このレポートは保存済みの契約メンバーと Finance ledger から作成されています。",
        "レポート自身は状態を変更しません。次の操作が必要な場合のみ、対応する会議へ移動します。",
      ],
      from: "Staff 実行記録",
      dateLabel: dateLabel(state.date),
      href: "/inbox/report-opening",
      action: { label: "レポートを開く", href: "/reports/opening" },
    });
  }

  for (const report of [...state.monthlyReports].reverse()) {
    items.push({
      id: `report-month-${report.month}`,
      tier: "report",
      title: `${report.month} 月次運営レポート`,
      summary: `期首 ${formatYen(report.openingCash)} → 期末 ${formatYen(report.closingCash)}。`,
      body: ["収益・費用・資産・借入の区分は、対象月の Finance ledger から集計しています。"],
      from: "Finance / Staff Weekly Review",
      dateLabel: `${report.month} JST`,
      href: `/inbox/report-month-${report.month}`,
      action: { label: "月次レポートを開く", href: `/reports/month-${report.month}` },
    });
  }

  for (const event of state.events.filter((item) => item.status === "OFFERED")) {
    items.push({
      id: `event-${event.id}`,
      tier: "blocking",
      title: `${eventLabel(event)}：契約の実行待ち`,
      summary: "契約は Staff が提示済みです。Live の持久 Runtime 結算が接続されるまで、実績は記録しません。",
      body: [
        "契約の Offer は演出完了ではありません。到場、票務、Cheki、Performance の実績をここで推測してはいけません。",
        "現在は契約内容と既に存在する台帳のみを閲覧できます。",
      ],
      from: "Live Desk",
      dateLabel: dateLabel(event.date),
      href: `/inbox/event-${event.id}`,
      action: { label: "Live 詳細を読む", href: `/manage/live/${event.id}` },
    });
  }

  for (const event of state.events.filter((item) => item.status === "RESOLVED").slice(-3).reverse()) {
    items.push({
      id: `settled-${event.id}`,
      tier: "report",
      title: `${eventLabel(event)}：結算記録`,
      summary: "完了済み Live の参加メンバーと、この Live に紐づく台帳を確認できます。",
      body: ["可観測な契約・台帳事実のみを表示します。内部 Performance や転化原因は表示しません。"],
      from: "Live Report",
      dateLabel: dateLabel(event.date),
      href: `/inbox/settled-${event.id}`,
      action: { label: "Live Report を開く", href: `/reports/live-${event.id}` },
    });
  }

  const order: Record<InboxTier, number> = { blocking: 0, actionable: 1, report: 2, ambient: 3 };
  return items.sort((left, right) => order[left.tier] - order[right.tier]);
}

export function getInboxItem(state: PrologueState, id: string) {
  return buildInbox(state).find((item) => item.id === id);
}

export function getReadonlyLiveDetail(state: PrologueState, eventId: string): ReadonlyLiveDetail | undefined {
  const event = state.events.find((item) => item.id === eventId);
  if (!event || event.status === "DORMANT" || event.status === "ELIGIBLE") return undefined;
  return {
    event,
    participants: event.participantIds.map((memberId) => state.members.find((member) => member.id === memberId)?.nameJa ?? memberId),
    entries: state.finance.entries.filter((entry) => entry.eventId === eventId),
  };
}

export function eventDisplayName(event: RuntimeEvent) {
  return eventLabel(event);
}
