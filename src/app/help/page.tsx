"use client";

import { useRef, useState } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/dashboard/Header";
import { ComingSoonDialog } from "@/components/ui/ComingSoonDialog";
import { HelpHero } from "@/components/help/HelpHero";
import { HelpQuickActions } from "@/components/help/HelpQuickActions";
import { HelpFaqAccordion } from "@/components/help/HelpFaqAccordion";
import { HelpGuides } from "@/components/help/HelpGuides";
import { HelpSupportContacts } from "@/components/help/HelpSupportContacts";
import { HelpFeedbackForm } from "@/components/help/HelpFeedbackForm";
import {
  HELP_FAQ_SECTIONS,
  HELP_GUIDES,
  HELP_QUICK_ACTIONS,
  SERVER_STATUS_ITEMS,
  SUPPORT_CHANNELS,
} from "@/lib/help-mock-data";
import { USER_NAME } from "@/lib/app-constants";
import type { HelpGuide, HelpQuickAction } from "@/types/help";

export default function HelpPage() {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [stubDialog, setStubDialog] = useState<{ title: string; message?: string } | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  function handleQuickAction(action: HelpQuickAction) {
    setStubDialog({
      title: action.title,
      message: `«${action.title}» появится в одном из следующих обновлений.`,
    });
  }

  function handleOpenGuide(guide: HelpGuide) {
    setStubDialog({
      title: guide.title,
      message: `Полный текст руководства «${guide.title}» появится в одном из следующих обновлений.`,
    });
  }

  return (
    <div className="h-screen overflow-hidden bg-[#FAFAFA] dark:bg-gray-950">
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

          <HelpQuickActions actions={HELP_QUICK_ACTIONS} onAction={handleQuickAction} />

          <HelpFaqAccordion sections={HELP_FAQ_SECTIONS} searchQuery={searchQuery} />

          <HelpGuides guides={HELP_GUIDES} onOpenGuide={handleOpenGuide} />

          <HelpSupportContacts channels={SUPPORT_CHANNELS} statusItems={SERVER_STATUS_ITEMS} />

          <HelpFeedbackForm />
        </main>
      </div>

      <ComingSoonDialog
        open={stubDialog !== null}
        onClose={() => setStubDialog(null)}
        title={stubDialog?.title ?? ""}
        message={stubDialog?.message}
      />
    </div>
  );
}
