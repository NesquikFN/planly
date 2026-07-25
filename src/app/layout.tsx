import type { Metadata } from "next";
import "@/styles/globals.css";
import { ThemeProvider } from "@/hooks/useTheme";
import { ClockProvider } from "@/hooks/useClock";
import { TasksProvider } from "@/hooks/useTasksStore";
import { CalendarProvider } from "@/hooks/useCalendarStore";
import { NotificationsProvider } from "@/hooks/useNotificationsStore";

export const metadata: Metadata = {
  title: "Planly — самый простой AI-планировщик",
  description: "Planly — персональный AI-планировщик задач, заметок и календаря.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body>
        <ThemeProvider>
          <ClockProvider>
            <TasksProvider>
              <CalendarProvider>
                <NotificationsProvider>{children}</NotificationsProvider>
              </CalendarProvider>
            </TasksProvider>
          </ClockProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
