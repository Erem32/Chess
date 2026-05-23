import { createContext, useContext, useMemo, useState } from "react";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem("access_token"));

  const value = useMemo(() => ({
    token,
    login(nextToken) {
      localStorage.setItem("access_token", nextToken);
      setToken(nextToken);
    },
    logout() {
      localStorage.removeItem("access_token");
      setToken(null);
    }
  }), [token]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
