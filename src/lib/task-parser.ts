import type { Task } from "@/types/task";

function generateId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `task-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

// Lightweight heuristic parser standing in for real AI/date recognition.
export function createTaskFromText(text: string): Task {
  const trimmed = text.trim();
  const lower = trimmed.toLowerCase();

  const isTomorrow = lower.includes("завтра");
  const isImportant = lower.includes("важно") || lower.includes("срочно");

  return {
    id: generateId(),
    title: trimmed,
    dueLabel: isTomorrow ? "Завтра" : "—",
    priority: isTomorrow ? "upcoming" : "none",
    completed: false,
    important: isImportant,
  };
}
