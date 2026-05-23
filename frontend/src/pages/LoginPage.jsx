import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { loginUser } from "../api/auth.js";
import { useAuth } from "../context/AuthContext.jsx";

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({ username_or_email: "", password: "" });
  const [error, setError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    try {
      const data = await loginUser(form);
      login(data.access_token ?? "scaffold-token");
      navigate("/dashboard");
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <section className="auth-page">
      <h1>Login</h1>
      <form onSubmit={handleSubmit} className="form-card">
        <input placeholder="Username or email" value={form.username_or_email} onChange={(event) => setForm({ ...form, username_or_email: event.target.value })} />
        <input placeholder="Password" type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} />
        {error && <p className="error">{error}</p>}
        <button type="submit">Login</button>
      </form>
      <p><Link to="/register">Create an account</Link></p>
    </section>
  );
}
