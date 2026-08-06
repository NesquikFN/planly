"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { useProjectsStore } from "@/hooks/useProjectsStore";
import { useCalendarStore } from "@/hooks/useCalendarStore";
import { PlanlyDatePicker } from "@/components/ui/PlanlyDatePicker";
import { projectCard, projectSectionTitle } from "@/lib/projects";
import { addDays, addMonths, fromISODate, toISODate } from "@/lib/date-utils";
import type { Project, ProjectTimelinePreset } from "@/types/project";

const labels: Record<ProjectTimelinePreset, string> = { week: "Неделя", month: "Месяц", quarter: "Квартал", custom: "Свой период" };

export function ProjectTimelineTab({ project }: { project: Project }) {
  const { setTimeline, canEdit } = useProjectsStore();
  const { events, openCreateModal } = useCalendarStore();
  const initial = project.timeline ?? { preset: "month" as const, startDate: toISODate(new Date()), endDate: toISODate(addMonths(new Date(), 1)) };
  const [preset, setPreset] = useState<ProjectTimelinePreset>(initial.preset);
  const [start, setStart] = useState(initial.startDate); const [end, setEnd] = useState(initial.endDate); const [error, setError] = useState("");
  useEffect(() => { setPreset(initial.preset); setStart(initial.startDate); setEnd(initial.endDate); }, [project.id, project.timeline?.startDate, project.timeline?.endDate, project.timeline?.preset]);
  // Milestones only carry a pre-formatted display label (no machine-comparable
  // date), so they can't be range-filtered alongside tasks/events — shown as
  // their own list instead.
  const items = useMemo(() => [
    ...project.tasks.filter(t => t.dueDate && t.dueDate >= start && t.dueDate <= end).map(t => ({ id: t.id, date: t.dueDate!, title: t.title, type: "Задача" })),
    ...events.filter(e => e.projectId === project.id && e.date >= start && e.date <= end).map(e => ({ id: e.id, date: e.date, title: e.title, type: "Событие" })),
  ].sort((a,b) => a.date.localeCompare(b.date)), [project.tasks, project.id, events, start, end]);
  function choose(next: ProjectTimelinePreset) {
    setPreset(next); if (next === "custom") return;
    const base = fromISODate(start || toISODate(new Date()));
    setEnd(toISODate(next === "week" ? addDays(base, 6) : addMonths(base, next === "month" ? 1 : 3)));
  }
  function save() { if (end < start) { setError("Дата окончания не может быть раньше даты начала"); return; } setError(""); setTimeline(project.id, preset, start, end); }
  return <div className="space-y-4">
    <div className="flex items-center justify-between">
      <h2 className="text-base font-semibold text-gray-900 dark:text-ink">Timeline проекта</h2>
      {canEdit(project) && (
        <button
          type="button"
          onClick={() => openCreateModal({ project: project.name, projectId: project.id, date: toISODate(new Date()) })}
          className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-3.5 py-2 text-sm font-medium text-white hover:bg-accent/90"
        >
          <Plus size={15} />
          Новое событие
        </button>
      )}
    </div>

    <section className={projectCard}>
      <div className="flex flex-wrap gap-2">{(Object.keys(labels) as ProjectTimelinePreset[]).map(p => <button key={p} onClick={() => choose(p)} disabled={!canEdit(project)} className={`rounded-lg px-3 py-1.5 text-sm ${preset === p ? "bg-accent text-white" : "bg-gray-100 text-gray-600 dark:bg-surface-2 dark:text-ink-dim"}`}>{labels[p]}</button>)}</div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="block text-xs text-gray-500 dark:text-ink-faint">
          <span className="mb-1 block">Начало проекта</span>
          <PlanlyDatePicker value={start} onChange={setStart} disabled={!canEdit(project)} required />
        </label>
        <label className="block text-xs text-gray-500 dark:text-ink-faint">
          <span className="mb-1 block">Окончание проекта</span>
          <PlanlyDatePicker value={end} onChange={setEnd} disabled={!canEdit(project)} required />
        </label>
      </div>
      {error && <p className="mt-2 text-xs text-red-500">{error}</p>}
      {canEdit(project) && <button onClick={save} className="mt-3 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent/90">Сохранить период</button>}
    </section>
    <section className={projectCard}>
      <h3 className={projectSectionTitle}>События и дедлайны в периоде</h3>
      {items.length ? <ul className="mt-3 divide-y divide-gray-100 dark:divide-white/8">{items.map(i => <li key={`${i.type}-${i.id}`} className="flex justify-between py-2 text-sm text-gray-700 dark:text-ink-dim"><span>{i.title} <span className="text-xs text-gray-400 dark:text-ink-faint">· {i.type}</span></span><time className="text-gray-400 dark:text-ink-faint">{i.date}</time></li>)}</ul> : <p className="mt-3 text-sm text-gray-400 dark:text-ink-faint">Нет задач и событий в выбранном периоде</p>}
    </section>

    <section className={projectCard}>
      <h3 className={projectSectionTitle}>Этапы проекта</h3>
      {project.milestones.length ? <ul className="mt-3 divide-y divide-gray-100 dark:divide-white/8">{project.milestones.map(m => <li key={m.id} className="flex items-center justify-between py-2 text-sm"><span className={m.status === "upcoming" ? "text-gray-400 dark:text-ink-faint" : "text-gray-700 dark:text-ink-dim"}>{m.label}</span><span className="text-xs text-gray-400 dark:text-ink-faint">{m.dateLabel}</span></li>)}</ul> : <p className="mt-3 text-sm text-gray-400 dark:text-ink-faint">Этапы не заданы</p>}
    </section>
  </div>;
}
