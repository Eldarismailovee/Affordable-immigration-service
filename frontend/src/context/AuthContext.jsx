import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  clearAuthToken,
  confirmMfaEnrollment,
  getAuthToken,
  getCurrentUser,
  login as loginRequest,
  logout as logoutRequest,
  register as registerRequest,
  refreshSession,
  setAuthToken,
  startMfaEnrollment,
  stepUpMfa,
  verifyMfa,
} from "../services/api";
import { cleanupLegacyBrowserStorage } from "../services/legacyStorageCleanup.js";
import { clearSessionNavigationStorage } from "../services/sessionNavigationStorage.js";
import { clearIdempotencyState } from "../services/idempotency.js";

const AuthContext = createContext(null);

const PRIVILEGED_ROLES = ["admin", "attorney"];
const LOGOUT_CHANNEL_NAME = "ais.auth.logout";

function publishLogoutEvent() {
  if (typeof globalThis.BroadcastChannel === "undefined") {
    return;
  }

  try {
    const channel = new BroadcastChannel(LOGOUT_CHANNEL_NAME);
    channel.postMessage({ type: "logout", timestamp: Date.now() });
    channel.close();
  } catch {
    // Non-fatal when BroadcastChannel is unavailable.
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mfaChallenge, setMfaChallenge] = useState(null);
  const [enrollmentSetup, setEnrollmentSetup] = useState(null);
  const [recoveryCodes, setRecoveryCodes] = useState(null);
  const [stepUpResolver, setStepUpResolver] = useState(null);

  const clearMfaState = useCallback(() => {
    setMfaChallenge(null);
    setEnrollmentSetup(null);
    setRecoveryCodes(null);
    setStepUpResolver(null);
  }, []);

  const logout = useCallback(async () => {
    clearAuthToken();
    setUser(null);
    clearMfaState();
    clearSessionNavigationStorage();
    cleanupLegacyBrowserStorage({ force: true });
    clearIdempotencyState();
    publishLogoutEvent();
    await logoutRequest().catch(() => {});
  }, [clearMfaState]);

  const applySession = useCallback((result) => {
    if (result?.token) {
      setAuthToken(result.token);
      setUser(result.user ?? null);
    }
  }, []);

  const applySessionFromVerification = useCallback((result) => {
    applySession(result);
  }, [applySession]);

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

    if (result.mfaRequired || result.mfaEnrollmentRequired) {
      setMfaChallenge({
        token: result.mfaChallengeToken,
        enrollmentRequired: Boolean(result.mfaEnrollmentRequired),
        user: result.user,
      });
      return { mfaPending: true, user: result.user, enrollmentRequired: result.mfaEnrollmentRequired };
    }

    applySession(result);
    clearMfaState();
    return result.user;
  }, [applySession, clearMfaState]);

  const completeMfaVerify = useCallback(async ({ code, recoveryCode }) => {
    if (!mfaChallenge?.token) {
      throw new Error("MFA challenge expired. Sign in again.");
    }

    const result = await verifyMfa({
      challengeToken: mfaChallenge.token,
      ...(code ? { code } : {}),
      ...(recoveryCode ? { recoveryCode } : {}),
    });

    applySession(result);
    clearMfaState();
    return result.user;
  }, [applySession, clearMfaState, mfaChallenge]);

  const beginEnrollment = useCallback(async ({ password } = {}) => {
    const payload = mfaChallenge?.token
      ? { challengeToken: mfaChallenge.token, password }
      : { password };

    const setup = await startMfaEnrollment(payload);
    setEnrollmentSetup(setup);
    return setup;
  }, [mfaChallenge]);

  const finishEnrollment = useCallback(async (code) => {
    const result = await confirmMfaEnrollment({
      code,
      ...(mfaChallenge?.token ? { challengeToken: mfaChallenge.token } : {}),
    });

    if (result.recoveryCodes) {
      setRecoveryCodes(result.recoveryCodes);
    }

    if (result.token) {
      applySession(result);
      setMfaChallenge(null);
      setEnrollmentSetup(null);
    }

    return result;
  }, [applySession, mfaChallenge]);

  const acknowledgeRecoveryCodes = useCallback(() => {
    setRecoveryCodes(null);
  }, []);

  const performStepUp = useCallback(async ({ code, recoveryCode }) => {
    const result = await stepUpMfa({
      ...(code ? { code } : {}),
      ...(recoveryCode ? { recoveryCode } : {}),
    });
    setAuthToken(result.token);
    return result;
  }, []);

  const register = useCallback(async (payload) => {
    const result = await registerRequest(payload);
    applySession(result);
    return result.user;
  }, [applySession]);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  useEffect(() => {
    if (typeof globalThis.BroadcastChannel === "undefined") {
      return undefined;
    }

    const channel = new BroadcastChannel(LOGOUT_CHANNEL_NAME);

    channel.onmessage = (event) => {
      if (event.data?.type !== "logout") {
        return;
      }

      clearAuthToken();
      setUser(null);
      clearMfaState();
      clearSessionNavigationStorage();
      cleanupLegacyBrowserStorage({ force: true });
    };

    return () => {
      channel.close();
    };
  }, [clearMfaState]);

  const isPrivileged = PRIVILEGED_ROLES.includes(user?.role);
  const hasToken = Boolean(getAuthToken());
  const isEmailVerified = Boolean(user?.emailVerifiedAt);

  const value = useMemo(
    () => ({
      user,
      loading,
      login,
      register,
      logout,
      refreshUser,
      mfaChallenge,
      enrollmentSetup,
      recoveryCodes,
      completeMfaVerify,
      beginEnrollment,
      finishEnrollment,
      acknowledgeRecoveryCodes,
      performStepUp,
      stepUpResolver,
      setStepUpResolver,
      applySessionFromVerification,
      isAdmin: user?.role === "admin",
      isPrivileged,
      hasToken,
      isEmailVerified,
      isAuthenticated: Boolean(user && hasToken),
    }),
    [
      user,
      loading,
      login,
      register,
      logout,
      refreshUser,
      mfaChallenge,
      enrollmentSetup,
      recoveryCodes,
      completeMfaVerify,
      beginEnrollment,
      finishEnrollment,
      acknowledgeRecoveryCodes,
      performStepUp,
      stepUpResolver,
      applySessionFromVerification,
      isPrivileged,
      hasToken,
      isEmailVerified,
    ]
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
