import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { MANAGE_MODULES } from "@/lib/mock/manage";

export default async function ManageModulePage({
  params,
}: {
  params: Promise<{ module: string }>;
}) {
  const { module: moduleId } = await params;
  const mod = MANAGE_MODULES.find((m) => m.id === moduleId);
  if (!mod) notFound();

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-[var(--stage-line)] bg-[var(--stage-paper)]/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-lg items-center gap-3 px-3 py-3">
          <Link
            href="/manage"
            className="inline-flex size-8 items-center justify-center rounded-lg text-[var(--stage-ink)] transition-colors hover:bg-muted"
            aria-label="Back to Manage"
          >
            <ArrowLeft className="size-5" />
          </Link>
          <div>
            <p className="text-xs tracking-wide text-muted-foreground">
              Manage
            </p>
            <h1 className="font-[family-name:var(--font-display)] text-lg text-[var(--stage-ink)]">
              {mod.nameJa}
            </h1>
          </div>
        </div>
      </header>
      <main className="space-y-4 px-4 py-8">
        <p className="text-sm tracking-wide text-[var(--stage-teal)]">
          {mod.nameEn}
        </p>
        <p className="text-[0.95rem] leading-relaxed text-[var(--stage-ink)]/90">
          {mod.blurb}
        </p>
        <p className="text-sm leading-relaxed text-muted-foreground">
          このモジュールの会議・実行 UI
          はまだ接続していません。Performance エンジン、実 Live
          シミュレーション、認証、データベース、idol-data-lab
          同期は本 PR の範囲外です。
        </p>
        <Link
          href="/manage"
          className="inline-flex text-sm text-muted-foreground hover:text-foreground"
        >
          ← Back to Manage
        </Link>
      </main>
    </>
  );
}
