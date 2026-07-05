"use client";

import { useCallback, useEffect, useState } from "react";
import type { AdminAnalyticsSummary } from "@/lib/analytics/store";
import {
  DonutChart,
  HorizontalBarChart,
  MiniBarChart,
  VisitsLineChart,
} from "@/components/admin/AdminCharts";

const LOCALE_LABELS: Record<string, string> = {
  es: "Español",
  en: "English",
  it: "Italiano",
  unknown: "Sin locale",
};

const LOCALE_COLORS: Record<string, string> = {
  es: "#4eb3c8",
  en: "#358c9f",
  it: "#2a6f7d",
  unknown: "#64748b",
};

function localeLabel(code: string) {
  return LOCALE_LABELS[code] ?? code.toUpperCase();
}

function KpiCard({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="admin-kpi">
      <p className="admin-kpi__label">{label}</p>
      <p className="admin-kpi__value">{value}</p>
    </div>
  );
}

function Panel({
  title,
  children,
  className = "",
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`admin-panel ${className}`.trim()}>
      <h2 className="admin-panel__title">{title}</h2>
      {children}
    </section>
  );
}

export default function AdminApp() {
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loadingLogin, setLoadingLogin] = useState(false);
  const [summary, setSummary] = useState<AdminAnalyticsSummary | null>(null);
  const [loadingData, setLoadingData] = useState(false);

  const loadSession = useCallback(async () => {
    const res = await fetch("/api/admin/auth/session");
    const data = await res.json();
    setAuthenticated(Boolean(data.authenticated));
    if (data.email) setEmail(data.email);
  }, []);

  const loadAnalytics = useCallback(async () => {
    setLoadingData(true);
    try {
      const res = await fetch("/api/admin/analytics");
      if (res.status === 401) {
        setAuthenticated(false);
        return;
      }
      const data = await res.json();
      if (data.ok) setSummary(data.summary);
    } finally {
      setLoadingData(false);
    }
  }, []);

  useEffect(() => {
    void loadSession();
  }, [loadSession]);

  useEffect(() => {
    if (authenticated) void loadAnalytics();
  }, [authenticated, loadAnalytics]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    setLoadingLogin(true);
    try {
      const res = await fetch("/api/admin/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.error === "admin_not_configured") {
          setLoginError(
            "Admin no configurado. Añade ADMIN_EMAIL y ADMIN_PASSWORD en .env.local",
          );
        } else {
          setLoginError("Credenciales incorrectas");
        }
        return;
      }
      setAuthenticated(true);
      setPassword("");
      await loadAnalytics();
    } finally {
      setLoadingLogin(false);
    }
  };

  const handleLogout = async () => {
    await fetch("/api/admin/auth/logout", { method: "POST" });
    setAuthenticated(false);
    setSummary(null);
  };

  if (authenticated === null) {
    return <div className="admin-loading">Cargando…</div>;
  }

  if (!authenticated) {
    return (
      <div className="admin-page">
        <div className="admin-login">
          <form className="admin-login__card" onSubmit={handleLogin}>
            <h1 className="admin-login__title">Admin portfolio</h1>
            <p className="admin-login__sub">
              Métricas de visitas, proyectos, Study Agents y curso de React.
            </p>
            {loginError ? <p className="admin-error">{loginError}</p> : null}
            <div className="admin-field">
              <label htmlFor="admin-email">Email</label>
              <input
                id="admin-email"
                type="email"
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="admin-field">
              <label htmlFor="admin-password">Contraseña</label>
              <input
                id="admin-password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <button
              type="submit"
              className="admin-btn admin-btn--primary"
              disabled={loadingLogin}
            >
              {loadingLogin ? "Entrando…" : "Entrar"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  const localeDonut =
    summary?.locales.map((l) => ({
      label: localeLabel(l.key),
      count: l.count,
      color: LOCALE_COLORS[l.key] ?? "#94a3b8",
    })) ?? [];

  return (
    <div className="admin-page">
      <div className="admin-page__inner admin-page__inner--wide">
        <header className="admin-header">
          <div>
            <h1 className="admin-header__title">Dashboard</h1>
            <p className="admin-header__meta">
              {email} · {loadingData ? "Actualizando…" : "Sin localhost ni /admin"}
            </p>
          </div>
          <div className="admin-header__actions">
            <button type="button" className="admin-btn" onClick={() => void loadAnalytics()}>
              Actualizar
            </button>
            <button type="button" className="admin-btn" onClick={() => void handleLogout()}>
              Salir
            </button>
          </div>
        </header>

        {!summary?.configured ? (
          <div className="admin-alert">
            Supabase no configurado. Define <code>SUPABASE_URL</code> y{" "}
            <code>SUPABASE_SERVICE_ROLE_KEY</code>.
          </div>
        ) : null}

        {summary && !summary.tableReady ? (
          <div className="admin-alert">
            Ejecuta <code>supabase/migrations/003_analytics.sql</code> en Supabase.
          </div>
        ) : null}

        {summary ? (
          <div className="admin-dashboard">
            <div className="admin-kpi-grid">
              <KpiCard label="Hoy" value={summary.visits.today} />
              <KpiCard label="Este mes" value={summary.visits.month} />
              <KpiCard label="Este año" value={summary.visits.year} />
              <KpiCard label="Páginas / sesión" value={summary.avgPagesPerSession} />
              <KpiCard label="Descargas CV" value={summary.cvDownloadsTotal} />
              <KpiCard label="Study Agents" value={summary.studyAgentsTotal} />
            </div>

            <div className="admin-grid admin-grid--2">
              <Panel title="Visitas — últimos 30 días" className="admin-panel--wide">
                <VisitsLineChart data={summary.visitsByDay} height={220} />
              </Panel>
              <Panel title="Idioma de visita">
                <DonutChart items={localeDonut} />
              </Panel>
            </div>

            <div className="admin-grid admin-grid--2">
              <Panel title="Top páginas">
                <HorizontalBarChart items={summary.visitsByPage} limit={8} />
              </Panel>
              <Panel title="Origen (referrer)">
                <HorizontalBarChart items={summary.referrers} limit={8} />
              </Panel>
            </div>

            <div className="admin-grid admin-grid--3">
              <Panel title="Vista proyectos">
                <MiniBarChart items={summary.projectsViewModes} />
              </Panel>
              <Panel title="Filtros por área">
                <MiniBarChart items={summary.projectFilters} />
              </Panel>
              <Panel title="Visitas por proyecto">
                <HorizontalBarChart items={summary.projectViews} limit={6} />
              </Panel>
            </div>

            <div className="admin-grid admin-grid--2">
              <Panel title="Study Agents">
                {summary.studyAgentsBackend ? (
                  <div className="admin-kpi-grid admin-kpi-grid--compact">
                    <KpiCard
                      label="Usuarios activos"
                      value={summary.studyAgentsBackend.active_users}
                    />
                    <KpiCard
                      label="Inscripciones"
                      value={summary.studyAgentsBackend.total_enrollments}
                    />
                    <KpiCard
                      label="Ingresos (€)"
                      value={summary.studyAgentsBackend.total_revenue.toFixed(2)}
                    />
                  </div>
                ) : null}
                <HorizontalBarChart items={summary.studyAgentsViews} limit={6} />
              </Panel>
              <Panel title="Descargas CV">
                <HorizontalBarChart items={summary.cvDownloads} limit={8} />
              </Panel>
            </div>

            <Panel title="Página × idioma">
              {summary.visitsByPageLocale.length === 0 ? (
                <p className="admin-empty">Sin datos todavía</p>
              ) : (
                <div className="admin-table-wrap">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Página</th>
                        <th>Idioma</th>
                        <th>Visitas</th>
                      </tr>
                    </thead>
                    <tbody>
                      {summary.visitsByPageLocale.slice(0, 20).map((row) => (
                        <tr key={`${row.page}-${row.locale}`}>
                          <td>{row.page}</td>
                          <td>{localeLabel(row.locale)}</td>
                          <td>{row.count}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Panel>

            <Panel title="Curso React — progreso alumnos">
              {summary.reactCourseUsers.length === 0 ? (
                <p className="admin-empty">Sin alumnos registrados</p>
              ) : (
                <div className="admin-table-wrap">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Alumno</th>
                        <th>Nivel</th>
                        <th>Superados</th>
                        <th>Progreso</th>
                        <th>Última act.</th>
                      </tr>
                    </thead>
                    <tbody>
                      {summary.reactCourseUsers.map((u) => {
                        const pct = Math.round((u.passed_levels / 30) * 100);
                        return (
                          <tr key={u.user_id}>
                            <td>{u.display_name ?? u.user_id.slice(0, 12)}</td>
                            <td>
                              {u.current_level > 30 ? "Completado" : `Nivel ${u.current_level}`}
                            </td>
                            <td>{u.passed_levels}/30</td>
                            <td>
                              <div className="admin-progress">
                                <div
                                  className="admin-progress__fill"
                                  style={{ width: `${pct}%` }}
                                />
                                <span>{pct}%</span>
                              </div>
                            </td>
                            <td>
                              {u.last_activity
                                ? new Date(u.last_activity).toLocaleDateString("es-ES")
                                : "—"}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </Panel>
          </div>
        ) : (
          <div className="admin-loading">Cargando métricas…</div>
        )}
      </div>
    </div>
  );
}
