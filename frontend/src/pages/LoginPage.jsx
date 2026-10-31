import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import { loginUser } from "../api/auth.js";
import { useAuth } from "../context/AuthContext.jsx";

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [form, setForm] = useState({ username_or_email: "", password: "" });
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    if (isSubmitting) return;
    setError("");
    setIsSubmitting(true);
    try {
      const data = await loginUser(form);
      if (!data?.access_token) {
        throw new Error("Login response did not include an access token");
      }
      login(data.access_token);
      const from = location.state?.from;
      const pathname = typeof from?.pathname === "string" && from.pathname.startsWith("/") && !from.pathname.startsWith("//")
        ? from.pathname
        : "/dashboard";
      const search = typeof from?.search === "string" && from.search.startsWith("?") ? from.search : "";
      const hash = typeof from?.hash === "string" && from.hash.startsWith("#") ? from.hash : "";
      navigate(`${pathname}${search}${hash}`, { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="auth-page">
      <h1>Login</h1>
      {location.state?.registrationComplete && (
        <p className="auth-notice" role="status">Account created. You can now log in.</p>
      )}
      <form onSubmit={handleSubmit} className="form-card" aria-busy={isSubmitting}>
        <div className="auth-field">
          <label htmlFor="login-identity">Username or email</label>
          <input id="login-identity" name="username_or_email" autoComplete="username" required value={form.username_or_email} onChange={(event) => setForm({ ...form, username_or_email: event.target.value })} />
        </div>
        <div className="auth-field">
          <label htmlFor="login-password">Password</label>
          <input id="login-password" name="password" type="password" autoComplete="current-password" required value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} />
        </div>
        {error && <p className="error auth-error" role="alert">{error}</p>}
        <button type="submit" disabled={isSubmitting}>{isSubmitting ? "Logging in..." : "Login"}</button>
      </form>
      <p><Link to="/register">Create an account</Link></p>
    </section>
  );
}
