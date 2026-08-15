"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { authApi } from "@/lib/api-client";

const inputClass =
  "w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-400 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200";
const labelClass = "mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (submitting || !email.trim()) return;
    setSubmitting(true);

    try {
      await authApi.requestPasswordReset(email.trim());
    } catch {
      // Deliberately swallowed. The endpoint answers 204 for unknown
      // addresses too, so the only errors reachable here are transport
      // ones — and surfacing them differently from success would turn
      // this form into a way to test which emails exist.
    }

    // Always show the same success state, whether or not this email is
    // registered — so the form never reveals which emails exist.
    setSubmitting(false);
    setSent(true);
  }

  if (sent) {
    return (
      <div className="space-y-2 text-center">
        <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-50">Проверьте почту</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Если аккаунт с email {email} существует, мы отправили на него ссылку для восстановления пароля.
        </p>
        <Link href="/login" className="inline-block text-sm font-medium text-blue-600 hover:underline dark:text-blue-400">
          Вернуться к входу
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-50">Восстановление пароля</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Укажите email — мы отправим ссылку для сброса пароля.</p>
      </div>

      <label className="block">
        <span className={labelClass}>Email</span>
        <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} />
      </label>

      <button
        type="submit"
        disabled={submitting}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {submitting && <Loader2 size={15} className="animate-spin" />}
        Отправить ссылку
      </button>

      <p className="text-center text-xs text-gray-500 dark:text-gray-400">
        <Link href="/login" className="font-medium text-blue-600 hover:underline dark:text-blue-400">
          Вернуться к входу
        </Link>
      </p>
    </form>
  );
}
