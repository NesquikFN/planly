import type { Task } from "@/types/task";
import type { CalendarEvent } from "@/types/calendar";

// The only place that talks to the Planly backend. Replaces the former
// Supabase clients (lib/supabase/*) — there is no direct database access
// from the browser anymore: every read and write goes through the API,
// which derives the owner from the session cookie. Nothing here ever
// sends a user id; passing one would be meaningless, since the server
// ignores anything but the session.
//
// Requests go through a relative /api path, not the backend's own origin
// — next.config.mjs rewrites /api/* to the backend server-side. From the
// browser's point of view this is a same-origin request, which is what
// keeps the session cookie same-site: without it, Safari's Intelligent
// Tracking Prevention refuses to persist a cookie set from a cross-site
// fetch(), and login would appear to succeed while every request after
// it came back unauthenticated.

export class NetworkError extends Error {
  constructor(message = "Не удалось подключиться к серверу.") {
    super(message);
    this.name = "NetworkError";
  }
}

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

/**
 * Shows the user only messages from our own error types (they're always
 * Russian and safe to display) — any other technical error is hidden
 * behind one shared fallback. The full error is logged either way.
 */
export function getErrorMessage(error: unknown): string {
  console.error(error);
  if (error instanceof NetworkError || error instanceof ApiError) {
    return error.message;
  }
  return "Что-то пошло не так. Попробуйте ещё раз.";
}

interface ApiErrorBody {
  error: {
    code: string;
    message: string;
  };
}

function isApiErrorBody(value: unknown): value is ApiErrorBody {
  if (typeof value !== "object" || value === null) return false;
  const errorField = (value as Record<string, unknown>).error;
  if (typeof errorField !== "object" || errorField === null) return false;
  const { code, message } = errorField as Record<string, unknown>;
  return typeof code === "string" && typeof message === "string";
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;

  try {
    response = await fetch(`/api${path}`, {
      ...init,
      // The session lives in an httpOnly cookie on the backend's domain,
      // so every request has to opt into sending it — on Railway the two
      // services are on different hosts, which makes this cross-origin.
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...init?.headers,
      },
    });
  } catch {
    throw new NetworkError();
  }

  if (!response.ok) {
    let body: unknown = null;
    try {
      body = await response.json();
    } catch {
      // Not every failure has a JSON body (a proxy 502, for instance).
    }
    if (isApiErrorBody(body)) {
      throw new ApiError(response.status, body.error.code, body.error.message);
    }
    throw new ApiError(response.status, "UNKNOWN", "Что-то пошло не так. Попробуйте ещё раз.");
  }

  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

const json = (body: unknown): RequestInit => ({ body: JSON.stringify(body) });

// --- Auth ---

export interface ApiUser {
  id: string;
  email: string;
  emailVerified: boolean;
  createdAt: string;
}

export interface ApiProfile {
  id: string;
  email: string | null;
  fullName: string | null;
  firstName: string | null;
  lastName: string | null;
  displayName: string | null;
  phone: string | null;
  jobTitle: string | null;
  company: string | null;
  bio: string | null;
  avatarUrl: string | null;
  timezone: string;
  language: string;
  createdAt: string;
  updatedAt: string;
}

export interface SessionResponse {
  user: ApiUser;
  profile: ApiProfile;
}

export interface RegisterResponse extends SessionResponse {
  /** True when the backend runs with REQUIRE_EMAIL_VERIFICATION on: no session was issued, the user must confirm their email first. */
  verificationRequired: boolean;
}

export const authApi = {
  register(input: { email: string; password: string; firstName?: string; fullName?: string }): Promise<RegisterResponse> {
    return request<RegisterResponse>("/auth/register", { method: "POST", ...json(input) });
  },

  login(input: { email: string; password: string }): Promise<SessionResponse> {
    return request<SessionResponse>("/auth/login", { method: "POST", ...json(input) });
  },

  logout(): Promise<void> {
    return request<void>("/auth/logout", { method: "POST" });
  },

  requestPasswordReset(email: string): Promise<void> {
    return request<void>("/auth/password-reset", { method: "POST", ...json({ email }) });
  },

  resetPassword(token: string, password: string): Promise<void> {
    return request<void>("/auth/password-reset/confirm", { method: "POST", ...json({ token, password }) });
  },

  verifyEmail(token: string): Promise<void> {
    return request<void>("/auth/verify-email", { method: "POST", ...json({ token }) });
  },

  resendVerification(email: string): Promise<void> {
    return request<void>("/auth/verify-email/resend", { method: "POST", ...json({ email }) });
  },
};

// --- Profile ---

export type ProfilePatch = Partial<Omit<ApiProfile, "id" | "email" | "createdAt" | "updatedAt">>;

export const meApi = {
  /** Current session + profile. Returns null when nobody is signed in —
   * a 401 here is the normal "not logged in" answer, not a failure. */
  async get(): Promise<SessionResponse | null> {
    try {
      return await request<SessionResponse>("/me");
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) return null;
      throw error;
    }
  },

  update(patch: ProfilePatch): Promise<SessionResponse> {
    return request<SessionResponse>("/me", { method: "PATCH", ...json(patch) });
  },
};

// --- Tasks ---

export const tasksApi = {
  async list(): Promise<Task[]> {
    return (await request<{ tasks: Task[] }>("/tasks")).tasks;
  },

  async create(task: Task): Promise<Task> {
    return (await request<{ task: Task }>("/tasks", { method: "POST", ...json(task) })).task;
  },

  async update(taskId: string, patch: Partial<Task>): Promise<Task> {
    return (await request<{ task: Task }>(`/tasks/${taskId}`, { method: "PATCH", ...json(patch) })).task;
  },

  /** Replaces the whole task, keeping its id — used when restoring one out of the Archive. */
  async replace(task: Task): Promise<Task> {
    const { id, ...body } = task;
    return (await request<{ task: Task }>(`/tasks/${id}`, { method: "PUT", ...json(body) })).task;
  },

  remove(taskId: string): Promise<void> {
    return request<void>(`/tasks/${taskId}`, { method: "DELETE" });
  },

  /** One-shot upload of locally cached tasks. Never overwrites rows that already exist. */
  importMany(tasks: Task[]): Promise<{ imported: number }> {
    return request<{ imported: number }>("/tasks/import", { method: "POST", ...json({ tasks }) });
  },
};

// --- Calendar ---

export const calendarApi = {
  async list(): Promise<CalendarEvent[]> {
    return (await request<{ events: CalendarEvent[] }>("/calendar-events")).events;
  },

  async create(event: CalendarEvent): Promise<CalendarEvent> {
    return (await request<{ event: CalendarEvent }>("/calendar-events", { method: "POST", ...json(event) })).event;
  },

  async update(eventId: string, patch: Partial<CalendarEvent>): Promise<CalendarEvent> {
    return (await request<{ event: CalendarEvent }>(`/calendar-events/${eventId}`, { method: "PATCH", ...json(patch) })).event;
  },

  remove(eventId: string): Promise<void> {
    return request<void>(`/calendar-events/${eventId}`, { method: "DELETE" });
  },
};
