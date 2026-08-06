"use client";

import { useMemo, useRef, useState } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/dashboard/Header";
import { HelpDialog } from "@/components/help/HelpDialog";
import { HelpHero } from "@/components/help/HelpHero";
import { HelpQuickActions } from "@/components/help/HelpQuickActions";
import { HelpFaqAccordion } from "@/components/help/HelpFaqAccordion";
import { HelpGuides } from "@/components/help/HelpGuides";
import { HelpSupportContacts } from "@/components/help/HelpSupportContacts";
import { HelpFeedbackForm, type FeedbackType } from "@/components/help/HelpFeedbackForm";
import {
  HELP_FAQ_SECTIONS,
  HELP_GUIDES,
  HELP_QUICK_ACTIONS,
  SERVER_STATUS_ITEMS,
  SUPPORT_CHANNELS,
} from "@/lib/help-mock-data";
import { USER_NAME } from "@/lib/app-constants";
import type { HelpGuide, HelpQuickAction } from "@/types/help";

type DialogState = "onboarding" | "shortcuts" | "videos" | "guide" | null;

const GUIDE_TEXT: Record<string, string[]> = {
  "create-project": ["Откройте раздел «Проекты».", "Нажмите «Новый проект» и заполните название, описание и срок.", "Добавьте задачи и отслеживайте прогресс на доске."],
  "calendar-workflow": ["Добавляйте события через кнопку «Добавить».", "Задачи с датой автоматически появляются в календаре.", "Переключайте виды, чтобы планировать день или неделю."],
  "analytics-usage": ["Выберите период для сравнения показателей.", "Изучите индекс продуктивности и динамику задач.", "Используйте выводы как ориентир для следующей недели."],
  "export-data": ["Перейдите в «Настройки» → «Данные и экспорт».", "Выберите категории для выгрузки.", "В демо-версии экспорт не создаёт реальный файл."],
  "import-data": ["Подготовьте ранее сохранённый файл экспорта.", "Откройте «Настройки» → «Данные и экспорт».", "В демо-версии импорт показан только как сценарий интерфейса."],
};

