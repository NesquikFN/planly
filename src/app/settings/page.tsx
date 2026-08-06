"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/dashboard/Header";
import { ComingSoonDialog } from "@/components/ui/ComingSoonDialog";
import { SettingsNavigation } from "@/components/settings/SettingsNavigation";
import { SettingsHeader } from "@/components/settings/SettingsHeader";
import { SettingsAside } from "@/components/settings/SettingsAside";
import { ProfileSettings } from "@/components/settings/ProfileSettings";
import { AppearanceSettings } from "@/components/settings/AppearanceSettings";
import { NotificationSettings } from "@/components/settings/NotificationSettings";
import { TaskProjectSettings } from "@/components/settings/TaskProjectSettings";
import { CalendarSettings } from "@/components/settings/CalendarSettings";
import { LocaleSettings } from "@/components/settings/LocaleSettings";
import { IntegrationSettings } from "@/components/settings/IntegrationSettings";
import { PrivacySettings } from "@/components/settings/PrivacySettings";
import { SecuritySettings } from "@/components/settings/SecuritySettings";
import { DataExportSettings } from "@/components/settings/DataExportSettings";
import { PlanSettings } from "@/components/settings/PlanSettings";
import { AboutSettings } from "@/components/settings/AboutSettings";
import { useTheme } from "@/hooks/useTheme";
import { useProfileStore } from "@/hooks/useProfileStore";
import { readStorage, writeStorage } from "@/lib/storage";
import { DEFAULT_SETTINGS, SETTINGS_CATEGORIES, MOCK_SESSIONS } from "@/lib/settings-defaults";
import { USER_NAME } from "@/lib/app-constants";
import type { SettingsCategoryKey, SettingsState } from "@/types/settings";

const SETTINGS_STORAGE_KEY = "planly:settings";
const CATEGORY_KEYS = SETTINGS_CATEGORIES.map((item) => item.key);

function isSettingsCategoryKey(value: string | null): value is SettingsCategoryKey {
  return value !== null && (CATEGORY_KEYS as string[]).includes(value);
}

