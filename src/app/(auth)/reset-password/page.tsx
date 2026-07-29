"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { describeAuthError } from "@/hooks/useAuth";

const inputClass =
  "w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-400 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200";
const labelClass = "mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400";
const MIN_PASSWORD_LENGTH = 6;

export default function ResetPasswordPage() {
  const router = useRouter();
  const [checkingSession, setCheckingSession] = useState(true);
  const [hasSession, setHasSession] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // The recovery session is established by /auth/callback before the user
  // ever lands here — if there's no session, the link was invalid or expired.
  useEffect(() => {
    const supabase = createClient();
    if (!supabase) {
      setCheckingSession(false);
      return;
    }
    supabase.auth.getSession().then(({ data }) => {
      setHasSession(Boolean(data.session));
      setCheckingSession(false);
    });
  }, []);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (submitting) return;

    if (password.length < MIN_PASSWORD_LENGTH) {
      setError(`Пароль должен быть не короче ${MIN_PASSWORD_LENGTH} символов.`);
      return;
    }
    if (password !== confirmPassword) {
      setError("Пароли не совпадают.");
      return;
    }

    setSubmitting(true);
    setError(null);

    const supabase = createClient();
    if (!supabase) {
      setError("Supabase не настроен.");
      setSubmitting(false);
      return;
    }

    const { error: updateError } = await supabase.auth.updateUser({ password });
    setSubmitting(false);

    if (updateError) {
      setError(describeAuthError(updateError));
      return;
    }

    setSuccess(true);
    window.setTimeout(() => {
      router.replace("/");
      router.refresh();
    }, 1500);
  }

  if (checkingSession) {
    return <p className="text-center text-sm text-gray-500 dark:text-gray-400">Проверка ссылки...</p>;
  }

  if (!hasSession) {
    return (
      <div className="space-y-2 text-center">
        <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-50">Ссылка недействительна</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">Ссылка для сброса пароля недействительна или истекла. Запросите новую.</p>
        <Link href="/forgot-password" className="inline-block text-sm font-medium text-blue-600 hover:underline dark:text-blue-400">
          Запросить ссылку заново
        </Link>
      </div>
    );
  }

  if (success) {
    return (
      <div className="space-y-2 text-center">
        <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-50">Пароль обновлён</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">Переходим в приложение...</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-50">Новый пароль</h1>
      </div>

      <label className="block">
        <span className={labelClass}>Новый пароль</span>
        <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className={inputClass} />
      </label>

      <label className="block">
        <span className={labelClass}>Подтверждение пароля</span>
        <input type="password" required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className={inputClass} />
      </label>

      {error && <p className="text-xs font-medium text-red-500 dark:text-red-400">{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {submitting && <Loader2 size={15} className="animate-spin" />}
        Обновить пароль
      </button>
    </form>
  );
}
