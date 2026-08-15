import {
  Bell,
  BookOpen,
  Bug,
  Calendar,
  CalendarDays,
  Download,
  FolderPlus,
  GitBranch,
  Keyboard,
  Lightbulb,
  Mail,
  MessageCircle,
  BarChart3,
  ListChecks,
  RefreshCw,
  Rocket,
  Send,
  Settings,
  StickyNote,
  Upload,
  Video,
} from "lucide-react";
import type {
  FeedbackPriorityOption,
  HelpFaqSection,
  HelpGuide,
  HelpQuickAction,
  ServerStatusItem,
  SupportChannel,
} from "@/types/help";

export const HELP_QUICK_ACTIONS: HelpQuickAction[] = [
  {
    key: "getting-started",
    title: "Начать работу",
    description: "Быстрый обзор основных возможностей Planly для новых пользователей.",
    icon: Rocket,
  },
  {
    key: "shortcuts",
    title: "Горячие клавиши",
    description: "Полный список сочетаний клавиш для быстрой работы с приложением.",
    icon: Keyboard,
  },
  {
    key: "user-guide",
    title: "Руководство пользователя",
    description: "Подробная документация по всем разделам и функциям Planly.",
    icon: BookOpen,
  },
  {
    key: "video-tutorials",
    title: "Видеоинструкции",
    description: "Короткие видео о том, как настроить и использовать Planly.",
    icon: Video,
  },
  {
    key: "report-bug",
    title: "Сообщить об ошибке",
    description: "Расскажите нам, что пошло не так — мы разберёмся.",
    icon: Bug,
  },
  {
    key: "suggest-feature",
    title: "Предложить улучшение",
    description: "Поделитесь идеей о том, как сделать Planly лучше.",
    icon: Lightbulb,
  },
];

export const HELP_FAQ_SECTIONS: HelpFaqSection[] = [
  {
    key: "tasks",
    title: "Работа с задачами",
    icon: ListChecks,
    items: [
      {
        id: "tasks-1",
        question: "Как быстро добавить задачу?",
        answer:
          "Введите текст в поле быстрого добавления на Dashboard и нажмите Enter — Planly сам распознает дату, приоритет и категорию из текста, если они указаны.",
      },
      {
        id: "tasks-2",
        question: "Как изменить приоритет задачи?",
        answer: "Откройте задачу двойным кликом или через меню действий — приоритет можно изменить в карточке редактирования.",
      },
      {
        id: "tasks-3",
        question: "Куда пропадают выполненные задачи?",
        answer: "Выполненные задачи перемещаются в отдельный список на Dashboard и не удаляются — их можно найти в разделе завершённых.",
      },
    ],
  },
  {
    key: "projects",
    title: "Проекты",
    icon: FolderPlus,
    items: [
      {
        id: "projects-1",
        question: "Как создать новый проект?",
        answer: "Перейдите в раздел «Проекты» и нажмите кнопку создания проекта в правом верхнем углу панели инструментов.",
      },
      {
        id: "projects-2",
        question: "Как связать задачу с проектом?",
        answer: "При создании или редактировании задачи укажите проект в соответствующем поле — задача появится в статистике проекта.",
      },
      {
        id: "projects-3",
        question: "Можно ли архивировать проект?",
        answer: "Да, через меню действий на карточке проекта — архивные проекты доступны в отдельном блоке внизу страницы.",
      },
    ],
  },
  {
    key: "calendar",
    title: "Календарь",
    icon: Calendar,
    items: [
      {
        id: "calendar-1",
        question: "Чем событие отличается от задачи с датой?",
        answer:
          "И то, и другое отображается в календаре как единая запись (CalendarEntry), но события не имеют статуса «выполнено» и предназначены для встреч и мероприятий.",
      },
      {
        id: "calendar-2",
        question: "Как переключить вид календаря?",
        answer: "Используйте переключатель вида (день/неделя/месяц/повестка дня) в верхней панели страницы «Календарь».",
      },
    ],
  },
  {
    key: "notes",
    title: "Заметки",
    icon: StickyNote,
    items: [
      {
        id: "notes-1",
        question: "Как организовать заметки по папкам?",
        answer: "В боковой панели раздела «Заметки» доступны папки и теги — перетащите заметку или выберите папку при создании.",
      },
      {
        id: "notes-2",
        question: "Можно ли прикрепить файл к заметке?",
        answer: "Да, в редакторе заметки есть блок вложений — добавляйте файлы, ссылки на задачи, проекты и события.",
      },
    ],
  },
  {
    key: "reminders",
    title: "Напоминания",
    icon: Bell,
    items: [
      {
        id: "reminders-1",
        question: "Как отложить напоминание?",
        answer: "Откройте меню «Отложить» на карточке напоминания и выберите один из вариантов — время пересчитается автоматически.",
      },
      {
        id: "reminders-2",
        question: "Напоминания связаны с задачами из Dashboard?",
        answer: "Пока нет — это отдельный раздел с собственными демо-данными, интеграция с задачами и календарём в разработке.",
      },
    ],
  },
  {
    key: "settings",
    title: "Настройки",
    icon: Settings,
    items: [
      {
        id: "settings-1",
        question: "Где сохраняются мои настройки?",
        answer: "Настройки сохраняются локально в браузере при нажатии «Сохранить» и восстанавливаются после перезагрузки страницы.",
      },
      {
        id: "settings-2",
        question: "Как сменить тему оформления?",
        answer: "В разделе «Настройки» → «Внешний вид» выберите светлую, тёмную или системную тему — изменение применится сразу во всём приложении.",
      },
    ],
  },
  {
    key: "sync",
    title: "Синхронизация",
    icon: RefreshCw,
    items: [
      {
        id: "sync-1",
        question: "Синхронизируются ли данные между устройствами?",
        answer:
          "В текущей версии Planly — нет. Данные хранятся только в localStorage браузера на этом устройстве, облачная синхронизация ещё не реализована.",
      },
      {
        id: "sync-2",
        question: "Что будет, если очистить историю браузера?",
        answer: "Локальные данные Planly (задачи, календарь, настройки) будут удалены вместе с localStorage — заранее сделайте экспорт при необходимости.",
      },
    ],
  },
];

