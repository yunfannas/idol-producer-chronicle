import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { InboxTierBadge } from "@/components/inbox/inbox-tier-badge";
import type { ChronicleInboxItem, InboxTier } from "@/lib/presentation/prologue-ui";

const TIER_ORDER: InboxTier[] = [
  "blocking",
  "actionable",
  "report",
  "ambient",
];

function sortItems(items: ChronicleInboxItem[]) {
  return [...items].sort(
    (a, b) => TIER_ORDER.indexOf(a.tier) - TIER_ORDER.indexOf(b.tier),
  );
}

export function InboxList({ items }: { items: ChronicleInboxItem[] }) {
  const sorted = sortItems(items);
  if (!sorted.length) {
    return (
      <div className="flex flex-col gap-4 py-12 text-center">
        <p className="font-[family-name:var(--font-display)] text-xl text-[var(--stage-ink)]">
          受信トレイは空です
        </p>
        <p className="mx-auto max-w-xs text-sm leading-relaxed text-muted-foreground">
          いま決めるべき Blocking も、週評もありません。Staff
          が通常業務を進めているあいだ、翌日へ進めて構いません。
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <ul className="divide-y divide-[var(--stage-line)]">
        {sorted.map((item) => (
          <li key={item.id}>
            <Link
              href={item.href}
              className="group flex items-start gap-3 py-4 transition-colors hover:bg-[var(--stage-mist)]/60"
            >
              <div className="min-w-0 flex-1 space-y-1.5 px-1">
                <div className="flex flex-wrap items-center gap-2">
                  <InboxTierBadge tier={item.tier} />
                  <span className="text-xs text-muted-foreground">
                    {item.dateLabel}
                  </span>
                </div>
                <p className="font-medium leading-snug text-[var(--stage-ink)] group-hover:text-[var(--stage-teal)]">
                  {item.title}
                </p>
                <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">
                  {item.summary}
                </p>
                <p className="text-xs text-muted-foreground/80">{item.from}</p>
              </div>
              <ChevronRight className="mt-1 size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-[var(--stage-teal)]" />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
