"use client";

import { useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import TripWizard from "@/components/viajes/TripWizard";
import GuidePreview from "@/components/viajes/GuidePreview";
import GuideChat, { type ChatMessage } from "@/components/viajes/GuideChat";
import type { TripPlanInput } from "@/lib/viajes/types";

const STORAGE_KEY = "viajes-guide-v1";

function purify(html: string): string {
  if (typeof window === "undefined") return html;
  // Dynamic require avoids SSR "window is not defined" from dompurify.
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
  return {
    origin: "",
    destination: "",
    dateMode: "range",
    startDate: "",
    endDate: "",
    days: 5,
    luxury: 3,
    interests: ["food", "culture"],
    interestsNote: "",
    transport: "flexible",
    locale,
  };
}

export default function TravelPlannerApp() {
  const t = useTranslations("viajes");
  const locale = useLocale();
  const [trip, setTrip] = useState<TripPlanInput>(() => defaultTrip(locale));
  const [html, setHtml] = useState<string | null>(null);
  const [title, setTitle] = useState<string | null>(null);
  const [loadingPlan, setLoadingPlan] = useState(false);
  const [loadingEdit, setLoadingEdit] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);

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
      if (parsed.html) setHtml(purify(parsed.html));
      if (parsed.title) setTitle(parsed.title);
      if (parsed.trip) setTrip({ ...parsed.trip, locale });
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
      /* ignore quota */
    }
  }, [html, title, trip, messages]);

  const busy = loadingPlan || loadingEdit;

  const statusText = useMemo(() => {
    if (loadingPlan) return t("status.generating");
    if (loadingEdit) return t("status.editing");
    return null;
  }, [loadingPlan, loadingEdit, t]);

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
      setMessages([
        {
          role: "assistant",
          text: t("chat.ready"),
        },
      ]);
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
    const w = window.open("", "_blank", "noopener,noreferrer,width=1024,height=768");
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
    <div className="viajes-main">
      <p className="viajes-disclaimer">{t("disclaimer")}</p>

      <div className="viajes-grid viajes-grid--split">
        <div className="viajes-grid">
          <TripWizard
            value={trip}
            onChange={setTrip}
            onSubmit={generate}
            loading={busy}
          />
          <GuideChat
            disabled={!html}
            loading={loadingEdit}
            messages={messages}
            onSend={edit}
          />
        </div>
        <GuidePreview
          html={html}
          title={title}
          loading={loadingPlan}
          onPrint={printGuide}
          onDownloadHtml={downloadHtml}
        />
      </div>

      {statusText && <p className="viajes-status">{statusText}</p>}
      {error && (
        <p className="viajes-status viajes-status--error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
