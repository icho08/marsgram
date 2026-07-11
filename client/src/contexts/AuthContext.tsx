import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { api, clearToken, setToken, type ApiUser } from "@/lib/api";
import { connectSocket, disconnectSocket } from "@/lib/socket";

interface AuthContextValue {
  user: ApiUser | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, username: string, password: string, name: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  updateUser: (partial: Partial<ApiUser>) => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<ApiUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = async () => {
    try {
      const me = await api<ApiUser>("/me");
      setUser(me);
      connectSocket();
    } catch {
      clearToken();
      setUser(null);
      disconnectSocket();
    }
  };

  useEffect(() => {
    refreshUser().finally(() => setIsLoading(false));
  }, []);

  const login = async (email: string, password: string) => {
    const res = await api<{ token: string }>("/sign_in", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    setToken(res.token);
    await refreshUser();
  };

  const signup = async (email: string, username: string, password: string, name: string) => {
    const res = await api<{ token: string }>("/sign_up", {
      method: "POST",
      body: JSON.stringify({ email, username, password, name }),
    });
    setToken(res.token);
    await refreshUser();
  };

  const logout = () => {
    clearToken();
    disconnectSocket();
    setUser(null);
  };

  const updateUser = (partial: Partial<ApiUser>) => {
    setUser((u) => (u ? { ...u, ...partial } : u));
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, signup, logout, refreshUser, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
