import type { CalendarColor } from "@/types/calendar";

interface ColorStyle {
  dot: string;
  block: string;
  hoverBlock: string;
  border: string;
  text: string;
  accent: string;
  ring: string;
  swatch: string;
}

export const calendarColorStyles: Record<CalendarColor, ColorStyle> = {
  blue: {
    dot: "bg-blue-500",
    block: "bg-blue-50 dark:bg-blue-500/15",
    hoverBlock: "hover:bg-blue-100 dark:hover:bg-blue-500/25",
    border: "border-blue-200 dark:border-blue-500/30",
    text: "text-blue-700 dark:text-blue-300",
    accent: "accent-blue-600",
    ring: "ring-blue-400",
    swatch: "bg-blue-500",
  },
  green: {
    dot: "bg-emerald-500",
    block: "bg-emerald-50 dark:bg-emerald-500/15",
    hoverBlock: "hover:bg-emerald-100 dark:hover:bg-emerald-500/25",
    border: "border-emerald-200 dark:border-emerald-500/30",
    text: "text-emerald-700 dark:text-emerald-300",
    accent: "accent-emerald-600",
    ring: "ring-emerald-400",
    swatch: "bg-emerald-500",
  },
  purple: {
    dot: "bg-violet-500",
    block: "bg-violet-50 dark:bg-violet-500/15",
    hoverBlock: "hover:bg-violet-100 dark:hover:bg-violet-500/25",
    border: "border-violet-200 dark:border-violet-500/30",
    text: "text-violet-700 dark:text-violet-300",
    accent: "accent-violet-600",
    ring: "ring-violet-400",
    swatch: "bg-violet-500",
  },
  orange: {
    dot: "bg-amber-500",
    block: "bg-amber-50 dark:bg-amber-500/15",
    hoverBlock: "hover:bg-amber-100 dark:hover:bg-amber-500/25",
    border: "border-amber-200 dark:border-amber-500/30",
    text: "text-amber-700 dark:text-amber-300",
    accent: "accent-amber-600",
    ring: "ring-amber-400",
    swatch: "bg-amber-500",
  },
  pink: {
    dot: "bg-pink-500",
    block: "bg-pink-50 dark:bg-pink-500/15",
    hoverBlock: "hover:bg-pink-100 dark:hover:bg-pink-500/25",
    border: "border-pink-200 dark:border-pink-500/30",
    text: "text-pink-700 dark:text-pink-300",
    accent: "accent-pink-600",
    ring: "ring-pink-400",
    swatch: "bg-pink-500",
  },
  red: {
    dot: "bg-red-500",
    block: "bg-red-50 dark:bg-red-500/15",
    hoverBlock: "hover:bg-red-100 dark:hover:bg-red-500/25",
    border: "border-red-200 dark:border-red-500/30",
    text: "text-red-700 dark:text-red-300",
    accent: "accent-red-600",
    ring: "ring-red-400",
    swatch: "bg-red-500",
  },
  teal: {
    dot: "bg-teal-500",
    block: "bg-teal-50 dark:bg-teal-500/15",
    hoverBlock: "hover:bg-teal-100 dark:hover:bg-teal-500/25",
    border: "border-teal-200 dark:border-teal-500/30",
    text: "text-teal-700 dark:text-teal-300",
    accent: "accent-teal-600",
    ring: "ring-teal-400",
    swatch: "bg-teal-500",
  },
  indigo: {
    dot: "bg-indigo-500",
    block: "bg-indigo-50 dark:bg-indigo-500/15",
    hoverBlock: "hover:bg-indigo-100 dark:hover:bg-indigo-500/25",
    border: "border-indigo-200 dark:border-indigo-500/30",
    text: "text-indigo-700 dark:text-indigo-300",
    accent: "accent-indigo-600",
    ring: "ring-indigo-400",
    swatch: "bg-indigo-500",
  },
};
