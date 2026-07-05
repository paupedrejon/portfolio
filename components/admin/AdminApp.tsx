"use client";

import { useCallback, useEffect, useState } from "react";
import type { AdminAnalyticsSummary } from "@/lib/analytics/store";

type TabId =
  | "overview"
  | "pages"
  | "projects"
  | "study"
  | "react"
  | "cv"
  | "extra";

const TABS: { id: TabId; label: string }[] = [
  { id: "overview", label: "Resumen" },
  { id: "pages", label: "Páginas" },
  { id: "projects", label: "Proyectos" },
  { id: "study", label: "Study Agents" },
  { id: "react", label: "Curso React" },
  { id: "cv", label: "CV" },
  { id: "extra", label: "Extra" },
];

const LOCALE_LABELS: Record<string, string> = {
  es: "Español",
  en: "English",
  it: "Italiano",
  unknown: "Sin locale",
};

function localeLabel(code: string) {
  return LOCALE_LABELS[code] ?? code.toUpperCase();
}

function BarList({
  items,
  emptyLabel = "Sin datos todavía",
}: {
  items: { key: string; count: number }[];
  emptyLabel?: string;
}) {
  if (items.length === 0) {
    return <p className="admin-empty">{emptyLabel}</p>;
  }
  const max = Math.max(...items.map((i) => i.count), 1);
  return (
    <div className="admin-bars">
      {items.slice(0, 12).map((item) => (
        <div key={item.key} className="admin-bar-row">
          <span className="admin-bar-row__label" title={item.key}>
            {item.key}
          </span>
          <div className="admin-bar-row__track">
            <div
              className="admin-bar-row__fill"
              style={{ width: `${(item.count / max) * 100}%` }}
            />
          </div>
          <span className="admin-bar-row__count">{item.count}</span>
        </div>
      ))}
    </div>
  );
}

