import { Link, useNavigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext.jsx";

export default function Navbar({ theme, onToggleTheme }) {
  const navigate = useNavigate();
  const { token, user, logout } = useAuth();

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <header className="navbar">
      <Link to="/dashboard" className="brand">Online Chess</Link>
      <nav>
        <button
          type="button"
          className="theme-toggle"
          onClick={onToggleTheme}
          aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
          aria-pressed={theme === "light"}
        >
          <span className="theme-icon" aria-hidden="true">◐</span>
          <span className="theme-track" aria-hidden="true">
            <span className={`theme-thumb ${theme === "light" ? "is-light" : ""}`} />
          </span>
          <span className="theme-icon" aria-hidden="true">○</span>
        </button>
        {token ? (
          <>
            {user?.username && <span className="nav-user">{user.username}</span>}
            <Link to="/history">History</Link>
            <button type="button" onClick={handleLogout}>Logout</button>
          </>
        ) : (
          <>
            <Link to="/login">Login</Link>
            <Link to="/register">Register</Link>
          </>
        )}
      </nav>
    </header>
  );
}
