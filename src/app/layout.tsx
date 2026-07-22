import type { Metadata } from "next";
import "@/styles/globals.css";
import { TasksProvider } from "@/hooks/useTasksStore";

export const metadata: Metadata = {
  title: "Planly — самый простой AI-планировщик",
  description: "Planly — персональный AI-планировщик задач, заметок и календаря.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body>
        <TasksProvider>{children}</TasksProvider>
      </body>
    </html>
  );
}
