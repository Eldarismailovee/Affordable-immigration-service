import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  clearAuthTokens,
  getAuthToken,
  getRefreshToken,
  getCurrentUser,
  login as loginRequest,
  logout as logoutRequest,
  register as registerRequest,
  setAuthTokens,
} from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(Boolean(getAuthToken() || getRefreshToken()));

  const logout = useCallback(async () => {
    const refreshToken = getRefreshToken();
    clearAuthTokens();
    setUser(null);

    if (refreshToken) {
      await logoutRequest(refreshToken).catch(() => {});
    }
  }, []);

  const refreshUser = useCallback(async () => {
    if (!getAuthToken() && !getRefreshToken()) {
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
    setAuthTokens(result);
    setUser(result.user);
    return result.user;
  }, []);

  const register = useCallback(async (payload) => {
    const result = await registerRequest(payload);
    setAuthTokens(result);
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
