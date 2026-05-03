import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  getAuthToken,
  getCurrentUser,
  login as loginRequest,
  register as registerRequest,
  setAuthToken,
} from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(Boolean(getAuthToken()));

  const logout = useCallback(() => {
    setAuthToken("");
    setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    const token = getAuthToken();

    if (!token) {
      setUser(null);
      setLoading(false);
      return null;
    }

    setLoading(true);

    try {
      const result = await getCurrentUser();
      setUser(result.user);
      return result.user;
    } catch {
      logout();
      return null;
    } finally {
      setLoading(false);
    }
  }, [logout]);

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
