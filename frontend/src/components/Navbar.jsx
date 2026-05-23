import { Link } from "react-router-dom";

import { useAuth } from "../context/AuthContext.jsx";

export default function Navbar() {
  const { token, logout } = useAuth();

  return (
    <header className="navbar">
      <Link to="/dashboard" className="brand">Online Chess</Link>
      <nav>
        {token ? (
          <>
            <Link to="/history">History</Link>
            <button type="button" onClick={logout}>Logout</button>
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
