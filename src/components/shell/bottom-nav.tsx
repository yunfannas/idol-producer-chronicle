"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { CalendarDays, Inbox, Users, UsersRound, Menu, X, Briefcase, MicVocal, Music2, GraduationCap, WalletCards, SlidersHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/inbox", label: "Inbox", icon: Inbox },
  { href: "/calendar", label: "Calendar", icon: CalendarDays },
  { href: "/idols", label: "Idols", icon: Users },
  { href: "/groups", label: "Groups", icon: UsersRound },
] as const;

const MODULES = [
  { href: "/manage/making", label: "Making", icon: Music2 },
  { href: "/manage/training", label: "Training", icon: Briefcase },
  { href: "/manage/live", label: "Live", icon: MicVocal },
  { href: "/manage/audition", label: "Audition", icon: GraduationCap },
  { href: "/manage/finance", label: "Finance", icon: WalletCards },
  { href: "/manage/policy", label: "Policy", icon: SlidersHorizontal },
] as const;

export function BottomNav() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-[var(--stage-line)] bg-[var(--stage-paper)]/95 backdrop-blur-md"
    >
      {menuOpen ? <button aria-label="Close menu" className="fixed inset-0 -z-10 bg-[var(--stage-ink)]/25" onClick={() => setMenuOpen(false)} /> : null}
      {menuOpen ? (
        <section aria-label="Menu" className="absolute inset-x-0 bottom-full border-t border-[var(--stage-line)] bg-[var(--stage-paper)] px-4 pb-4 pt-3 shadow-2xl">
          <div className="mx-auto max-w-lg">
            <div className="mb-3 flex items-center justify-between"><p className="text-xs font-semibold tracking-[0.16em] text-[var(--stage-teal)] uppercase">Menu</p><button type="button" aria-label="Close menu" className="inline-flex size-9 items-center justify-center rounded-lg hover:bg-muted" onClick={() => setMenuOpen(false)}><X className="size-4" /></button></div>
            <div className="grid grid-cols-3 gap-2">{MODULES.map(({ href, label, icon: Icon }) => <Link key={href} href={href} onClick={() => setMenuOpen(false)} className="flex min-h-16 flex-col items-center justify-center gap-1 rounded-lg bg-white text-xs font-medium text-[var(--stage-ink)] hover:bg-[var(--stage-mist)]"><Icon className="size-4 text-[var(--stage-teal)]" />{label}</Link>)}</div>
          </div>
        </section>
      ) : null}
      <ul className="mx-auto flex h-[4.25rem] max-w-lg items-stretch justify-around px-2 pb-[env(safe-area-inset-bottom)]">
        {TABS.map(({ href, label, icon: Icon }) => {
          const active =
            pathname === href || pathname.startsWith(`${href}/`);
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                className={cn(
                  "flex h-full flex-col items-center justify-center gap-1 text-[0.7rem] font-medium tracking-wide transition-colors",
                  active
                    ? "text-[var(--stage-teal)]"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Icon
                  className={cn(
                    "size-5 transition-transform",
                    active && "scale-105",
                  )}
                  strokeWidth={active ? 2.25 : 1.75}
                />
                {label}
              </Link>
            </li>
          );
        })}
        <li className="flex-1"><button type="button" aria-expanded={menuOpen} aria-label="Open menu" onClick={() => setMenuOpen((open) => !open)} className={cn("flex h-full w-full flex-col items-center justify-center gap-1 text-[0.7rem] font-medium tracking-wide transition-colors", menuOpen || pathname.startsWith("/manage") ? "text-[var(--stage-teal)]" : "text-muted-foreground hover:text-foreground")}><Menu className="size-5" strokeWidth={menuOpen || pathname.startsWith("/manage") ? 2.25 : 1.75} />Menu</button></li>
      </ul>
    </nav>
  );
}
