import { createContext, useContext, useEffect, useMemo, useState } from "react";

import { getCurrentUser } from "../api/auth.js";
import { clearAuthToken, getAuthToken, setAuthToken } from "../api/session.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => getAuthToken());
  const [user, setUser] = useState(null);
  const [isAuthReady, setIsAuthReady] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadStoredUser() {
      if (!token) {
        setIsAuthReady(true);
        return;
      }

      try {
        const profile = await getCurrentUser();
        if (!active) return;
        setUser(profile?.message ? null : profile);
      } catch {
        clearAuthToken();
        if (!active) return;
        setToken(null);
        setUser(null);
      } finally {
        if (active) setIsAuthReady(true);
      }
    }

    loadStoredUser();

    return () => {
      active = false;
    };
  }, [token]);

  const value = useMemo(() => ({
    isAuthReady,
    token,
    user,
    login(nextToken, nextUser = null) {
      setAuthToken(nextToken);
      setToken(nextToken);
      setUser(nextUser);
    },
    setUser,
    logout() {
      clearAuthToken();
      setToken(null);
      setUser(null);
    }
  }), [isAuthReady, token, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
