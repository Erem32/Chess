import { Navigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext.jsx";

export default function ProtectedRoute({ children }) {
  const { isAuthReady, token } = useAuth();

  if (!isAuthReady) {
    return <p className="muted">Checking session...</p>;
  }

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
