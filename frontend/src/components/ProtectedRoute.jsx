import { Navigate, useLocation } from "react-router-dom";

import LoadingPlaceholder from "./LoadingPlaceholder.jsx";
import { useAuth } from "../context/AuthContext.jsx";

export default function ProtectedRoute({ children }) {
  const { sessionStatus, token, retrySession, logout } = useAuth();
  const location = useLocation();

  if (sessionStatus === "checking") {
    return <LoadingPlaceholder label="Checking session" count={2} />;
  }

  if (sessionStatus === "unavailable") {
    return (
      <section className="panel" role="alert">
        <h1>Unable to check your session</h1>
        <p>We could not verify your session. Your login has been kept; try again when the service is available.</p>
        <div className="actions">
          <button type="button" onClick={retrySession}>Retry</button>
          <button type="button" className="secondary-button" onClick={logout}>Sign out</button>
        </div>
      </section>
    );
  }

  if (!token) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return children;
}
