"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, Inbox, Users, Briefcase } from "lucide-react";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/inbox", label: "Inbox", icon: Inbox },
  { href: "/calendar", label: "Calendar", icon: CalendarDays },
  { href: "/members", label: "Members", icon: Users },
  { href: "/manage", label: "Manage", icon: Briefcase },
] as const;

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-[var(--stage-line)] bg-[var(--stage-paper)]/95 backdrop-blur-md"
    >
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
      </ul>
    </nav>
  );
}
