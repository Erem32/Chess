import { Link, useNavigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext.jsx";

export default function Navbar({ theme, onToggleTheme }) {
  const navigate = useNavigate();
  const { token, user, logout } = useAuth();

  function handleReload() {
    window.location.reload();
  }

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <header className="navbar">
      <Link to="/dashboard" className="brand" aria-label="szachy2.pl home">
        <span className="brand-mark">szachy</span>
        <span className="brand-accent">2</span>
        <span className="brand-domain">.pl</span>
      </Link>
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
            <button type="button" className="secondary-button nav-action-button" onClick={handleReload}>
              Reload
            </button>
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
