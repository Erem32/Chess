import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext.jsx";

export default function Navbar({ theme, onToggleTheme }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => { setMenuOpen(false); }, [location.pathname]);
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
      <Link to="/dashboard" className="brand" aria-label="szachy2.pl home" onClick={() => setMenuOpen(false)}>
        <span className="brand-mark">szachy</span>
        <span className="brand-accent">2</span>
        <span className="brand-domain">.pl</span>
      </Link>
      <button type="button" className="secondary-button nav-menu-toggle" aria-expanded={menuOpen}
        aria-controls="main-navigation" onClick={() => setMenuOpen((open) => !open)}>
        {menuOpen ? "Close" : "Menu"}
      </button>
      <nav id="main-navigation" className={menuOpen ? "is-open" : ""} aria-label="Main navigation"
        onClick={(event) => { if (event.target.closest("a")) setMenuOpen(false); }}>
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
        <Link to="/settings">Settings</Link>
        {token ? (
          <>
            <button type="button" className="secondary-button nav-action-button" onClick={handleReload}>
              Reload
            </button>
            {user?.username && <span className="nav-user">{user.username}</span>}
            <Link to="/lessons">Lessons</Link>
            <Link to="/puzzles">Puzzles</Link>
            <Link to="/opening">Opening</Link>
            <Link to="/examples">Examples</Link>
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
