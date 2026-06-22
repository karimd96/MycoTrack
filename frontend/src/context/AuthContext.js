import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { api, apiError } from "@/lib/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  // null = checking, false = unauthenticated, object = user
  const [user, setUser] = useState(null);

  const refresh = useCallback(async () => {
    try {
      const { data } = await api.get("/auth/me");
      setUser(data);
      return data;
    } catch {
      setUser(false);
      return false;
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const login = async (email, password) => {
    const { data } = await api.post("/auth/login", { email, password });
    setUser(data);
    return data;
  };

  const register = async (email, password, full_name) => {
    const { data } = await api.post("/auth/register", { email, password, full_name });
    setUser(data);
    return data;
  };

  const logout = async () => {
    try {
      await api.post("/auth/logout");
    } catch {
      /* ignore */
    }
    setUser(false);
  };

  const role = user && typeof user === "object" ? user.role?.name : null;
  const isAdmin = role === "admin";
  const canWrite = role === "admin" || role === "operator";

  return (
    <AuthContext.Provider
      value={{ user, role, isAdmin, canWrite, login, register, logout, refresh, apiError }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
