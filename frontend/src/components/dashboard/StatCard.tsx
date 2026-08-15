import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type StatTone = "red" | "amber" | "blue" | "gray" | "green" | "purple";

// Light theme keeps its existing per-tone icon colors. Dark theme is
// intentionally near-monochrome — every icon is the same muted tone, and the
// one thing that changes on selection is the accent underline, never a
// colored fill. No card chrome (border/bg/shadow) at all: this sits directly
// on the page as a labeled number, not a boxed widget — "cards only where
// they truly separate information" from the design-system brief.
const toneStyles: Record<StatTone, { icon: string }> = {
  red: { icon: "text-red-500 dark:text-ink-faint" },
  amber: { icon: "text-amber-500 dark:text-ink-faint" },
  blue: { icon: "text-blue-600 dark:text-ink-faint" },
  gray: { icon: "text-gray-500 dark:text-ink-faint" },
  green: { icon: "text-emerald-600 dark:text-ink-faint" },
  purple: { icon: "text-violet-600 dark:text-ink-faint" },
};

interface StatCardProps {
  label: string;
  value: number;
  valueSuffix?: string;
  icon: LucideIcon;
  tone: StatTone;
  active?: boolean;
  onClick?: () => void;
  interactive?: boolean;
}

export function StatCard({ label, value, valueSuffix, icon: Icon, tone, active, onClick, interactive = false }: StatCardProps) {
  const styles = toneStyles[tone];

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "flex items-center gap-3 rounded-lg border-b-2 px-1 py-2 text-left transition-colors",
        active ? "border-accent" : "border-transparent hover:border-gray-200 dark:hover:border-white/10",
        interactive && "cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-canvas",
      )}
    >
      <Icon size={17} className={cn("shrink-0", styles.icon)} />
      <div className="min-w-0">
        <p className="text-2xl font-semibold leading-none tabular-nums text-gray-900 dark:text-ink">
          {value}
          {valueSuffix}
        </p>
        <p className="mt-1.5 truncate text-xs font-medium text-gray-500 dark:text-ink-faint">{label}</p>
      </div>
    </button>
  );
}
