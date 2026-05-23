import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { registerUser } from "../api/auth.js";

export default function RegisterPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: "", email: "", password: "" });
  const [error, setError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    try {
      await registerUser(form);
      navigate("/login");
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <section className="auth-page">
      <h1>Register</h1>
      <form onSubmit={handleSubmit} className="form-card">
        <input placeholder="Username" value={form.username} onChange={(event) => setForm({ ...form, username: event.target.value })} />
        <input placeholder="Email" type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} />
        <input placeholder="Password" type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} />
        {error && <p className="error">{error}</p>}
        <button type="submit">Register</button>
      </form>
      <p><Link to="/login">Already have an account?</Link></p>
    </section>
  );
}
