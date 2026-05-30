"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

export default function CursosLanding() {
  const t = useTranslations("cursos");

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)]">
      <section className="hero-section proyectos-hero">
        <div className="hero-grid" aria-hidden />
        <div className="relative z-10 max-w-4xl mx-auto px-6 py-24 text-center">
          <p className="hero-subtitle text-[var(--text-muted)] mb-4">
            {t("catalogTitle")}
          </p>
          <h1 className="hero-title gradient-text mb-6">{t("catalogTitle")}</h1>
          <p className="hero-tagline mx-auto mb-12">{t("catalogSubtitle")}</p>

          <Link
            href="/cursos/react"
            className="block max-w-lg mx-auto text-left p-8 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] backdrop-blur hover:border-[var(--border-accent)] transition-all hover:-translate-y-1"
          >
            <span className="text-xs uppercase tracking-widest text-indigo-400 font-semibold">
              Gratis · 30 niveles
            </span>
            <h2 className="text-2xl font-bold mt-2 mb-2">{t("reactCardTitle")}</h2>
            <p className="text-[var(--text-secondary)] text-sm mb-6">
              {t("reactCardDescription")}
            </p>
            <span className="btn-primary inline-block text-sm">{t("reactCta")}</span>
          </Link>
        </div>
      </section>
    </div>
  );
}
