import { Badge } from "@/components/ui/badge";
import type { InboxTier } from "@/lib/mock/types";
import { cn } from "@/lib/utils";

const TIER_META: Record<
  InboxTier,
  { label: string; className: string }
> = {
  blocking: {
    label: "Blocking",
    className:
      "border-transparent bg-[var(--tier-blocking)] text-[var(--stage-paper)]",
  },
  actionable: {
    label: "Actionable",
    className:
      "border-transparent bg-[var(--tier-actionable)]/15 text-[var(--tier-actionable)]",
  },
  report: {
    label: "Report",
    className:
      "border-transparent bg-[var(--tier-report)]/15 text-[var(--tier-report)]",
  },
  ambient: {
    label: "Ambient",
    className:
      "border-transparent bg-[var(--tier-ambient)]/20 text-[var(--stage-ink)]/70",
  },
};

export function InboxTierBadge({
  tier,
  className,
}: {
  tier: InboxTier;
  className?: string;
}) {
  const meta = TIER_META[tier];
  return (
    <Badge className={cn(meta.className, className)}>{meta.label}</Badge>
  );
}
