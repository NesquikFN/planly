// Shared, subdued button states reused across every calendar control
// (view switcher, Сегодня, arrows, Фильтр, Добавить, three-dots, mini-calendar
// nav, "Показать все"). No bright accents, gradients, or heavy shadows.

export const calendarButtonBase =
  "inline-flex items-center justify-center gap-1.5 rounded-lg text-sm font-medium " +
  "text-gray-600 transition-colors duration-150 ease-out " +
  "hover:bg-gray-100 active:bg-gray-200 " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-300 focus-visible:ring-offset-1 " +
  "disabled:pointer-events-none disabled:opacity-40 " +
  "dark:text-ink-dim dark:hover:bg-surface-2 dark:active:bg-surface";

export const calendarButtonSelected = "border border-gray-200 bg-gray-100 text-gray-900 dark:border-white/8 dark:bg-surface-2 dark:text-ink";
export const calendarButtonIdle = "border border-transparent";
export const calendarIconButton = `${calendarButtonBase} border border-transparent p-1.5 text-gray-400 dark:text-ink-faint`;
