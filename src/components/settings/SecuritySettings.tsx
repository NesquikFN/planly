"use client";

import { useState } from "react";
import { CheckCircle2, KeyRound, Laptop, Monitor, ShieldCheck, Smartphone, X } from "lucide-react";
import { LOGIN_HISTORY, MOCK_SESSIONS, type SessionDef } from "@/lib/settings-defaults";
import { settingsCard, settingsInput, settingsLabel, settingsSectionTitle } from "@/lib/settings-form-styles";
import { cn } from "@/lib/utils";

function passwordStrength(password: string): { label: string; color: string; percent: number } {
  let score = 0;
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;

  if (score <= 1) return { label: "Слабый", color: "bg-red-500", percent: 25 };
  if (score <= 3) return { label: "Средний", color: "bg-amber-500", percent: 60 };
  return { label: "Надёжный", color: "bg-emerald-500", percent: 100 };
}

const DEVICE_ICON = { Windows: Monitor, iPhone: Smartphone, MacBook: Laptop } as const;

export function SecuritySettings() {
  const [sessions, setSessions] = useState<SessionDef[]>(MOCK_SESSIONS);
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [twoFaOpen, setTwoFaOpen] = useState(false);
  const [twoFaStep, setTwoFaStep] = useState(1);
  const [twoFaEnabled, setTwoFaEnabled] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordSaved, setPasswordSaved] = useState(false);

  const strength = passwordStrength(newPassword);
  const passwordsMatch = newPassword.length > 0 && newPassword === confirmPassword;

  function closePasswordModal() {
    setPasswordModalOpen(false);
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setPasswordSaved(false);
  }

  function closeTwoFaModal() {
    setTwoFaOpen(false);
    setTwoFaStep(1);
  }

  function terminateSession(id: string) {
    setSessions((prev) => prev.filter((session) => session.id !== id));
  }

  function terminateOtherSessions() {
    setSessions((prev) => prev.filter((session) => session.current));
  }

  return (
    <div className="space-y-6">
      <section className={settingsCard}>
        <div className="flex items-center justify-between">
          <div>
            <h3 className={settingsSectionTitle}>Пароль</h3>
            <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500">Последнее изменение: 2 месяца назад</p>
          </div>
          <button
            type="button"
            onClick={() => setPasswordModalOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3.5 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            <KeyRound size={14} />
            Изменить пароль
          </button>
        </div>
      </section>

      <section className={settingsCard}>
        <div className="flex items-center justify-between">
          <div>
            <h3 className={settingsSectionTitle}>Двухфакторная аутентификация</h3>
            <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500">
              Статус: <span className={twoFaEnabled ? "text-emerald-600 dark:text-emerald-400" : "text-gray-500"}>{twoFaEnabled ? "Включена" : "Не включена"}</span>
            </p>
          </div>
          {!twoFaEnabled && (
            <button
              type="button"
              onClick={() => setTwoFaOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              <ShieldCheck size={14} />
              Включить 2FA
            </button>
          )}
        </div>
      </section>

      <section className={settingsCard}>
        <div className="flex items-center justify-between">
          <h3 className={settingsSectionTitle}>Активные сеансы</h3>
          {sessions.length > 1 && (
            <button
              type="button"
              onClick={terminateOtherSessions}
              className="text-xs font-medium text-red-500 hover:underline dark:text-red-400"
            >
              Завершить все остальные сеансы
            </button>
          )}
        </div>
        <div className="mt-3 divide-y divide-gray-100 dark:divide-gray-800">
          {sessions.map((session) => {
            const Icon = DEVICE_ICON[session.device as keyof typeof DEVICE_ICON] ?? Monitor;
            return (
              <div key={session.id} className="flex items-center justify-between gap-3 py-2.5">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gray-50 text-gray-400 dark:bg-gray-800 dark:text-gray-500">
                    <Icon size={16} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-50">
                      {session.device}, {session.browser}
                      {session.current && (
                        <span className="ml-2 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
                          Текущий
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">
                      {session.location} · {session.activity}
                    </p>
                  </div>
                </div>
                {!session.current && (
                  <button
                    type="button"
                    onClick={() => terminateSession(session.id)}
                    className="shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium text-red-500 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10"
                  >
                    Завершить сеанс
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </section>

      <section className={settingsCard}>
        <h3 className={settingsSectionTitle}>История входов</h3>
        <div className="mt-3 divide-y divide-gray-100 dark:divide-gray-800">
          {LOGIN_HISTORY.map((entry) => (
            <div key={entry.id} className="flex items-center justify-between gap-3 py-2 text-sm">
              <div>
                <p className="font-medium text-gray-700 dark:text-gray-200">{entry.device}</p>
                <p className="text-xs text-gray-400 dark:text-gray-500">
                  {entry.dateLabel} · {entry.location}
                </p>
              </div>
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 text-[11px] font-medium",
                  entry.status === "success"
                    ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400"
                    : "bg-red-50 text-red-500 dark:bg-red-500/10 dark:text-red-400",
                )}
              >
                {entry.status === "success" ? "Успешно" : "Отклонено"}
              </span>
            </div>
          ))}
        </div>
      </section>

      {passwordModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/20" onClick={closePasswordModal} aria-hidden="true" />
          <div className="relative w-full max-w-sm rounded-2xl border border-gray-100 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-gray-900 dark:text-gray-50">Изменить пароль</h3>
              <button type="button" onClick={closePasswordModal} aria-label="Закрыть" className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800">
                <X size={18} />
              </button>
            </div>

            {passwordSaved ? (
              <div className="py-6 text-center">
                <CheckCircle2 size={28} className="mx-auto text-emerald-500" />
                <p className="mt-2 text-sm font-medium text-gray-700 dark:text-gray-200">Пароль обновлён</p>
              </div>
            ) : (
              <form
                className="mt-4 space-y-3"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!passwordsMatch) return;
                  setPasswordSaved(true);
                }}
              >
                <label className="block">
                  <span className={settingsLabel}>Текущий пароль</span>
                  <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className={settingsInput} />
                </label>
                <label className="block">
                  <span className={settingsLabel}>Новый пароль</span>
                  <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className={settingsInput} />
                  {newPassword.length > 0 && (
                    <div className="mt-1.5">
                      <div className="h-1 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                        <div className={cn("h-full rounded-full", strength.color)} style={{ width: `${strength.percent}%` }} />
                      </div>
                      <span className="mt-1 block text-xs text-gray-400 dark:text-gray-500">Надёжность: {strength.label}</span>
                    </div>
                  )}
                </label>
                <label className="block">
                  <span className={settingsLabel}>Подтверждение нового пароля</span>
                  <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className={settingsInput} />
                  {confirmPassword.length > 0 && !passwordsMatch && <span className="mt-1 block text-xs text-red-500">Пароли не совпадают</span>}
                </label>
                <button
                  type="submit"
                  disabled={!currentPassword || !passwordsMatch}
                  className="w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Сохранить пароль
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {twoFaOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/20" onClick={closeTwoFaModal} aria-hidden="true" />
          <div className="relative w-full max-w-sm rounded-2xl border border-gray-100 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-gray-900 dark:text-gray-50">Двухфакторная аутентификация</h3>
              <button type="button" onClick={closeTwoFaModal} aria-label="Закрыть" className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800">
                <X size={18} />
              </button>
            </div>

            {twoFaStep === 1 && (
              <div className="mt-4">
                <p className="text-sm text-gray-500 dark:text-gray-400">Отсканируйте код в приложении-аутентификаторе.</p>
                <div className="mx-auto mt-3 flex h-32 w-32 items-center justify-center rounded-xl border border-dashed border-gray-200 text-xs text-gray-400 dark:border-gray-700 dark:text-gray-500">
                  QR-код
                </div>
                <button type="button" onClick={() => setTwoFaStep(2)} className="mt-4 w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
                  Далее
                </button>
              </div>
            )}

            {twoFaStep === 2 && (
              <div className="mt-4">
                <label className="block">
                  <span className={settingsLabel}>Код из приложения</span>
                  <input type="text" maxLength={6} placeholder="000000" className={settingsInput} />
                </label>
                <button type="button" onClick={() => setTwoFaStep(3)} className="mt-4 w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
                  Подтвердить
                </button>
              </div>
            )}

            {twoFaStep === 3 && (
              <div className="py-4 text-center">
                <CheckCircle2 size={28} className="mx-auto text-emerald-500" />
                <p className="mt-2 text-sm font-medium text-gray-700 dark:text-gray-200">Двухфакторная аутентификация включена</p>
                <button
                  type="button"
                  onClick={() => {
                    setTwoFaEnabled(true);
                    closeTwoFaModal();
                  }}
                  className="mt-4 w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                >
                  Готово
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
