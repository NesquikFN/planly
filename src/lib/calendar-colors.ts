import type { CalendarColor } from "@/types/calendar";

interface ColorStyle {
  dot: string;
  block: string;
  border: string;
  text: string;
  accent: string;
  ring: string;
  swatch: string;
}

export const calendarColorStyles: Record<CalendarColor, ColorStyle> = {
  blue: {
    dot: "bg-blue-500",
    block: "bg-blue-50",
    border: "border-blue-200",
    text: "text-blue-700",
    accent: "accent-blue-600",
    ring: "ring-blue-400",
    swatch: "bg-blue-500",
  },
  green: {
    dot: "bg-emerald-500",
    block: "bg-emerald-50",
    border: "border-emerald-200",
    text: "text-emerald-700",
    accent: "accent-emerald-600",
    ring: "ring-emerald-400",
    swatch: "bg-emerald-500",
  },
  purple: {
    dot: "bg-violet-500",
    block: "bg-violet-50",
    border: "border-violet-200",
    text: "text-violet-700",
    accent: "accent-violet-600",
    ring: "ring-violet-400",
    swatch: "bg-violet-500",
  },
  orange: {
    dot: "bg-amber-500",
    block: "bg-amber-50",
    border: "border-amber-200",
    text: "text-amber-700",
    accent: "accent-amber-600",
    ring: "ring-amber-400",
    swatch: "bg-amber-500",
  },
  pink: {
    dot: "bg-pink-500",
    block: "bg-pink-50",
    border: "border-pink-200",
    text: "text-pink-700",
    accent: "accent-pink-600",
    ring: "ring-pink-400",
    swatch: "bg-pink-500",
  },
  red: {
    dot: "bg-red-500",
    block: "bg-red-50",
    border: "border-red-200",
    text: "text-red-700",
    accent: "accent-red-600",
    ring: "ring-red-400",
    swatch: "bg-red-500",
  },
  teal: {
    dot: "bg-teal-500",
    block: "bg-teal-50",
    border: "border-teal-200",
    text: "text-teal-700",
    accent: "accent-teal-600",
    ring: "ring-teal-400",
    swatch: "bg-teal-500",
  },
  indigo: {
    dot: "bg-indigo-500",
    block: "bg-indigo-50",
    border: "border-indigo-200",
    text: "text-indigo-700",
    accent: "accent-indigo-600",
    ring: "ring-indigo-400",
    swatch: "bg-indigo-500",
  },
};
