import { useEffect, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext.jsx";
import UiIcon from "./UiIcon.jsx";

export default function Navbar({ theme, onToggleTheme }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const { token, user, logout } = useAuth();
  useEffect(() => { setMenuOpen(false); }, [location.pathname]);

  function handleLogout() {
    logout();
    navigate("/login");
  }

  const links = [["/dashboard", "Play"], ["/lessons", "Lessons"], ["/puzzles", "Puzzles"], ["/opening", "Opening"], ["/examples", "Examples"], ["/history", "History"]];
  const current = location.pathname.startsWith("/games/") ? "Play" : ([...links, ["/settings", "Settings"], ["/login", "Login"], ["/register", "Register"]].find(([path]) => location.pathname === path)?.[1] ?? "");
  return <header className="navbar">
    <Link to="/dashboard" className="brand" aria-label="szachy2.pl home" onClick={() => setMenuOpen(false)}>
      <span className="brand-mark">szachy</span><span className="brand-accent">2</span><span className="brand-domain">.pl</span>
    </Link>
    <span className="nav-current" aria-hidden="true">{current}</span>
    <button type="button" className="secondary-button nav-menu-toggle" aria-expanded={menuOpen}
      aria-controls="main-navigation" onClick={() => setMenuOpen((open) => !open)}>
      <UiIcon name={menuOpen ? "close" : "menu"} /> {menuOpen ? "Close" : "Menu"}
    </button>
    <nav id="main-navigation" className={menuOpen ? "is-open" : ""} aria-label="Main navigation"
      onClick={(event) => { if (event.target.closest("a")) setMenuOpen(false); }}>
      <div className="nav-links">
        {token ? links.map(([path, label]) => <NavLink key={path} to={path} className={({ isActive }) =>
          `nav-link${isActive || (path === "/dashboard" && location.pathname.startsWith("/games/")) ? " is-active" : ""}`} aria-current={path === "/dashboard" && location.pathname.startsWith("/games/") ? "page" : undefined}>{label}</NavLink>) : <>
          <NavLink className={({ isActive }) => `nav-link${isActive ? " is-active" : ""}`} to="/login">Login</NavLink><NavLink className={({ isActive }) => `nav-link${isActive ? " is-active" : ""}`} to="/register">Register</NavLink>
        </>}
      </div>
      <div className="nav-tools">
        <button type="button" className="theme-toggle" onClick={onToggleTheme}
          aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`} aria-pressed={theme === "light"}>
          <span className="theme-icon" aria-hidden="true">◐</span><span className="theme-track" aria-hidden="true"><span className={`theme-thumb ${theme === "light" ? "is-light" : ""}`} /></span><span className="theme-icon" aria-hidden="true">○</span>
        </button>
        <NavLink to="/settings" className={({ isActive }) => `nav-link${isActive ? " is-active" : ""}`}>Settings</NavLink>
        {token && <><span className="nav-user">{user?.username}</span><button type="button" className="secondary-button nav-logout" onClick={handleLogout}>Logout</button></>}
      </div>
    </nav>
  </header>;
}
