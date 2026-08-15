"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { useProjectsStore } from "@/hooks/useProjectsStore";
import { projectCard, projectSectionTitle } from "@/lib/projects";
import type { Project, ProjectRole } from "@/types/project";

export function ProjectTeamCard({ project }: { project: Project }) {
  const { addMember, removeMember, changeMemberRole, canManageMembers } = useProjectsStore();
  const [email, setEmail] = useState(""); const [error, setError] = useState(""); const manageable = canManageMembers(project);
  function add() { if (addMember(project.id, email)) { setEmail(""); setError(""); } else setError("Проверьте email или права доступа"); }
  return <section className={projectCard}><h3 className={projectSectionTitle}>Команда</h3>
    {manageable && <div className="mt-3 flex gap-2"><input value={email} onChange={e => setEmail(e.target.value)} type="email" placeholder="email@example.com" className="min-w-0 flex-1 rounded-lg border border-gray-200 bg-transparent px-2 py-1.5 text-xs dark:border-white/8 dark:text-ink-dim"/><button onClick={add} className="rounded-lg bg-accent px-2 text-xs text-white hover:bg-accent/90">Добавить</button></div>}
    {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    <ul className="mt-3 space-y-3">{project.members.map(member => <li key={member.id} className="flex items-center gap-2"><Avatar name={member.displayName ?? member.name} size={32}/><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium text-gray-900 dark:text-ink">{member.displayName ?? member.name}</p><p className="truncate text-xs text-gray-400 dark:text-ink-faint">{member.email} · {member.invitationStatus === "pending" ? "ожидает" : "принят"}</p></div>
      {manageable && member.role !== "Owner" ? <><select value={member.role} onChange={e => changeMemberRole(project.id, member.id, e.target.value as ProjectRole)} className="rounded border border-gray-200 bg-transparent p-1 text-xs dark:border-white/8 dark:text-ink-dim"><option value="Editor">Editor</option><option value="Viewer">Viewer</option></select><button onClick={() => removeMember(project.id, member.id)} className="text-gray-400 hover:text-red-500"><Trash2 size={14}/></button></> : <span className="text-xs text-gray-400 dark:text-ink-faint">{member.role}</span>}
    </li>)}</ul></section>;
}
