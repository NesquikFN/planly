"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { describeAuthError } from "@/hooks/useAuth";

const inputClass =
  "w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-400 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200";
const labelClass = "mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400";
const MIN_PASSWORD_LENGTH = 6;

export default function RegisterPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmationSent, setConfirmationSent] = useState(false);

  function validate(): string | null {
    if (!fullName.trim() || !email.trim() || !password || !confirmPassword) return "Заполните все поля.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return "Введите корректный email.";
    if (password.length < MIN_PASSWORD_LENGTH) return `Пароль должен быть не короче ${MIN_PASSWORD_LENGTH} символов.`;
    if (password !== confirmPassword) return "Пароли не совпадают.";
    return null;
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (submitting) return;

    const validationError = validate();
    if (validationError) {
      setError(validationError);
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

    const { data, error: signUpError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: { full_name: fullName.trim() },
        emailRedirectTo: `${window.location.origin}/auth/callback?next=/`,
      },
    });

    setSubmitting(false);

    if (signUpError) {
      setError(describeAuthError(signUpError));
      return;
    }

    if (data.session) {
      router.replace("/");
      router.refresh();
      return;
    }

    setConfirmationSent(true);
  }

  if (confirmationSent) {
    return (
      <div className="space-y-2 text-center">
        <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-50">Проверьте почту</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Мы отправили письмо со ссылкой подтверждения на {email}. Перейдите по ссылке, чтобы завершить регистрацию.
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
        <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-50">Регистрация в Planly</h1>
      </div>

      <label className="block">
        <span className={labelClass}>Имя</span>
        <input value={fullName} onChange={(e) => setFullName(e.target.value)} required className={inputClass} />
      </label>

      <label className="block">
        <span className={labelClass}>Email</span>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className={inputClass} />
      </label>

      <label className="block">
        <span className={labelClass}>Пароль</span>
        <div className="relative">
          <input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} required className={inputClass} />
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

      <label className="block">
        <span className={labelClass}>Подтверждение пароля</span>
        <input
          type={showPassword ? "text" : "password"}
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
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
        Зарегистрироваться
      </button>

      <p className="text-center text-xs text-gray-500 dark:text-gray-400">
        Уже есть аккаунт?{" "}
        <Link href="/login" className="font-medium text-blue-600 hover:underline dark:text-blue-400">
          Войти
        </Link>
      </p>
    </form>
  );
}
