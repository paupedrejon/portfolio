"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Cookie } from "lucide-react";
import { Link } from "@/i18n/navigation";
import {
  ANALYTICS_CONSENT_EVENT,
  getAnalyticsConsent,
  setAnalyticsConsent,
  type AnalyticsConsentValue,
} from "@/lib/analytics/consent";
import "./analytics-consent.css";

export default function AnalyticsConsentBanner() {
  const t = useTranslations("consent");
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const sync = () => {
      setVisible(getAnalyticsConsent() === null);
    };
    sync();
    window.addEventListener(ANALYTICS_CONSENT_EVENT, sync);
    return () => window.removeEventListener(ANALYTICS_CONSENT_EVENT, sync);
  }, []);

  const respond = (value: AnalyticsConsentValue) => {
    setAnalyticsConsent(value);
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      className="consent-banner"
      role="dialog"
      aria-modal="false"
      aria-labelledby="consent-banner-desc"
    >
      <div className="consent-banner__inner">
        <Cookie className="consent-banner__icon" size={18} strokeWidth={1.75} aria-hidden />
        <p id="consent-banner-desc" className="consent-banner__text">
          {t("description")}
          <Link href="/privacy" className="consent-banner__link">
            {t("learnMore")}
          </Link>
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
            className="consent-banner__accept"
            onClick={() => respond("granted")}
          >
            {t("accept")}
          </button>
        </div>
      </div>
    </div>
  );
}
