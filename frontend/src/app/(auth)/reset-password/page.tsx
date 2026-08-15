"use client";

import { Suspense, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { authApi, getErrorMessage } from "@/lib/api-client";

const inputClass =
  "w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-400 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200";
const labelClass = "mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400";
// Matches the backend's own rule (validation/auth.schemas.ts).
const MIN_PASSWORD_LENGTH = 8;

function ResetPasswordPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  // The reset link carries a one-time token in the URL — there is no
  // "recovery session" anymore. Whether the token is actually valid is
  // only known once it's submitted: the backend consumes it atomically,
  // and checking it beforehand would just burn it.
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (submitting || !token) return;

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

    try {
      await authApi.resetPassword(token, password);
    } catch (resetError) {
      setError(getErrorMessage(resetError));
      setSubmitting(false);
      return;
    }

    setSubmitting(false);
    setSuccess(true);
    // Changing the password clears the session cookie server-side, so the
    // user signs in again — with the new password.
    window.setTimeout(() => {
      router.replace("/login");
      router.refresh();
    }, 1500);
  }

  if (!token) {
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
        <p className="text-sm text-gray-500 dark:text-gray-400">Переходим ко входу...</p>
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
        <input type="password" required autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} className={inputClass} />
      </label>

      <label className="block">
        <span className={labelClass}>Подтверждение пароля</span>
        <input
          type="password"
          required
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className={inputClass}
        />
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

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordPageContent />
    </Suspense>
  );
}
