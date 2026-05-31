import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  clearAuthToken,
  getCurrentUser,
  login as loginRequest,
  logout as logoutRequest,
  register as registerRequest,
  refreshSession,
  setAuthToken,
} from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const logout = useCallback(async () => {
    clearAuthToken();
    setUser(null);
    await logoutRequest().catch(() => {});
  }, []);

  const refreshUser = useCallback(async () => {
    setLoading(true);

    try {
      const refreshed = await refreshSession();

      if (!refreshed?.token) {
        setUser(null);
        return null;
      }

      const result = await getCurrentUser();
      setUser(result.user);
      return result.user;
    } catch {
      clearAuthToken();
      setUser(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const login = useCallback(async (payload) => {
    const result = await loginRequest(payload);
    setAuthToken(result.token);
    setUser(result.user);
    return result.user;
  }, []);

  const register = useCallback(async (payload) => {
    const result = await registerRequest(payload);
    setAuthToken(result.token);
    setUser(result.user);
    return result.user;
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const value = useMemo(
    () => ({
      user,
      loading,
      login,
      register,
      logout,
      refreshUser,
      isAdmin: user?.role === "admin",
      isAuthenticated: Boolean(user),
    }),
    [user, loading, login, register, logout, refreshUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
}
