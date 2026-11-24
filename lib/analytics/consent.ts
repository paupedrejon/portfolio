export const CONSENT_STORAGE_KEY = "portfolio_analytics_consent";

export type AnalyticsConsentValue = "granted" | "denied";

export const ANALYTICS_CONSENT_EVENT = "portfolio-analytics-consent";

/** Pedir al banner que se muestre / destaque el botón Aceptar (p. ej. al dar me gusta). */
export const REQUEST_ANALYTICS_CONSENT_EVENT = "portfolio-request-analytics-consent";

export function getAnalyticsConsent(): AnalyticsConsentValue | null {
  if (typeof window === "undefined") return null;
  try {
    const value = localStorage.getItem(CONSENT_STORAGE_KEY);
    if (value === "granted" || value === "denied") return value;
  } catch {
    /* storage blocked */
  }
  return null;
}

export function hasAnalyticsConsent(): boolean {
  return getAnalyticsConsent() === "granted";
}

export function setAnalyticsConsent(value: AnalyticsConsentValue): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(CONSENT_STORAGE_KEY, value);
    if (value === "denied") {
      localStorage.removeItem("portfolio_sid");
    }
    window.dispatchEvent(
      new CustomEvent(ANALYTICS_CONSENT_EVENT, { detail: value }),
    );
  } catch {
    /* storage blocked */
  }
}

/** Abre / destaca el banner de cookies para que el me gusta pueda contarse. */
export function requestAnalyticsConsent(reason?: string): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent(REQUEST_ANALYTICS_CONSENT_EVENT, {
      detail: { reason: reason ?? "like" },
    }),
  );
}
