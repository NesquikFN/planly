"use client";

import { ArrowRight, Clock3 } from "lucide-react";
import { settingsSectionTitle } from "@/lib/settings-form-styles";
import type { HelpGuide } from "@/types/help";

interface HelpGuidesProps {
  guides: HelpGuide[];
  onOpenGuide: (guide: HelpGuide) => void;
}

const levelStyles: Record<HelpGuide["level"], string> = {
  Начальный: "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400",
  Средний: "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400",
  Продвинутый: "bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-400",
};

export function HelpGuides({ guides, onOpenGuide }: HelpGuidesProps) {
  return (
    <section>
      <h3 className={settingsSectionTitle}>Руководства</h3>
      {guides.length === 0 ? (
        <p className="mt-3 rounded-xl border border-dashed border-gray-200 px-4 py-5 text-center text-sm text-gray-500 dark:border-white/8 dark:text-ink-faint">Нет подходящих руководств</p>
      ) : <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {guides.map((guide) => {
          const Icon = guide.icon;
          return (
            <button
              key={guide.key}
              type="button"
              onClick={() => onOpenGuide(guide)}
              className="flex flex-col items-start rounded-2xl border border-gray-100 bg-white p-5 text-left shadow-sm transition-colors hover:border-accent/30 hover:bg-accent/5 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 dark:border-white/8 dark:bg-surface"
            >
              <div className="flex w-full items-start justify-between">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gray-100 text-gray-500 dark:bg-surface-2 dark:text-ink-faint">
                  <Icon size={20} />
                </div>
                <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${levelStyles[guide.level]}`}>
                  {guide.level}
                </span>
              </div>

              <h4 className="mt-3 text-sm font-semibold text-gray-900 dark:text-ink">{guide.title}</h4>
              <p className="mt-1 line-clamp-2 text-xs text-gray-400 dark:text-ink-faint">{guide.description}</p>

              <div className="mt-4 flex w-full items-center justify-between text-xs text-gray-400 dark:text-ink-faint">
                <span className="inline-flex items-center gap-1">
                  <Clock3 size={13} />
                  {guide.duration}
                </span>
                <span className="inline-flex items-center gap-1 font-medium text-accent">
                  Читать
                  <ArrowRight size={13} />
                </span>
              </div>
            </button>
          );
        })}
      </div>}
    </section>
  );
}
