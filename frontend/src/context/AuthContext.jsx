import { createContext, useContext, useEffect, useMemo, useState } from "react";

import { getCurrentUser } from "../api/auth.js";
import { clearAuthToken, getAuthToken, setAuthToken } from "../api/session.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => getAuthToken());
  const [user, setUser] = useState(null);
  const [sessionStatus, setSessionStatus] = useState("checking");
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    let active = true;

    async function loadStoredUser() {
      if (!token) {
        setSessionStatus("ready");
        return;
      }

      setSessionStatus("checking");
      try {
        const profile = await getCurrentUser();
        if (!active) return;
        setUser(profile);
        setSessionStatus("ready");
      } catch (error) {
        if (!active) return;
        if (error.status === 401 || error.status === 403) {
          clearAuthToken();
          setToken(null);
          setUser(null);
          setSessionStatus("ready");
        } else {
          setSessionStatus("unavailable");
        }
      }
    }

    loadStoredUser();
    return () => { active = false; };
  }, [token, retryCount]);

  const value = useMemo(() => ({
    isAuthReady: sessionStatus === "ready",
    sessionStatus,
    token,
    user,
    login(nextToken) {
      setAuthToken(nextToken);
      setUser(null);
      setSessionStatus("checking");
      setToken(nextToken);
      // Revalidate even if the same token is issued again.
      setRetryCount((count) => count + 1);
    },
    retrySession() {
      setSessionStatus("checking");
      setRetryCount((count) => count + 1);
    },
    setUser,
    logout() {
      clearAuthToken();
      setToken(null);
      setUser(null);
      setSessionStatus("ready");
    }
  }), [sessionStatus, token, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
