import type { Metadata } from "next";
import "@/styles/globals.css";
import { ThemeProvider } from "@/hooks/useTheme";
import { ProfileProvider } from "@/hooks/useProfileStore";
import { ClockProvider } from "@/hooks/useClock";
import { ArchiveProvider } from "@/hooks/useArchiveStore";
import { TasksProvider } from "@/hooks/useTasksStore";
import { CalendarProvider } from "@/hooks/useCalendarStore";
import { ProjectsProvider } from "@/hooks/useProjectsStore";
import { NotesProvider } from "@/hooks/useNotesStore";
import { ReminderProvider } from "@/hooks/useRemindersStore";
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
          <ProfileProvider>
            <ClockProvider>
              {/* ArchiveProvider wraps Tasks/Calendar/Projects/Notes because each of
                  those stores calls into it directly from its own delete function —
                  one unified archive pipeline, not a per-module trash. */}
              <ArchiveProvider>
                <TasksProvider>
                  <CalendarProvider>
                    <ProjectsProvider>
                      <NotesProvider>
                        <ReminderProvider>
                          <NotificationsProvider>{children}</NotificationsProvider>
                        </ReminderProvider>
                      </NotesProvider>
                    </ProjectsProvider>
                  </CalendarProvider>
                </TasksProvider>
              </ArchiveProvider>
            </ClockProvider>
          </ProfileProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
