import { useState } from "react";
import { useNavigate } from "react-router-dom";
import PageHero from "../components/PageHero.jsx";

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "No se pudo iniciar sesión");
      localStorage.setItem("auth-token", data.token);
      navigate("/admin");
    } catch (err) {
      setError(err.message || "Error de conexión con el servidor de auth");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main>
      <PageHero title="Login" subtitle="Demo: demo@curso.dev / curso123" />
      <section className="px-4 md:px-6 py-12 max-w-md mx-auto">
        <form onSubmit={handleSubmit} className="theme-surface border rounded-2xl p-6 space-y-4">
          <div>
            <label htmlFor="login-email" className="block text-sm font-medium theme-text mb-1.5">Email</label>
            <input
              id="login-email"
              type="email"
              name="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="theme-input rounded-lg px-3 py-2.5 w-full"
              autoComplete="email"
              required
            />
          </div>
          <div>
            <label htmlFor="login-password" className="block text-sm font-medium theme-text mb-1.5">Contraseña</label>
            <input
              id="login-password"
              type="password"
              name="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="theme-input rounded-lg px-3 py-2.5 w-full"
              autoComplete="current-password"
              required
            />
          </div>
          {error && (
            <p className="text-red-500 text-sm" role="alert">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full px-6 py-3 rounded-full theme-accent-btn font-semibold disabled:opacity-60"
          >
            {loading ? "Entrando…" : "Entrar"}
          </button>
        </form>
      </section>
    </main>
  );
}