export default function HelpPage() {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [dialog, setDialog] = useState<DialogState>(null);
  const [selectedGuide, setSelectedGuide] = useState<HelpGuide | null>(null);
  const [feedbackType, setFeedbackType] = useState<FeedbackType>("Вопрос");
  const searchInputRef = useRef<HTMLInputElement>(null);
  const guidesRef = useRef<HTMLElement>(null);
  const feedbackRef = useRef<HTMLElement>(null);

  const normalizedQuery = searchQuery.trim().toLowerCase();
  const matches = (text: string) => !normalizedQuery || text.toLowerCase().includes(normalizedQuery);
  const visibleActions = useMemo(() => HELP_QUICK_ACTIONS.filter((item) => matches(`${item.title} ${item.description}`)), [normalizedQuery]);
  const visibleGuides = useMemo(() => HELP_GUIDES.filter((item) => matches(`${item.title} ${item.description} ${item.duration} ${item.level}`)), [normalizedQuery]);
  const faqMatches = useMemo(() => HELP_FAQ_SECTIONS.reduce((total, section) => total + section.items.filter((item) => matches(`${section.title} ${item.question} ${item.answer}`)).length, 0), [normalizedQuery]);
  const isEmptySearch = Boolean(normalizedQuery) && visibleActions.length === 0 && visibleGuides.length === 0 && faqMatches === 0;

  function handleQuickAction(action: HelpQuickAction) {
    if (action.key === "getting-started") { setDialog("onboarding"); return; }
    if (action.key === "shortcuts") { setDialog("shortcuts"); return; }
    if (action.key === "user-guide") { guidesRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }); return; }
    if (action.key === "video-tutorials") { setDialog("videos"); return; }
    setFeedbackType(action.key === "report-bug" ? "Ошибка" : "Предложение");
    feedbackRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  function handleOpenGuide(guide: HelpGuide) {
    setSelectedGuide(guide);
    setDialog("guide");
  }

  function closeDialog() { setDialog(null); setSelectedGuide(null); }

  return (
    <div className="h-screen overflow-hidden bg-[#FAFAFA] dark:bg-canvas">
      <Sidebar isOpen={isSidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex h-screen flex-col lg:pl-64">
        <Header
          userName={USER_NAME}
          onMenuClick={() => setSidebarOpen(true)}
          title="Помощь"
          enableTaskSearch={false}
          onSearchIconClick={() => searchInputRef.current?.focus()}
        />

        <main className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto px-4 pb-8 sm:px-6 lg:px-8">
          <HelpHero ref={searchInputRef} searchQuery={searchQuery} onSearchChange={setSearchQuery} />

          {isEmptySearch && <div className="rounded-2xl border border-dashed border-gray-300 bg-white px-5 py-10 text-center text-sm text-gray-500 dark:border-white/8 dark:bg-surface dark:text-ink-faint">Ничего не найдено. Попробуйте изменить запрос или очистить поле поиска.</div>}

          <HelpQuickActions actions={visibleActions} onAction={handleQuickAction} />

          <HelpFaqAccordion sections={HELP_FAQ_SECTIONS} searchQuery={searchQuery} />

          <section ref={guidesRef}><HelpGuides guides={visibleGuides} onOpenGuide={handleOpenGuide} /></section>

          <HelpSupportContacts channels={SUPPORT_CHANNELS} statusItems={SERVER_STATUS_ITEMS} />

          <section ref={feedbackRef}><HelpFeedbackForm initialType={feedbackType} /></section>
        </main>
      </div>

      <HelpDialog open={dialog !== null} onClose={closeDialog} onBack={dialog === "guide" ? () => { setDialog(null); setSelectedGuide(null); guidesRef.current?.scrollIntoView({ behavior: "smooth" }); } : undefined} title={dialog === "onboarding" ? "Начать работу с Planly" : dialog === "shortcuts" ? "Горячие клавиши" : dialog === "videos" ? "Видеоинструкции" : selectedGuide?.title ?? "Руководство"}>
        {dialog === "onboarding" && <ol className="space-y-3 text-sm leading-relaxed text-gray-600 dark:text-ink-dim"><li><strong className="text-gray-900 dark:text-ink">1.</strong> Добавьте первую задачу на главной странице.</li><li><strong className="text-gray-900 dark:text-ink">2.</strong> Укажите дату — задача появится в календаре.</li><li><strong className="text-gray-900 dark:text-ink">3.</strong> Настройте тему и рабочий ритм в настройках.</li></ol>}
        {dialog === "shortcuts" && <dl className="divide-y divide-gray-100 text-sm dark:divide-white/8"><div className="flex justify-between py-3"><dt className="text-gray-600 dark:text-ink-dim">Открыть поиск</dt><dd className="rounded bg-gray-100 px-2 py-0.5 font-mono text-xs text-gray-700 dark:bg-surface-2 dark:text-ink-dim">/</dd></div><div className="flex justify-between py-3"><dt className="text-gray-600 dark:text-ink-dim">Создать задачу</dt><dd className="rounded bg-gray-100 px-2 py-0.5 font-mono text-xs text-gray-700 dark:bg-surface-2 dark:text-ink-dim">N</dd></div><div className="flex justify-between py-3"><dt className="text-gray-600 dark:text-ink-dim">Закрыть окно</dt><dd className="rounded bg-gray-100 px-2 py-0.5 font-mono text-xs text-gray-700 dark:bg-surface-2 dark:text-ink-dim">Esc</dd></div></dl>}
        {dialog === "videos" && <ul className="space-y-3">{["Первые шаги в Planly", "Планирование недели", "Работа с календарём"].map((title, index) => <li key={title} className="rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm text-gray-700 dark:border-white/8 dark:bg-surface-2 dark:text-ink-dim">Видео {index + 1}: {title}<span className="mt-1 block text-xs text-gray-500 dark:text-ink-faint">Демонстрационный материал, воспроизведение не подключено.</span></li>)}</ul>}
        {dialog === "guide" && selectedGuide && <ol className="space-y-3 text-sm leading-relaxed text-gray-600 dark:text-ink-dim">{(GUIDE_TEXT[selectedGuide.key] ?? []).map((step) => <li key={step} className="rounded-xl bg-gray-50 p-3 dark:bg-surface-2">{step}</li>)}</ol>}
      </HelpDialog>
    </div>
  );
}
