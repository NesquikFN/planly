import type { LucideIcon } from "lucide-react";

export type StatTone = "red" | "amber" | "blue" | "gray" | "green" | "purple";

const toneStyles: Record<
  StatTone,
  { label: string; iconWrap: string; icon: string; activeBorder: string }
> = {
  red: {
    label: "text-red-500",
    iconWrap: "bg-red-50 dark:bg-red-500/10",
    icon: "text-red-500",
    activeBorder: "border-red-300 dark:border-red-500/60",
  },
  amber: {
    label: "text-amber-500",
    iconWrap: "bg-amber-50 dark:bg-amber-500/10",
    icon: "text-amber-500",
    activeBorder: "border-amber-300 dark:border-amber-500/60",
  },
  blue: {
    label: "text-blue-600",
    iconWrap: "bg-blue-50 dark:bg-blue-500/10",
    icon: "text-blue-600 dark:text-blue-400",
    activeBorder: "border-blue-300 dark:border-blue-500/60",
  },
  gray: {
    label: "text-gray-500",
    iconWrap: "bg-gray-100 dark:bg-gray-800",
    icon: "text-gray-500 dark:text-gray-400",
    activeBorder: "border-gray-400 dark:border-gray-500",
  },
  green: {
    label: "text-emerald-600",
    iconWrap: "bg-emerald-50 dark:bg-emerald-500/10",
    icon: "text-emerald-600 dark:text-emerald-400",
    activeBorder: "border-emerald-300 dark:border-emerald-500/60",
  },
  purple: {
    label: "text-violet-600",
    iconWrap: "bg-violet-50 dark:bg-violet-500/10",
    icon: "text-violet-600 dark:text-violet-400",
    activeBorder: "border-violet-300 dark:border-violet-500/60",
  },
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
      className={`flex w-full items-start justify-between rounded-2xl border bg-white p-5 text-left shadow-sm transition-[border-color,box-shadow,transform] dark:bg-gray-900 ${
        active ? `${styles.activeBorder} shadow-md` : "border-gray-100 dark:border-gray-800"
      } ${
        interactive
          ? "cursor-pointer hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-950"
          : ""
      }`}
    >
      <div>
        <p className={`text-sm font-medium ${styles.label}`}>{label}</p>
        <p className="mt-2 text-3xl font-semibold text-gray-900 dark:text-gray-50">
          {value}
          {valueSuffix}
        </p>
      </div>
      <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${styles.iconWrap}`}>
        <Icon size={18} className={styles.icon} />
      </div>
    </button>
  );
}
