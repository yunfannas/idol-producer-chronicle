import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { AppHeader } from "@/components/shell/app-header";
import { MANAGE_MODULES } from "@/lib/mock/manage";

export default function ManagePage() {
  return (
    <>
      <AppHeader
        title="Manage"
        subtitle="六大モジュール。いまはナビのみ。"
      />
      <main className="px-4 pt-2">
        <ul className="divide-y divide-[var(--stage-line)]">
          {MANAGE_MODULES.map((mod) => (
            <li key={mod.id}>
              <Link
                href={`/manage/${mod.id}`}
                className="group flex items-center gap-3 py-4 transition-colors hover:bg-[var(--stage-mist)]/60"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-[family-name:var(--font-display)] text-lg text-[var(--stage-ink)] group-hover:text-[var(--stage-teal)]">
                    {mod.nameJa}
                  </p>
                  <p className="text-xs tracking-wide text-muted-foreground">
                    {mod.nameEn}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {mod.blurb}
                  </p>
                </div>
                <ChevronRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
              </Link>
            </li>
          ))}
        </ul>
      </main>
    </>
  );
}
