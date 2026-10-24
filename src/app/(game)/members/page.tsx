import Image from "next/image";
import { AppHeader } from "@/components/shell/app-header";
import { MOCK_MEMBERS } from "@/lib/mock/members";

export default function MembersPage() {
  return (
    <>
      <AppHeader
        title="Members"
        subtitle="序章創設メンバー三人。詳細カードは後続スライス。"
      />
      <main className="px-4 pt-2">
        <ul className="divide-y divide-[var(--stage-line)]">
          {MOCK_MEMBERS.map((member, index) => (
            <li
              key={member.id}
              className="flex gap-4 py-5 animate-in fade-in fill-mode-both"
              style={{ animationDelay: `${index * 60}ms` }}
            >
              <div
                aria-hidden
                className="relative size-14 shrink-0 overflow-hidden rounded-xl bg-[var(--stage-mist)]"
              >
                <Image
                  alt=""
                  src={member.portraitSrc}
                  fill
                  sizes="56px"
                  className="object-cover"
                />
              </div>
              <div className="min-w-0 space-y-1">
                <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                  <h2 className="font-[family-name:var(--font-display)] text-xl text-[var(--stage-ink)]">
                    {member.nameJa}
                  </h2>
                  <span className="text-xs text-muted-foreground">
                    {member.nameReading}
                  </span>
                </div>
                <p className="text-xs text-[var(--stage-teal)]">{member.role}</p>
                <p className="text-xs text-muted-foreground">
                  誕生日 {member.birthdate} · {member.id}
                </p>
                <p className="pt-1 text-sm leading-relaxed text-muted-foreground">
                  {member.note}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </main>
    </>
  );
}
