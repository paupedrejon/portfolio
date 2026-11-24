"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Cookie } from "lucide-react";
import { Link } from "@/i18n/navigation";
import {
  ANALYTICS_CONSENT_EVENT,
  REQUEST_ANALYTICS_CONSENT_EVENT,
  getAnalyticsConsent,
  setAnalyticsConsent,
  type AnalyticsConsentValue,
} from "@/lib/analytics/consent";
import "./analytics-consent.css";

export default function AnalyticsConsentBanner() {
  const t = useTranslations("consent");
  const [visible, setVisible] = useState(false);
  const [attention, setAttention] = useState(false);
  const [likeHint, setLikeHint] = useState(false);
  const attentionTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const sync = () => {
      const consent = getAnalyticsConsent();
      if (consent === "granted") {
        setVisible(false);
        setAttention(false);
        setLikeHint(false);
        return;
      }
      // Solo auto-mostrar si aún no ha decidido
      setVisible(consent === null);
    };
    sync();
    window.addEventListener(ANALYTICS_CONSENT_EVENT, sync);
    return () => window.removeEventListener(ANALYTICS_CONSENT_EVENT, sync);
  }, []);

  useEffect(() => {
    const onRequest = (event: Event) => {
      const detail = (event as CustomEvent<{ reason?: string }>).detail;
      const forLike = detail?.reason === "like";
      setLikeHint(forLike);
      setVisible(true);
      setAttention(true);

      if (attentionTimer.current) clearTimeout(attentionTimer.current);
      attentionTimer.current = setTimeout(() => setAttention(false), 4500);
    };

    window.addEventListener(REQUEST_ANALYTICS_CONSENT_EVENT, onRequest);
    return () => {
      window.removeEventListener(REQUEST_ANALYTICS_CONSENT_EVENT, onRequest);
      if (attentionTimer.current) clearTimeout(attentionTimer.current);
    };
  }, []);

  const respond = (value: AnalyticsConsentValue) => {
    setAnalyticsConsent(value);
    setVisible(false);
    setAttention(false);
    setLikeHint(false);
  };

  if (!visible) return null;

  return (
    <div
      className={`consent-banner${attention ? " consent-banner--attention" : ""}`}
      role="dialog"
      aria-modal="false"
      aria-labelledby="consent-banner-desc"
    >
      <div className="consent-banner__inner">
        <Cookie className="consent-banner__icon" size={18} strokeWidth={1.75} aria-hidden />
        <p id="consent-banner-desc" className="consent-banner__text">
          {likeHint ? t("likeHint") : t("description")}
          {!likeHint ? (
            <Link href="/privacy" className="consent-banner__link">
              {t("learnMore")}
            </Link>
          ) : (
            <>
              {" "}
              <Link href="/privacy" className="consent-banner__link">
                {t("learnMore")}
              </Link>
            </>
          )}
        </p>
        <div className="consent-banner__actions">
          <button
            type="button"
            className="consent-banner__btn consent-banner__btn--text"
            onClick={() => respond("denied")}
          >
            {t("reject")}
          </button>
          <button
            type="button"
            className={`consent-banner__accept${attention ? " is-pulse" : ""}`}
            onClick={() => respond("granted")}
          >
            {t("accept")}
          </button>
        </div>
      </div>
    </div>
  );
}