function KpiCard({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="admin-kpi">
      <p className="admin-kpi__label">{label}</p>
      <p className="admin-kpi__value">{value}</p>
    </div>
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
  const [tab, setTab] = useState<TabId>("overview");

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
              Acceso privado para métricas de visitas, proyectos, Study Agents y
              curso de React.
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
                placeholder="pau.pedrejon@estudiantat.upc.edu"
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
            <p className="admin-hint">
              Configura en <code>.env.local</code>:{" "}
              <code>ADMIN_EMAIL</code> y <code>ADMIN_PASSWORD</code> (tu
              contraseña, no la subas a git). Ejecuta también{" "}
              <code>supabase/migrations/003_analytics.sql</code>.
            </p>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <div className="admin-page__inner">
        <header className="admin-header">
          <div>
            <h1 className="admin-header__title">Dashboard</h1>
            <p className="admin-header__meta">
              {email} · {loadingData ? "Actualizando…" : "Métricas del portfolio"}
            </p>
          </div>
          <div className="admin-header__actions">
            <button
              type="button"
              className="admin-btn"
              onClick={() => void loadAnalytics()}
            >
              Actualizar
            </button>
            <button type="button" className="admin-btn" onClick={() => void handleLogout()}>
              Salir
            </button>
          </div>
        </header>

        {!summary?.configured ? (
          <div className="admin-alert">
            Supabase no está configurado. Los eventos no se guardan hasta que definas{" "}
            <code>SUPABASE_URL</code> y <code>SUPABASE_SERVICE_ROLE_KEY</code>.
          </div>
        ) : null}

        {summary && !summary.tableReady ? (
          <div className="admin-alert">
            Falta la tabla <code>analytics_events</code>. Ejecuta{" "}
            <code>supabase/migrations/003_analytics.sql</code> en tu proyecto Supabase.
          </div>
        ) : null}

        <nav className="admin-tabs" aria-label="Secciones del admin">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              className={`admin-tab${tab === t.id ? " admin-tab--active" : ""}`}
              onClick={() => setTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </nav>

        {summary ? (
          <>
            {tab === "overview" ? (
              <>
                <div className="admin-kpi-grid">
                  <KpiCard label="Hoy" value={summary.visits.today} />
                  <KpiCard label="Este mes" value={summary.visits.month} />
                  <KpiCard label="Este año" value={summary.visits.year} />
                  <KpiCard label="Eventos totales" value={summary.totalEvents} />
                  <KpiCard
                    label="Páginas / sesión"
                    value={summary.avgPagesPerSession}
                  />
                  <KpiCard label="Descargas CV" value={summary.cvDownloadsTotal} />
                </div>
                <section className="admin-panel">
                  <h2 className="admin-panel__title">Visitas — últimos 30 días</h2>
                  <BarList
                    items={summary.visitsByDay.map((d) => ({
                      key: d.date.slice(5),
                      count: d.count,
                    }))}
                  />
                </section>
                <section className="admin-panel">
                  <h2 className="admin-panel__title">Idioma de visita</h2>
                  <BarList
                    items={summary.locales.map((l) => ({
                      key: localeLabel(l.key),
                      count: l.count,
                    }))}
                  />
                </section>
              </>
            ) : null}

            {tab === "pages" ? (
              <>
                <section className="admin-panel">
                  <h2 className="admin-panel__title">Visitas por página</h2>
                  <BarList items={summary.visitsByPage} />
                </section>
                <section className="admin-panel">
                  <h2 className="admin-panel__title">Página × idioma</h2>
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
                          {summary.visitsByPageLocale.slice(0, 40).map((row) => (
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
                </section>
              </>
            ) : null}

            {tab === "projects" ? (
              <>
                <section className="admin-panel">
                  <h2 className="admin-panel__title">Vista de proyectos (list / timeline / …)</h2>
                  <BarList items={summary.projectsViewModes} />
                </section>
                <section className="admin-panel">
                  <h2 className="admin-panel__title">Filtros por área</h2>
                  <BarList items={summary.projectFilters} />
                </section>
                <section className="admin-panel">
                  <h2 className="admin-panel__title">Visitas por proyecto</h2>
                  <BarList items={summary.projectViews} />
                </section>
              </>
            ) : null}

            {tab === "study" ? (
              <>
                <div className="admin-kpi-grid">
                  <KpiCard label="Vistas Study Agents" value={summary.studyAgentsTotal} />
                  {summary.studyAgentsBackend ? (
                    <>
                      <KpiCard
                        label="Usuarios activos (backend)"
                        value={summary.studyAgentsBackend.active_users}
                      />
                      <KpiCard
                        label="Inscripciones"
                        value={summary.studyAgentsBackend.total_enrollments}
                      />
                      <KpiCard
                        label="Ingresos wallet (€)"
                        value={summary.studyAgentsBackend.total_revenue.toFixed(2)}
                      />
                    </>
                  ) : null}
                </div>
                <section className="admin-panel">
                  <h2 className="admin-panel__title">Rutas Study Agents</h2>
                  <BarList items={summary.studyAgentsViews} />
                </section>
                {!summary.studyAgentsBackend ? (
                  <p className="admin-empty">
                    Backend FastAPI no disponible — solo se muestran page views registradas
                    en el portfolio.
                  </p>
                ) : null}
              </>
            ) : null}

            {tab === "react" ? (
              <section className="admin-panel">
                <h2 className="admin-panel__title">Alumnos — nivel y progreso</h2>
                {summary.reactCourseUsers.length === 0 ? (
                  <p className="admin-empty">Sin alumnos registrados todavía</p>
                ) : (
                  <div className="admin-table-wrap">
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>Alumno</th>
                          <th>Nivel actual</th>
                          <th>Niveles superados</th>
                          <th>Última actividad</th>
                        </tr>
                      </thead>
                      <tbody>
                        {summary.reactCourseUsers.map((u) => (
                          <tr key={u.user_id}>
                            <td>{u.display_name ?? u.user_id.slice(0, 12)}</td>
                            <td>
                              {u.current_level > 30
                                ? "Completado"
                                : `Nivel ${u.current_level}`}
                            </td>
                            <td>{u.passed_levels} / 30</td>
                            <td>
                              {u.last_activity
                                ? new Date(u.last_activity).toLocaleDateString("es-ES")
                                : "—"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            ) : null}

            {tab === "cv" ? (
              <section className="admin-panel">
                <h2 className="admin-panel__title">Descargas de CV por página</h2>
                <BarList items={summary.cvDownloads} />
              </section>
            ) : null}

            {tab === "extra" ? (
              <>
                <section className="admin-panel">
                  <h2 className="admin-panel__title">Origen (referrer)</h2>
                  <BarList items={summary.referrers} />
                </section>
              </>
            ) : null}
          </>
        ) : (
          <div className="admin-loading">Cargando métricas…</div>
        )}
      </div>
    </div>
  );
}
