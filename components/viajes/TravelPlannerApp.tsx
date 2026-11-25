"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { ArrowLeft, Download } from "lucide-react";
import PortfolioPageHero from "@/components/portfolio/PortfolioPageHero";
import HomeHeroBackground from "@/components/home/HomeHeroBackground";
import TripWizard from "@/components/viajes/TripWizard";
import GuidePreview from "@/components/viajes/GuidePreview";
import GuideChat, { type ChatMessage } from "@/components/viajes/GuideChat";
import type { TripPlanInput } from "@/lib/viajes/types";

const STORAGE_KEY = "viajes-guide-v5";

/**
 * Server already runs sanitizeGuideHtml. Client DOMPurify was stripping
 * CSS url() (hero poster) and could mangle embeds — keep a light pass only.
 */
function purify(html: string): string {
  return html
    .replace(/<script\b[\s\S]*?<\/script>/gi, "")
    .replace(/\son\w+\s*=\s*(['"]).*?\1/gi, "")
    .replace(/\son\w+\s*=\s*[^\s>]+/gi, "");
}

async function readApiJson(res: Response): Promise<Record<string, unknown>> {
  const text = await res.text();
  try {
    return JSON.parse(text) as Record<string, unknown>;
  } catch {
    const snippet = text.replace(/\s+/g, " ").trim().slice(0, 140);
    if (/an error occurred|function invocation|timeout|504|503/i.test(snippet)) {
      throw new Error(
        "El servidor tardó demasiado o falló. Espera ~1 min y reintenta.",
      );
    }
    throw new Error(
      snippet
        ? `Respuesta inválida del servidor: ${snippet}`
        : "Respuesta inválida del servidor.",
    );
  }
}

function defaultTrip(locale: string): TripPlanInput {
  const now = new Date();
  const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  return {
    origin: "",
    destination: "",
    destinations: [],
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
  const [cities, setCities] = useState<string[]>([]);
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
        cities?: string[];
        messages?: ChatMessage[];
      };
      if (parsed.html) {
        setHtml(purify(parsed.html));
        setShowWizard(false);
      }
      if (parsed.title) setTitle(parsed.title);
      if (parsed.cities) setCities(parsed.cities);
      if (parsed.trip) {
        setTrip({
          ...defaultTrip(locale),
          ...parsed.trip,
          locale,
          destinations: parsed.trip.destinations || [],
          travelers: parsed.trip.travelers || 2,
          transport: "flexible",
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
        JSON.stringify({ html, title, trip, cities, messages }),
      );
    } catch {
      /* ignore */
    }
  }, [html, title, trip, cities, messages]);

  const busy = loadingPlan || loadingEdit;
  const hasGuide = Boolean(html);
  const wizardVisible = !hasGuide || showWizard;
  const guideMode = hasGuide && !showWizard;

  useEffect(() => {
    const cls = "viajes-guide-open";
    if (guideMode) {
      document.body.classList.add(cls);
      document.body.style.overflow = "hidden";
    } else {
      document.body.classList.remove(cls);
      document.body.style.overflow = "";
    }
    return () => {
      document.body.classList.remove(cls);
      document.body.style.overflow = "";
    };
  }, [guideMode]);

  async function generate() {
    setError(null);
    setLoadingPlan(true);
    const isBusyMsg = (msg: string) =>
      /saturad|high demand|try again|reintenta|GENERATION_FAILED|unavailable/i.test(
        msg,
      );

    const requestOnce = async () => {
      const res = await fetch("/api/viajes/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(trip),
      });
      const data = await readApiJson(res);
      if (!res.ok) {
        const err = new Error(
          (typeof data.message === "string" && data.message) ||
            t("errors.generic"),
        ) as Error & { code?: string };
        err.code = typeof data.error === "string" ? data.error : undefined;
        throw err;
      }
      return data as {
        html: string;
        title?: string | null;
        cities?: string[];
        trip?: TripPlanInput;
      };
    };

    try {
      let data: Awaited<ReturnType<typeof requestOnce>>;
      try {
        data = await requestOnce();
      } catch (first) {
        const msg = first instanceof Error ? first.message : "";
        if (!isBusyMsg(msg)) throw first;
        // Gemini spikes are often ~30–60s — one automatic retry
        setError("Gemini está ocupado… reintentando en unos segundos.");
        await new Promise((r) => setTimeout(r, 8000));
        setError(null);
        data = await requestOnce();
      }
      const clean = purify(data.html);
      setHtml(clean);
      setTitle(data.title || null);
      if (Array.isArray(data.cities)) setCities(data.cities);
      if (data.trip) {
        setTrip({
          ...defaultTrip(locale),
          ...data.trip,
          locale,
          destinations: data.trip.destinations || [],
          transport: "flexible",
        });
      }
      setShowWizard(false);
      setMessages([]);
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
        body: JSON.stringify({
          instruction,
          trip,
          cities:
            cities.length > 0
              ? cities
              : [trip.destination, ...(trip.destinations || [])],
        }),
      });
      const data = await readApiJson(res);
      if (!res.ok) {
        throw new Error(
          (typeof data.message === "string" && data.message) ||
            t("errors.generic"),
        );
      }
      setHtml(purify(String(data.html || "")));
      if (typeof data.title === "string") setTitle(data.title);
      if (Array.isArray(data.cities)) {
        setCities(data.cities.filter((c): c is string => typeof c === "string"));
      }
      if (data.trip && typeof data.trip === "object") {
        const nextTrip = data.trip as Partial<TripPlanInput>;
        setTrip({
          ...defaultTrip(locale),
          ...nextTrip,
          locale,
          destinations: nextTrip.destinations || [],
          transport: "flexible",
        });
      }
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text:
            (typeof data.summary === "string" && data.summary.trim()) ||
            t("chat.updated"),
        },
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

  if (guideMode) {
    return (
      <div className="viajes-fs" id="viajes-app">
        <header className="viajes-fs__bar">
          <button
            type="button"
            className="viajes-iconbtn"
            onClick={() => setShowWizard(true)}
            aria-label={t("actions.newTrip")}
            title={t("actions.newTrip")}
          >
            <ArrowLeft size={18} aria-hidden />
          </button>
          <div className="viajes-fs__title">
            <strong>{title || t("previewTitlePlain")}</strong>
          </div>
          <button
            type="button"
            className="viajes-iconbtn viajes-iconbtn--primary"
            disabled={loadingEdit}
            onClick={downloadHtml}
            aria-label={t("actions.downloadHtml")}
            title={t("actions.downloadHtml")}
          >
            <Download size={18} aria-hidden />
          </button>
        </header>

        <div className="viajes-fs__stage">
          <GuidePreview
            html={html}
            title={title}
            loading={loadingEdit}
            onDownloadHtml={downloadHtml}
            fullscreen
            hideToolbar
          />
          <GuideChat
            dock
            disabled={!html}
            loading={loadingEdit}
            messages={messages}
            onSend={edit}
            onDownloadHtml={downloadHtml}
          />
        </div>

        {error && (
          <p className="viajes-fs__error" role="alert">
            {error}
          </p>
        )}
      </div>
    );
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
