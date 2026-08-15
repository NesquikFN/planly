import {
  BarChart3,
  BookOpen,
  Folder,
  Globe,
  Megaphone,
  Palette,
  Rocket,
  Search,
  Smartphone,
  Users,
  type LucideIcon,
} from "lucide-react";
import type { ProjectIconKey } from "@/types/project";

// System icon registry used by project UI and archive restoration.
export const PROJECT_ICON_MAP: Record<ProjectIconKey, LucideIcon> = {
  palette: Palette,
  smartphone: Smartphone,
  megaphone: Megaphone,
  search: Search,
  "bar-chart": BarChart3,
  globe: Globe,
  "book-open": BookOpen,
  users: Users,
  rocket: Rocket,
  folder: Folder,
};