export const HELP_GUIDES: HelpGuide[] = [
  {
    key: "create-project",
    title: "Создание проекта",
    description: "Пошаговое руководство по созданию и настройке нового проекта.",
    duration: "5 мин чтения",
    level: "Начальный",
    icon: FolderPlus,
  },
  {
    key: "calendar-workflow",
    title: "Работа с календарём",
    description: "Как планировать события и задачи в едином представлении календаря.",
    duration: "7 мин чтения",
    level: "Начальный",
    icon: CalendarDays,
  },
  {
    key: "analytics-usage",
    title: "Использование аналитики",
    description: "Как читать индекс продуктивности, графики и тепловые карты активности.",
    duration: "6 мин чтения",
    level: "Средний",
    icon: BarChart3,
  },
  {
    key: "export-data",
    title: "Экспорт данных",
    description: "Как выгрузить задачи, проекты и заметки в файл для резервной копии.",
    duration: "3 мин чтения",
    level: "Средний",
    icon: Download,
  },
  {
    key: "import-data",
    title: "Импорт данных",
    description: "Как загрузить ранее экспортированные данные обратно в Planly.",
    duration: "4 мин чтения",
    level: "Продвинутый",
    icon: Upload,
  },
];

export const SUPPORT_CHANNELS: SupportChannel[] = [
  {
    key: "email",
    label: "Email",
    value: "support@planly.app",
    href: "mailto:support@planly.app",
    icon: Mail,
  },
  {
    key: "telegram",
    label: "Telegram",
    value: "@planly_support",
    href: "https://t.me/planly_support",
    icon: Send,
  },
  {
    key: "discord",
    label: "Discord",
    value: "discord.gg/planly",
    href: "https://discord.gg/planly",
    icon: MessageCircle,
  },
  {
    key: "github",
    label: "GitHub",
    value: "github.com/NesquikFN/my-life",
    href: "https://github.com/NesquikFN/my-life",
    icon: GitBranch,
  },
];

export const SERVER_STATUS_ITEMS: ServerStatusItem[] = [
  { key: "app", label: "Приложение Planly", status: "operational" },
  { key: "sync", label: "Синхронизация (демо)", status: "operational" },
  { key: "notifications", label: "Уведомления", status: "operational" },
];

export const FEEDBACK_PRIORITY_OPTIONS: FeedbackPriorityOption[] = [
  { key: "low", label: "Низкий" },
  { key: "medium", label: "Средний" },
  { key: "high", label: "Высокий" },
];
