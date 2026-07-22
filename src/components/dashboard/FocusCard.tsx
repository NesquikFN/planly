import { Target } from "lucide-react";
import type { FocusTask } from "@/types/focus";

interface FocusCardProps {
  focus: FocusTask;
}

export function FocusCard({ focus }: FocusCardProps) {
  return (
    <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900">Фокус дня</h3>
        <Target size={16} className="text-gray-300" />
      </div>
      <p className="mt-3 text-xs text-gray-400">Сфокусируйтесь на самом важном</p>
      <p className="mt-3 text-base font-semibold leading-snug text-gray-900">
        {focus.title}
      </p>
      <p className="mt-2 inline-block border-b-2 border-amber-400 pb-0.5 text-sm font-medium text-gray-500">
        {focus.time}
      </p>
    </section>
  );
}
