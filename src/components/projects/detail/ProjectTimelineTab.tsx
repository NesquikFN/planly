"use client";

import { useEffect, useMemo, useState } from "react";
import { useProjectsStore } from "@/hooks/useProjectsStore";
import { useCalendarStore } from "@/hooks/useCalendarStore";
import { addDays, addMonths, fromISODate, toISODate } from "@/lib/date-utils";
import type { Project, ProjectTimelinePreset } from "@/types/project";

const labels: Record<ProjectTimelinePreset, string> = { week: "Неделя", month: "Месяц", quarter: "Квартал", custom: "Свой период" };

export function ProjectTimelineTab({ project }: { project: Project }) {
  const { setTimeline, canEdit } = useProjectsStore(); const { events } = useCalendarStore();
  const initial = project.timeline ?? { preset: "month" as const, startDate: toISODate(new Date()), endDate: toISODate(addMonths(new Date(), 1)) };
  const [preset, setPreset] = useState<ProjectTimelinePreset>(initial.preset);
  const [start, setStart] = useState(initial.startDate); const [end, setEnd] = useState(initial.endDate); const [error, setError] = useState("");
  useEffect(() => { setPreset(initial.preset); setStart(initial.startDate); setEnd(initial.endDate); }, [project.id, project.timeline?.startDate, project.timeline?.endDate, project.timeline?.preset]);
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
    <section className="rounded-2xl border border-gray-100 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
      <div className="flex flex-wrap gap-2">{(Object.keys(labels) as ProjectTimelinePreset[]).map(p => <button key={p} onClick={() => choose(p)} disabled={!canEdit(project)} className={`rounded-lg px-3 py-1.5 text-sm ${preset === p ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300"}`}>{labels[p]}</button>)}</div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2"><label className="text-xs text-gray-500">Начало<input type="date" value={start} disabled={!canEdit(project)} onChange={e => setStart(e.target.value)} className="mt-1 block w-full rounded-lg border border-gray-200 bg-transparent p-2 dark:border-gray-700"/></label><label className="text-xs text-gray-500">Окончание<input type="date" value={end} disabled={!canEdit(project)} onChange={e => setEnd(e.target.value)} className="mt-1 block w-full rounded-lg border border-gray-200 bg-transparent p-2 dark:border-gray-700"/></label></div>
      {error && <p className="mt-2 text-xs text-red-500">{error}</p>}
      {canEdit(project) && <button onClick={save} className="mt-3 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white">Сохранить период</button>}
    </section>
    <section className="rounded-2xl border border-gray-100 bg-white p-5 dark:border-gray-800 dark:bg-gray-900"><h3 className="font-semibold">Элементы в периоде</h3>{items.length ? <ul className="mt-3 divide-y divide-gray-100 dark:divide-gray-800">{items.map(i => <li key={`${i.type}-${i.id}`} className="flex justify-between py-2 text-sm"><span>{i.title} <span className="text-xs text-gray-400">· {i.type}</span></span><time>{i.date}</time></li>)}</ul> : <p className="mt-3 text-sm text-gray-400">Нет задач и событий в выбранном периоде</p>}</section>
  </div>;
}
