"use client";

import { useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";
import { settingsCard, settingsSectionTitle } from "@/lib/settings-form-styles";
import { cn } from "@/lib/utils";
import type { HelpFaqSection } from "@/types/help";

interface HelpFaqAccordionProps {
  sections: HelpFaqSection[];
  searchQuery: string;
}

export function HelpFaqAccordion({ sections, searchQuery }: HelpFaqAccordionProps) {
  const [openSections, setOpenSections] = useState<Set<string>>(new Set([sections[0]?.key ?? ""]));
  const [openItems, setOpenItems] = useState<Set<string>>(new Set());

  const query = searchQuery.trim().toLowerCase();
  const isSearching = query.length > 0;

  const visibleSections = useMemo(() => {
    if (!isSearching) return sections;
    return sections
      .map((section) => ({
        ...section,
        items: section.items.filter(
          (item) => item.question.toLowerCase().includes(query) || item.answer.toLowerCase().includes(query),
        ),
      }))
      .filter((section) => section.items.length > 0);
  }, [sections, isSearching, query]);

  function toggleSection(key: string) {
    setOpenSections((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function toggleItem(id: string) {
    setOpenItems((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <section>
      <div className="flex items-center justify-between">
        <h3 className={settingsSectionTitle}>Популярные вопросы</h3>
        {isSearching && (
          <span className="text-xs text-gray-400 dark:text-ink-faint">
            {visibleSections.reduce((total, section) => total + section.items.length, 0)} совпадений
          </span>
        )}
      </div>

      <div className="mt-3 space-y-3">
        {visibleSections.length === 0 && (
          <div className={cn(settingsCard, "text-center text-sm text-gray-400 dark:text-ink-faint")}>
            Ничего не найдено по запросу «{searchQuery}»
          </div>
        )}

        {visibleSections.map((section) => {
          const Icon = section.icon;
          const isOpen = isSearching || openSections.has(section.key);

          return (
            <div key={section.key} className={cn(settingsCard, "p-0")}>
              <button
                type="button"
                onClick={() => toggleSection(section.key)}
                aria-expanded={isOpen}
                aria-controls={`faq-section-${section.key}`}
                className="flex w-full items-center gap-3 px-5 py-4 text-left"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-500 dark:bg-surface-2 dark:text-ink-faint">
                  <Icon size={16} />
                </div>
                <span className="flex-1 text-sm font-semibold text-gray-900 dark:text-ink">{section.title}</span>
                <span className="text-xs text-gray-400 dark:text-ink-faint">{section.items.length}</span>
                <ChevronDown
                  size={16}
                  className={cn("shrink-0 text-gray-400 transition-transform", isOpen && "rotate-180")}
                />
              </button>

              {isOpen && (
                <div id={`faq-section-${section.key}`} className="animate-in fade-in slide-in-from-top-1 divide-y divide-gray-100 border-t border-gray-100 duration-150 dark:divide-white/8 dark:border-white/8">
                  {section.items.map((item) => {
                    const itemOpen = openItems.has(item.id) || isSearching;
                    return (
                      <div key={item.id} className="px-5">
                        <button
                          type="button"
                          onClick={() => toggleItem(item.id)}
                          aria-expanded={itemOpen}
                          aria-controls={`faq-answer-${item.id}`}
                          className="flex w-full items-center justify-between gap-3 py-3 text-left text-sm text-gray-700 dark:text-ink-dim"
                        >
                          {item.question}
                          <ChevronDown
                            size={14}
                            className={cn("shrink-0 text-gray-400 transition-transform", itemOpen && "rotate-180")}
                          />
                        </button>
                        {itemOpen && (
                          <p id={`faq-answer-${item.id}`} className="animate-in fade-in slide-in-from-top-1 pb-3 text-xs leading-relaxed text-gray-500 duration-150 dark:text-ink-faint">{item.answer}</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
