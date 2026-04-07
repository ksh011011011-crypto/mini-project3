import type { DemoUser } from "./demoUsers";

const KEY = "sehyeon-demo-session";

export type StoredSession = {
  user: DemoUser;
  loggedAt: number;
};

export function loadSession(): StoredSession | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const p = JSON.parse(raw) as StoredSession;
    if (!p?.user?.username || !p?.user?.role) return null;
    return p;
  } catch {
    return null;
  }
}

export function saveSession(s: StoredSession): void {
  localStorage.setItem(KEY, JSON.stringify(s));
}

export function clearSession(): void {
  localStorage.removeItem(KEY);
}

export function isAdminSession(s: StoredSession | null): boolean {
  return s?.user.role === "admin";
}
