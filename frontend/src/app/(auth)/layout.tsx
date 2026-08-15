import type { ReactNode } from "react";

// Dedicated public shell for /login, /register, /forgot-password and
// /reset-password — no Sidebar/Header, no data-store providers needed here,
// just the centered card matching Planly's existing card/dark-theme style.

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#FAFAFA] px-4 py-10 dark:bg-gray-950">
      <div className="w-full max-w-sm">
        <p className="mb-6 text-center text-lg font-semibold text-gray-900 dark:text-gray-50">Planly</p>
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          {children}
        </div>
      </div>
    </div>
  );
}
