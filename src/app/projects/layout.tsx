import type { ReactNode } from "react";
import { ProjectsProvider } from "@/hooks/useProjectsStore";

// Scoped to /projects only — the list page and /projects/[id] detail page
// both read from the same in-memory ProjectsProvider without this reaching
// into the root layout or any other section of the app.
export default function ProjectsLayout({ children }: { children: ReactNode }) {
  return <ProjectsProvider>{children}</ProjectsProvider>;
}
