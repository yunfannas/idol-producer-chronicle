import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { InboxTierBadge } from "@/components/inbox/inbox-tier-badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { getInboxItem } from "@/lib/mock/inbox";

export default async function InboxDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const item = getInboxItem(id);
  if (!item) notFound();

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-[var(--stage-line)] bg-[var(--stage-paper)]/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-lg items-center gap-3 px-3 py-3">
          <Link
            href="/inbox"
            className="inline-flex size-8 items-center justify-center rounded-lg text-[var(--stage-ink)] transition-colors hover:bg-muted"
            aria-label="Back to Inbox"
          >
            <ArrowLeft className="size-5" />
          </Link>
          <div className="min-w-0">
            <p className="text-xs tracking-wide text-muted-foreground">
              Inbox · Detail
            </p>
            <p className="truncate text-sm font-medium text-[var(--stage-ink)]">
              Full page — not a modal
            </p>
          </div>
        </div>
      </header>

      <main className="space-y-6 px-4 py-5">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <InboxTierBadge tier={item.tier} />
            <span className="text-xs text-muted-foreground">
              {item.dateLabel}
            </span>
          </div>
          <h1 className="font-[family-name:var(--font-display)] text-2xl leading-snug tracking-tight text-[var(--stage-ink)]">
            {item.title}
          </h1>
          <p className="text-sm text-muted-foreground">{item.from}</p>
        </div>

        <Separator />

        <div className="space-y-4">
          {item.body.map((paragraph) => (
            <p
              key={paragraph.slice(0, 32)}
              className="text-[0.95rem] leading-relaxed text-[var(--stage-ink)]/90"
            >
              {paragraph}
            </p>
          ))}
        </div>

        {item.actions?.length ? (
          <section className="space-y-3 rounded-xl bg-[var(--stage-mist)] p-4">
            <h2 className="text-xs font-semibold tracking-[0.16em] text-[var(--stage-teal)] uppercase">
              Producer options
            </h2>
            <p className="text-sm text-muted-foreground">
              Attend / Delegate / Follow Policy — mock shell only; choices are
              not persisted yet.
            </p>
            <ul className="flex flex-col gap-2">
              {item.actions.map((action) => (
                <li key={action}>
                  <Button
                    type="button"
                    variant="outline"
                    className="h-auto w-full justify-start whitespace-normal px-3 py-2.5 text-left"
                    disabled
                  >
                    {action}
                  </Button>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <Link
          href="/inbox"
          className="inline-flex w-full items-center justify-center py-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          ← Back to Inbox
        </Link>
      </main>
    </>
  );
}
