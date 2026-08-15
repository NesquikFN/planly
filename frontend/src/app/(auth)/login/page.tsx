"use client";

import { Suspense, useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { getErrorMessage } from "@/lib/api-client";
import { useAuth } from "@/hooks/useAuth";

const inputClass =
  "w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-400 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200";
const labelClass = "mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400";

function safeRedirectPath(path: string | null): string {
  if (!path || !path.startsWith("/") || path.startsWith("//")) return "/";
  return path;
}

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading, signIn } = useAuth();
  const redirectTo = safeRedirectPath(searchParams.get("redirect"));

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  // Belt-and-suspenders: the proxy already redirects an authenticated user
  // away from /login server-side, this just covers client-side navigations.
  useEffect(() => {
    if (!authLoading && user) router.replace(redirectTo);
  }, [authLoading, user, router, redirectTo]);

  useEffect(() => {
    if (searchParams.get("error") === "auth_callback_failed") {
      setError("Ссылка недействительна или устарела. Попробуйте снова.");
    }
    if (searchParams.get("verified") === "1") {
      setNotice("Email подтверждён. Теперь можно войти.");
    }
  }, [searchParams]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setError(null);

    try {
      await signIn(email, password);
    } catch (signInError) {
      setError(getErrorMessage(signInError));
      setSubmitting(false);
      return;
    }

    router.replace(redirectTo);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-50">Вход в Planly</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Введите email и пароль, чтобы продолжить.</p>
      </div>

      <label className="block">
        <span className={labelClass}>Email</span>
        <input type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} />
      </label>

      <label className="block">
        <span className={labelClass}>Пароль</span>
        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={inputClass}
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? "Скрыть пароль" : "Показать пароль"}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        </div>
      </label>

      <div className="flex justify-end text-xs">
        <Link href="/forgot-password" className="font-medium text-blue-600 hover:underline dark:text-blue-400">
          Забыли пароль?
        </Link>
      </div>

      {notice && <p className="text-xs font-medium text-green-600 dark:text-green-400">{notice}</p>}
      {error && <p className="text-xs font-medium text-red-500 dark:text-red-400">{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {submitting && <Loader2 size={15} className="animate-spin" />}
        Войти
      </button>

      <p className="text-center text-xs text-gray-500 dark:text-gray-400">
        Нет аккаунта?{" "}
        <Link href="/register" className="font-medium text-blue-600 hover:underline dark:text-blue-400">
          Зарегистрироваться
        </Link>
      </p>
    </form>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginPageContent />
    </Suspense>
  );
}
