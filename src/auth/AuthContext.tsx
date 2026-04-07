import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { matchAdmin } from "./demoUsers";
import {
  clearSession,
  isAdminSession,
  loadSession,
  saveSession,
  type StoredSession,
} from "./sessionStorage";
import type { DemoUser } from "./demoUsers";

type AuthContextValue = {
  session: StoredSession | null;
  isAdmin: boolean;
  login: (username: string, password: string) => boolean;
  loginGuest: () => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<StoredSession | null>(() =>
    loadSession()
  );

  const login = useCallback((username: string, password: string) => {
    if (!matchAdmin(username, password)) return false;
    const user: DemoUser = {
      username: username.trim(),
      role: "admin",
      displayName: "관리자(KSH)",
    };
    const next: StoredSession = { user, loggedAt: Date.now() };
    saveSession(next);
    setSession(next);
    return true;
  }, []);

  const loginGuest = useCallback(() => {
    const user: DemoUser = {
      username: "guest",
      role: "guest",
      displayName: "비회원(키오스크)",
    };
    const next: StoredSession = { user, loggedAt: Date.now() };
    saveSession(next);
    setSession(next);
  }, []);

  const logout = useCallback(() => {
    clearSession();
    setSession(null);
  }, []);

  const value = useMemo(
    () => ({
      session,
      isAdmin: isAdminSession(session),
      login,
      loginGuest,
      logout,
    }),
    [session, login, loginGuest, logout]
  );

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
