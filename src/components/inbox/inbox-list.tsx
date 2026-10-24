"use client";

import Link from "next/link";
import { useState } from "react";
import { ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { InboxTierBadge } from "@/components/inbox/inbox-tier-badge";
import type { InboxItem } from "@/lib/mock/types";

type LoadState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "empty" }
  | { status: "ready"; items: InboxItem[] };

const TIER_ORDER: InboxItem["tier"][] = [
  "blocking",
  "actionable",
  "report",
  "ambient",
];

function sortItems(items: InboxItem[]) {
  return [...items].sort(
    (a, b) => TIER_ORDER.indexOf(a.tier) - TIER_ORDER.indexOf(b.tier),
  );
}

export function InboxList({ initialItems }: { initialItems: InboxItem[] }) {
  const [state, setState] = useState<LoadState>({
    status: "ready",
    items: sortItems(initialItems),
  });

  async function load(query = "") {
    setState({ status: "loading" });
    try {
      const res = await fetch(`/api/inbox${query}`, { cache: "no-store" });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as {
          error?: string;
        } | null;
        throw new Error(data?.error ?? "Could not reach the Inbox channel.");
      }
      const data = (await res.json()) as { items: InboxItem[] };
      if (!data.items.length) {
        setState({ status: "empty" });
        return;
      }
      setState({ status: "ready", items: sortItems(data.items) });
    } catch (err) {
      setState({
        status: "error",
        message: err instanceof Error ? err.message : "Inbox request failed.",
      });
    }
  }

  if (state.status === "loading") {
    return (
      <div className="space-y-3" aria-busy="true" aria-label="Loading inbox">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="space-y-2 border-b border-[var(--stage-line)] py-4"
          >
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-full" />
          </div>
        ))}
      </div>
    );
  }

  if (state.status === "error") {
    return (
      <div className="flex flex-col gap-4 py-10 text-center">
        <p className="font-[family-name:var(--font-display)] text-lg text-[var(--stage-ink)]">
          Inbox unreachable
        </p>
        <p className="text-sm text-muted-foreground">{state.message}</p>
        <Button
          type="button"
          variant="outline"
          className="mx-auto"
          onClick={() => void load()}
        >
          Retry
        </Button>
      </div>
    );
  }

  if (state.status === "empty") {
    return (
      <div className="flex flex-col gap-4 py-12 text-center">
        <p className="font-[family-name:var(--font-display)] text-xl text-[var(--stage-ink)]">
          受信トレイは空です
        </p>
        <p className="mx-auto max-w-xs text-sm leading-relaxed text-muted-foreground">
          いま決めるべき Blocking も、週評もありません。Staff
          が通常業務を進めているあいだ、翌日へ進めて構いません。
        </p>
        <Button
          type="button"
          variant="outline"
          className="mx-auto"
          onClick={() => void load()}
        >
          Restore sample feed
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <ul className="divide-y divide-[var(--stage-line)]">
        {state.items.map((item) => (
          <li key={item.id}>
            <Link
              href={`/inbox/${item.id}`}
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
      <div className="flex flex-wrap gap-3 pt-4">
        <button
          type="button"
          className="text-xs text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
          onClick={() => void load("?empty=1")}
        >
          Preview empty Inbox
        </button>
        <button
          type="button"
          className="text-xs text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
          onClick={() => void load("?fail=1")}
        >
          Preview error state
        </button>
      </div>
    </div>
  );
}
