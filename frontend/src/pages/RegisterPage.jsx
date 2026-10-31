import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { registerUser } from "../api/auth.js";

export default function RegisterPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    if (isSubmitting) return;
    setError("");
    setIsSubmitting(true);
    try {
      await registerUser(form);
      navigate("/login", { replace: true, state: { registrationComplete: true } });
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="auth-page">
      <h1>Register</h1>
      <form onSubmit={handleSubmit} className="form-card" aria-busy={isSubmitting}>
        <div className="auth-field">
          <label htmlFor="register-username">Username</label>
          <input id="register-username" name="username" autoComplete="username" required value={form.username} onChange={(event) => setForm({ ...form, username: event.target.value })} />
        </div>
        <div className="auth-field">
          <label htmlFor="register-email">Email</label>
          <input id="register-email" name="email" type="email" autoComplete="email" required value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} />
        </div>
        <div className="auth-field">
          <label htmlFor="register-password">Password</label>
          <input id="register-password" name="password" type="password" autoComplete="new-password" required value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} />
        </div>
        {error && <p className="error auth-error" role="alert">{error}</p>}
        <button type="submit" disabled={isSubmitting}>{isSubmitting ? "Creating account..." : "Register"}</button>
      </form>
      <p><Link to="/login">Already have an account?</Link></p>
    </section>
  );
}