function SettingsPageContent() {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");

  const { themePreference, setThemePreference } = useTheme();
  const { isSaving: isProfileSaving } = useProfileStore();

  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<SettingsCategoryKey>(
    isSettingsCategoryKey(tabParam) ? tabParam : "profile",
  );

  // Lets the Sidebar's "Профиль" menu item (/settings?tab=profile) select the
  // right tab even when the page is already mounted on /settings.
  useEffect(() => {
    if (isSettingsCategoryKey(tabParam)) setActiveCategory(tabParam);
  }, [tabParam]);

  const [settings, setSettings] = useState<SettingsState>(() => readStorage(SETTINGS_STORAGE_KEY, DEFAULT_SETTINGS));
  const [draft, setDraft] = useState<SettingsState>(settings);

  const [stubDialog, setStubDialog] = useState<{ title: string; message?: string } | null>(null);
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const isDirty = useMemo(() => JSON.stringify(draft) !== JSON.stringify(settings), [draft, settings]);

  function showToast(message: string) {
    setToastMessage(message);
    window.setTimeout(() => setToastMessage(null), 2500);
  }

  // Keeps the (unrelated) Settings draft's `appearance.theme` from ever going
  // stale relative to the real theme — e.g. toggled via the Sidebar while
  // this page is open — so saving any *other* category can't silently revert
  // the theme the way saving the profile used to.
  useEffect(() => {
    setSettings((prev) => (prev.appearance.theme === themePreference ? prev : { ...prev, appearance: { ...prev.appearance, theme: themePreference } }));
    setDraft((prev) => (prev.appearance.theme === themePreference ? prev : { ...prev, appearance: { ...prev.appearance, theme: themePreference } }));
  }, [themePreference]);

  // Fires the success toast once a profile save (owned entirely by
  // useProfileStore/ProfileSettings) finishes, regardless of which tab is
  // active by the time it completes.
  const wasProfileSaving = useRef(false);
  useEffect(() => {
    if (wasProfileSaving.current && !isProfileSaving) {
      showToast("Профиль успешно сохранён");
    }
    wasProfileSaving.current = isProfileSaving;
  }, [isProfileSaving]);

  useEffect(() => {
    function handleBeforeUnload(event: BeforeUnloadEvent) {
      if (!isDirty) return;
      event.preventDefault();
      event.returnValue = "";
    }
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);

  function updateCategory<K extends keyof SettingsState>(key: K, patch: Partial<SettingsState[K]>) {
    setDraft((prev) => ({ ...prev, [key]: { ...prev[key], ...patch } }));
  }

  function toggleIntegration(key: string) {
    setDraft((prev) => ({
      ...prev,
      integrations: {
        ...prev.integrations,
        [key]: { connected: !(prev.integrations[key]?.connected ?? false) },
      },
    }));
  }

  function handleSave() {
    setSettings(draft);
    writeStorage(SETTINGS_STORAGE_KEY, draft);
    // Only meaningfully applies the theme when the Appearance tab actually
    // changed it — draft.appearance.theme is otherwise kept reconciled with
    // the live theme (see the effect above), so this can't revert it.
    setThemePreference(draft.appearance.theme);
    showToast("Настройки сохранены");
  }

  function handleCancel() {
    setDraft(settings);
  }

  function handleResetConfirmed() {
    setSettings(DEFAULT_SETTINGS);
    setDraft(DEFAULT_SETTINGS);
    writeStorage(SETTINGS_STORAGE_KEY, DEFAULT_SETTINGS);
    setThemePreference(DEFAULT_SETTINGS.appearance.theme);
    setResetConfirmOpen(false);
  }

  function handleStub(message: string) {
    setStubDialog({ title: "Скоро будет доступно", message });
  }

  const category = SETTINGS_CATEGORIES.find((item) => item.key === activeCategory)!;

  return (
    <div className="min-h-screen bg-[#FAFAFA] dark:bg-canvas">
      <Sidebar isOpen={isSidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex min-h-screen flex-col lg:pl-64">
        <Header userName={USER_NAME} onMenuClick={() => setSidebarOpen(true)} title="Настройки" enableTaskSearch={false} />

        <main className="flex-1 px-4 pb-16 sm:px-6 lg:px-8">
          <div className="flex flex-col items-start gap-6 lg:flex-row">
            <SettingsNavigation
              active={activeCategory}
              onSelect={setActiveCategory}
              onResetSettings={() => setResetConfirmOpen(true)}
              onLogout={() => handleStub("Выход из аккаунта появится в одном из следующих обновлений.")}
            />

            <div className="w-full min-w-0 max-w-3xl flex-1 space-y-5">
              {activeCategory === "profile" ? (
                <ProfileSettings />
              ) : (
                <>
                  <SettingsHeader title={category.label} description={category.description} isDirty={isDirty} onCancel={handleCancel} onSave={handleSave} />

                  {activeCategory === "appearance" && (
                    <AppearanceSettings value={draft.appearance} onChange={(patch) => updateCategory("appearance", patch)} />
                  )}
                  {activeCategory === "notifications" && (
                    <NotificationSettings value={draft.notifications} onChange={(patch) => updateCategory("notifications", patch)} />
                  )}
                  {activeCategory === "tasksProjects" && (
                    <TaskProjectSettings value={draft.tasksProjects} onChange={(patch) => updateCategory("tasksProjects", patch)} />
                  )}
                  {activeCategory === "calendar" && (
                    <CalendarSettings value={draft.calendar} onChange={(patch) => updateCategory("calendar", patch)} />
                  )}
                  {activeCategory === "locale" && <LocaleSettings value={draft.locale} onChange={(patch) => updateCategory("locale", patch)} />}
                  {activeCategory === "integrations" && (
                    <IntegrationSettings value={draft.integrations} onToggle={toggleIntegration} onStub={handleStub} />
                  )}
                  {activeCategory === "privacy" && (
                    <PrivacySettings
                      value={draft.privacy}
                      onChange={(patch) => updateCategory("privacy", patch)}
                      onViewData={() => handleStub("Просмотр хранимых данных появится в одном из следующих обновлений.")}
                    />
                  )}
                  {activeCategory === "security" && <SecuritySettings />}
                  {activeCategory === "data" && (
                    <DataExportSettings
                      backup={draft.backup}
                      onBackupChange={(patch) => updateCategory("backup", patch)}
                      onCreateExport={(types) => handleStub(`Экспорт (${types.join(", ")}) подготавливается. Уведомим, когда файл будет готов.`)}
                      onCreateBackupNow={() => handleStub("Резервная копия создаётся в фоне.")}
                      onImport={() => handleStub("Импорт данных появится в одном из следующих обновлений.")}
                    />
                  )}
                  {activeCategory === "plan" && <PlanSettings onSelectPlan={(name) => handleStub(`Оплата тарифа «${name}» пока не подключена.`)} />}
                  {activeCategory === "about" && (
                    <AboutSettings onCheckUpdates={() => handleStub("У вас установлена последняя версия.")} onStub={handleStub} />
                  )}
                </>
              )}
            </div>

            <SettingsAside
              sessionCount={MOCK_SESSIONS.length}
              onChangePassword={() => setActiveCategory("security")}
              onExportData={() => setActiveCategory("data")}
              onConnectCalendar={() => setActiveCategory("integrations")}
              onUpgradePlan={() => setActiveCategory("plan")}
            />
          </div>
        </main>
      </div>

      {resetConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/20" onClick={() => setResetConfirmOpen(false)} aria-hidden="true" />
          <div className="relative w-full max-w-sm rounded-2xl border border-gray-100 bg-white p-5 shadow-sm dark:border-white/8 dark:bg-surface">
            <h3 className="text-base font-semibold text-gray-900 dark:text-ink">Сбросить настройки?</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-ink-faint">Все настройки вернутся к значениям по умолчанию. Профиль не изменится.</p>
            <div className="mt-4 flex justify-end gap-2">
              <button type="button" onClick={() => setResetConfirmOpen(false)} className="rounded-lg px-3 py-2 text-sm font-medium text-gray-500 hover:bg-gray-50 dark:text-ink-faint dark:hover:bg-surface-2">
                Отмена
              </button>
              <button type="button" onClick={handleResetConfirmed} className="rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white hover:bg-red-600">
                Сбросить
              </button>
            </div>
          </div>
        </div>
      )}

      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-xl border border-gray-100 bg-white px-4 py-3 text-sm font-medium text-gray-700 shadow-sm dark:border-white/8 dark:bg-surface dark:text-ink-dim">
          <CheckCircle2 size={16} className="text-emerald-500" />
          {toastMessage}
        </div>
      )}

      <ComingSoonDialog open={stubDialog !== null} onClose={() => setStubDialog(null)} title={stubDialog?.title ?? ""} message={stubDialog?.message} />
    </div>
  );
}

export default function SettingsPage() {
  return (
    <Suspense fallback={null}>
      <SettingsPageContent />
    </Suspense>
  );
}
