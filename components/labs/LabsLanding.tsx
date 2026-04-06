"use client";

import { useEffect, useState } from "react";
import { Link } from "@/i18n/navigation";
import LabsHeroScene from "./LabsHeroScene";
import { useTranslations } from "next-intl";
import { leagueSpartan } from "@/app/fonts";
import ScrollButton from "@/components/ScrollButton";

export default function LabsLanding() {
  const t = useTranslations("labs");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#05050b] text-white">
      <LabsHeroScene />

      <section
        className="hero-section w-full max-w-[100vw] overflow-x-hidden"
        style={{ position: "relative", overflow: "hidden", background: "transparent" }}
      >
        <div
          className={`relative z-10 flex w-full min-w-0 flex-col items-center text-center px-4 sm:px-6 ${
            mounted ? "opacity-100" : "opacity-0"
          }`}
          style={{ transition: "opacity 0.8s ease-out" }}
        >
          <div
            className={`${mounted ? "animate-fade-in-up" : ""}`}
            style={{
              fontFamily: "var(--font-mono)",
              animationDelay: "0.1s",
              animationFillMode: "both",
              marginBottom: "1.5rem",
            }}
          >
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.5rem",
                padding: "0.5rem 1.25rem",
                fontSize: "0.75rem",
                fontWeight: 500,
                letterSpacing: "0.15em",
                textTransform: "uppercase",
                color: "rgba(99, 102, 241, 0.9)",
                background:
                  "linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%)",
                border: "1px solid rgba(99, 102, 241, 0.2)",
                borderRadius: "50px",
                backdropFilter: "blur(10px)",
                boxShadow:
                  "0 4px 20px rgba(99, 102, 241, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.1)",
              }}
            >
              {t("badge")}
            </div>
          </div>

          <h1
            className={`${leagueSpartan.className} hero-title text-balance ${mounted ? "animate-fade-in-up" : ""}`}
            style={{ animationDelay: "0.2s", animationFillMode: "both" }}
          >
            <span className="gradient-text">{t("title")}</span>
          </h1>

          <p
            className={`hero-tagline max-w-3xl text-balance ${mounted ? "animate-fade-in-up" : ""}`}
            style={{
              fontFamily: "var(--font-body)",
              color: "rgba(226, 232, 240, 0.9)",
              animationDelay: "0.3s",
              animationFillMode: "both",
            }}
          >
            {t("subtitle")}
          </p>

          <div
            className={`mt-8 flex flex-wrap items-center justify-center gap-3 ${mounted ? "animate-fade-in-up" : ""}`}
            style={{ animationDelay: "0.4s", animationFillMode: "both" }}
          >
            <Link
              href="/labs/minecraft"
              className="btn-primary inline-flex items-center justify-center px-6 py-3"
            >
              {t("openMinecraft")}
            </Link>
            <span className="inline-flex items-center rounded-full border border-white/20 bg-white/5 px-4 py-2 text-xs text-slate-200">
              {t("iterationTag")}
            </span>
          </div>

          <div
            className={`scroll-wrap ${mounted ? "animate-fade-in" : ""}`}
            style={{ animationDelay: "0.6s", animationFillMode: "both", marginTop: "2.5rem" }}
          >
            <ScrollButton targetId="labs-content" color="transparent" iconColor="rgba(255,255,255,0.9)" />
          </div>
        </div>
      </section>

      <section id="labs-content" className="relative z-10 px-4 pb-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <article className="rounded-2xl border border-white/10 bg-[#0f0f19]/80 p-5 shadow-xl backdrop-blur-md">
              <p className="font-mono text-xs uppercase tracking-[0.18em] text-indigo-200">{t("cards.world.title")}</p>
              <p className="mt-3 text-sm leading-relaxed text-slate-300">{t("cards.world.body")}</p>
            </article>
            <article className="rounded-2xl border border-white/10 bg-[#0f0f19]/80 p-5 shadow-xl backdrop-blur-md">
              <p className="font-mono text-xs uppercase tracking-[0.18em] text-indigo-200">{t("cards.movement.title")}</p>
              <p className="mt-3 text-sm leading-relaxed text-slate-300">{t("cards.movement.body")}</p>
            </article>
            <article className="rounded-2xl border border-white/10 bg-[#0f0f19]/80 p-5 shadow-xl backdrop-blur-md sm:col-span-2 lg:col-span-1">
              <p className="font-mono text-xs uppercase tracking-[0.18em] text-indigo-200">{t("cards.graphics.title")}</p>
              <p className="mt-3 text-sm leading-relaxed text-slate-300">{t("cards.graphics.body")}</p>
            </article>
          </div>

          <div className="mt-8 rounded-3xl border border-white/10 bg-black/40 p-7 shadow-2xl backdrop-blur-xl sm:p-10">
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-indigo-200">{t("scrollBlock.kicker")}</p>
            <h2 className="mt-3 text-balance text-2xl font-bold text-white sm:text-3xl">{t("scrollBlock.title")}</h2>
            <p className="mt-4 max-w-3xl text-pretty leading-relaxed text-slate-300">{t("scrollBlock.body")}</p>
            <div className="mt-8 flex">
              <Link
                href="/labs/minecraft"
                className="inline-flex items-center rounded-lg border border-indigo-300/40 bg-indigo-500/20 px-4 py-2 text-sm font-semibold text-indigo-100 transition hover:bg-indigo-500/35"
              >
                {t("scrollBlock.cta")}
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
