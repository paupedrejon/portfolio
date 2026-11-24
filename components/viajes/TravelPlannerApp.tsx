"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import PortfolioPageHero from "@/components/portfolio/PortfolioPageHero";
import HomeHeroBackground from "@/components/home/HomeHeroBackground";
import TripWizard from "@/components/viajes/TripWizard";
import GuidePreview from "@/components/viajes/GuidePreview";
import GuideChat, { type ChatMessage } from "@/components/viajes/GuideChat";
import type { TripPlanInput } from "@/lib/viajes/types";

const STORAGE_KEY = "viajes-guide-v3";

function purify(html: string): string {
  if (typeof window === "undefined") return html;
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const mod = require("dompurify") as {
    default?: { sanitize: (s: string, cfg?: object) => string };
    sanitize?: (s: string, cfg?: object) => string;
  };
  const sanitize = mod.default?.sanitize ?? mod.sanitize;
  if (!sanitize) return html;
  return sanitize(html, {
    WHOLE_DOCUMENT: true,
    ADD_TAGS: ["link", "style"],
    ADD_ATTR: ["target", "rel", "href", "media", "type", "charset"],
  });
}

function defaultTrip(locale: string): TripPlanInput {
  const now = new Date();
  const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  return {
    origin: "",
    destination: "",
    dateMode: "exact",
    startDate: "",
    endDate: "",
    flexibleMonth: month,
    daysMin: 4,
    daysMax: 7,
    luxury: 3,
    travelers: 2,
    interests: ["food", "culture"],
    interestsNote: "",
    transport: "flexible",
    locale,
  };
}

export default function TravelPlannerApp() {
  const t = useTranslations("viajes");
  const locale = useLocale();
  const [mounted, setMounted] = useState(false);
  const [trip, setTrip] = useState<TripPlanInput>(() => defaultTrip(locale));
  const [html, setHtml] = useState<string | null>(null);
  const [title, setTitle] = useState<string | null>(null);
  const [loadingPlan, setLoadingPlan] = useState(false);
  const [loadingEdit, setLoadingEdit] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [showWizard, setShowWizard] = useState(true);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setTrip((prev) => ({ ...prev, locale }));
  }, [locale]);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as {
        html?: string;
        title?: string;
        trip?: TripPlanInput;
        messages?: ChatMessage[];
      };
      if (parsed.html) {
        setHtml(purify(parsed.html));
        setShowWizard(false);
      }
      if (parsed.title) setTitle(parsed.title);
      if (parsed.trip) {
        setTrip({
          ...defaultTrip(locale),
          ...parsed.trip,
          locale,
          travelers: parsed.trip.travelers || 2,
          dateMode:
            parsed.trip.dateMode === "flexible" ? "flexible" : "exact",
        });
      }
      if (parsed.messages) setMessages(parsed.messages);
    } catch {
      /* ignore */
    }
  }, [locale]);

  useEffect(() => {
    if (!html) return;
    try {
      sessionStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ html, title, trip, messages }),
      );
    } catch {
      /* ignore */
    }
  }, [html, title, trip, messages]);

  const busy = loadingPlan || loadingEdit;
  const hasGuide = Boolean(html);
  const wizardVisible = !hasGuide || showWizard;

  async function generate() {
    setError(null);
    setLoadingPlan(true);
    try {
      const res = await fetch("/api/viajes/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(trip),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || t("errors.generic"));
      }
      const clean = purify(data.html as string);
      setHtml(clean);
      setTitle(data.title || null);
      setShowWizard(false);
      setMessages([{ role: "assistant", text: t("chat.ready") }]);
      requestAnimationFrame(() => {
        document.getElementById("viajes-app")?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : t("errors.generic"));
    } finally {
      setLoadingPlan(false);
    }
  }

  async function edit(instruction: string) {
    if (!html) return;
    setError(null);
    setMessages((prev) => [...prev, { role: "user", text: instruction }]);
    setLoadingEdit(true);
    try {
      const res = await fetch("/api/viajes/edit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ html, instruction, trip }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || t("errors.generic"));
      }
      setHtml(purify(data.html as string));
      if (data.title) setTitle(data.title);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", text: t("chat.updated") },
      ]);
    } catch (err) {
      const msg = err instanceof Error ? err.message : t("errors.generic");
      setError(msg);
      setMessages((prev) => [...prev, { role: "assistant", text: msg }]);
    } finally {
      setLoadingEdit(false);
    }
  }

  function downloadHtml() {
    if (!html) return;
    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${(title || "guia-viaje").replace(/[^\w\-]+/g, "_").slice(0, 60)}.html`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function printGuide() {
    if (!html) return;
    const w = window.open(
      "",
      "_blank",
      "noopener,noreferrer,width=1024,height=768",
    );
    if (!w) {
      setError(t("errors.popup"));
      return;
    }
    w.document.open();
    w.document.write(html);
    w.document.close();
    const trigger = () => {
      try {
        w.focus();
        w.print();
      } catch {
        /* ignore */
      }
    };
    if (w.document.readyState === "complete") {
      setTimeout(trigger, 250);
    } else {
      w.addEventListener("load", () => setTimeout(trigger, 250));
    }
  }

  return (
    <>
      {wizardVisible && (
        <PortfolioPageHero
          kicker={t("hero.kicker")}
          title={t("hero.title")}
          tagline={t("hero.tagline")}
          scrollTargetId="viajes-app"
          mounted={mounted}
          background={<HomeHeroBackground />}
          ariaLabel={t("hero.aria")}
          showCv={false}
          showContact={false}
          hideScroll
          className="viajes-hero"
          afterTagline={
            <TripWizard
              value={trip}
              onChange={setTrip}
              onSubmit={generate}
              loading={busy}
              variant="hero"
            />
          }
        />
      )}

      <div id="viajes-app" className="viajes-main">
        {loadingPlan && (
          <div className="viajes-generating-card">
            <strong>{t("actions.generating")}</strong>
            <span>{t("generatingHint")}</span>
          </div>
        )}

        {hasGuide && !showWizard && (
          <div className="viajes-workspace">
            <div className="viajes-workspace__guide">
              <div className="viajes-workspace__bar">
                <button
                  type="button"
                  className="viajes-btn viajes-btn--ghost"
                  onClick={() => {
                    setShowWizard(true);
                    requestAnimationFrame(() => {
                      document.getElementById("hero-section")?.scrollIntoView({
                        behavior: "smooth",
                        block: "start",
                      });
                    });
                  }}
                >
                  {t("actions.newTrip")}
                </button>
              </div>
              <GuidePreview
                html={html}
                title={title}
                loading={loadingEdit}
                onPrint={printGuide}
                onDownloadHtml={downloadHtml}
              />
            </div>
            <GuideChat
              disabled={!html}
              loading={loadingEdit}
              messages={messages}
              onSend={edit}
            />
          </div>
        )}

        {!hasGuide && !loadingPlan && (
          <p className="viajes-disclaimer">{t("disclaimer")}</p>
        )}

        {error && (
          <p className="viajes-status viajes-status--error" role="alert">
            {error}
          </p>
        )}
      </div>
    </>
  );
}
