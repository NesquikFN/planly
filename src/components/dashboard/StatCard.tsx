import type { LucideIcon } from "lucide-react";

export type StatTone = "red" | "amber" | "blue" | "gray";

const toneStyles: Record<
  StatTone,
  { label: string; iconWrap: string; icon: string; activeBorder: string }
> = {
  red: {
    label: "text-red-500",
    iconWrap: "bg-red-50",
    icon: "text-red-500",
    activeBorder: "border-red-300",
  },
  amber: {
    label: "text-amber-500",
    iconWrap: "bg-amber-50",
    icon: "text-amber-500",
    activeBorder: "border-amber-300",
  },
  blue: {
    label: "text-blue-600",
    iconWrap: "bg-blue-50",
    icon: "text-blue-600",
    activeBorder: "border-blue-300",
  },
  gray: {
    label: "text-gray-500",
    iconWrap: "bg-gray-100",
    icon: "text-gray-500",
    activeBorder: "border-gray-400",
  },
};

interface StatCardProps {
  label: string;
  value: number;
  icon: LucideIcon;
  tone: StatTone;
  active?: boolean;
  onClick?: () => void;
}

export function StatCard({ label, value, icon: Icon, tone, active, onClick }: StatCardProps) {
  const styles = toneStyles[tone];

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`flex w-full items-start justify-between rounded-2xl border bg-white p-5 text-left shadow-sm transition-colors ${
        active ? styles.activeBorder : "border-gray-100"
      }`}
    >
      <div>
        <p className={`text-sm font-medium ${styles.label}`}>{label}</p>
        <p className="mt-2 text-3xl font-semibold text-gray-900">{value}</p>
      </div>
      <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${styles.iconWrap}`}>
        <Icon size={18} className={styles.icon} />
      </div>
    </button>
  );
}
