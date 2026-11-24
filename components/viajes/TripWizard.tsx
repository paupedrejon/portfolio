"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import {
  INTEREST_PRESETS,
  type DateMode,
  type TransportPref,
  type TripPlanInput,
} from "@/lib/viajes/types";

export type TripWizardProps = {
  value: TripPlanInput;
  onChange: (next: TripPlanInput) => void;
  onSubmit: () => void;
  loading: boolean;
  /** Compact Skyscanner bar for embedding in the portfolio hero. */
  variant?: "hero" | "panel";
};

function monthInputValue(v?: string): string {
  if (!v) {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  }
  return v.slice(0, 7);
}

export default function TripWizard({
  value,
  onChange,
  onSubmit,
  loading,
  variant = "hero",
}: TripWizardProps) {
  const t = useTranslations("viajes");
  const [step, setStep] = useState<1 | 2>(1);

  const set = <K extends keyof TripPlanInput>(key: K, v: TripPlanInput[K]) => {
    onChange({ ...value, [key]: v });
  };

  const toggleInterest = (id: string) => {
    const has = value.interests.includes(id);
    set(
      "interests",
      has
        ? value.interests.filter((x) => x !== id)
        : [...value.interests, id].slice(0, 8),
    );
  };

  const step1Valid = useMemo(() => {
    if (value.origin.trim().length < 2 || value.destination.trim().length < 2) {
      return false;
    }
    if (value.dateMode === "exact") {
      return Boolean(value.startDate && value.endDate);
    }
    return Boolean(value.flexibleMonth && (value.daysMin ?? 0) >= 1);
  }, [value]);

  return (
    <section
      className={`viajes-search viajes-search--${variant}`}
      aria-labelledby="viajes-wizard-title"
    >
      <div className="viajes-steps" aria-label={t("steps.label")}>
        <button
          type="button"
          className={`viajes-steps__item${step === 1 ? " is-active" : ""}`}
          onClick={() => setStep(1)}
        >
          <span className="viajes-steps__num">1</span>
          {t("steps.route")}
        </button>
        <span className="viajes-steps__sep" aria-hidden />
        <button
          type="button"
          className={`viajes-steps__item${step === 2 ? " is-active" : ""}`}
          onClick={() => step1Valid && setStep(2)}
          disabled={!step1Valid}
        >
          <span className="viajes-steps__num">2</span>
          {t("steps.style")}
        </button>
      </div>

      {variant === "panel" && (
        <h2 id="viajes-wizard-title" className="viajes-search__title">
          {step === 1
            ? t.rich("wizardTitle", { em: (c) => <em>{c}</em> })
            : t.rich("wizardTitle2", { em: (c) => <em>{c}</em> })}
        </h2>
      )}
      {variant === "hero" && (
        <p id="viajes-wizard-title" className="viajes-search__eyebrow">
          {step === 1 ? t("heroSearch.route") : t("heroSearch.style")}
        </p>
      )}

      {step === 1 && (
        <form
          className="viajes-search__form"
          onSubmit={(e) => {
            e.preventDefault();
            if (!step1Valid) return;
            setStep(2);
          }}
        >
          <div className="viajes-bar">
            <label className="viajes-bar__cell">
              <span>{t("fields.origin")}</span>
              <input
                value={value.origin}
                onChange={(e) => set("origin", e.target.value)}
                placeholder={t("placeholders.origin")}
                required
                autoComplete="address-level2"
              />
            </label>
            <button
              type="button"
              className="viajes-search__swap"
              aria-label={t("actions.swap")}
              onClick={() =>
                onChange({
                  ...value,
                  origin: value.destination,
                  destination: value.origin,
                })
              }
            >
              ⇄
            </button>
            <label className="viajes-bar__cell">
              <span>{t("fields.destination")}</span>
              <input
                value={value.destination}
                onChange={(e) => set("destination", e.target.value)}
                placeholder={t("placeholders.destination")}
                required
                autoComplete="address-level2"
              />
            </label>
            <label className="viajes-bar__cell viajes-bar__cell--narrow">
              <span>{t("fields.travelers")}</span>
              <input
                type="number"
                min={1}
                max={12}
                value={value.travelers}
                onChange={(e) => set("travelers", Number(e.target.value))}
              />
            </label>
          </div>

          <div className="viajes-seg viajes-seg--dates" role="group">
            {(
              [
                ["exact", t("dateModes.exact")],
                ["flexible", t("dateModes.flexible")],
              ] as [DateMode, string][]
            ).map(([mode, label]) => (
              <button
                key={mode}
                type="button"
                aria-pressed={value.dateMode === mode}
                onClick={() => set("dateMode", mode)}
              >
                {label}
              </button>
            ))}
          </div>

          {value.dateMode === "exact" ? (
            <div className="viajes-bar viajes-bar--dates">
              <label className="viajes-bar__cell">
                <span>{t("fields.startDate")}</span>
                <input
                  type="date"
                  value={value.startDate || ""}
                  onChange={(e) => set("startDate", e.target.value)}
                  required
                />
              </label>
              <label className="viajes-bar__cell">
                <span>{t("fields.endDate")}</span>
                <input
                  type="date"
                  value={value.endDate || ""}
                  onChange={(e) => set("endDate", e.target.value)}
                  required
                />
              </label>
            </div>
          ) : (
            <div className="viajes-bar viajes-bar--flex">
              <label className="viajes-bar__cell">
                <span>{t("fields.flexibleMonth")}</span>
                <input
                  type="month"
                  value={monthInputValue(value.flexibleMonth)}
                  onChange={(e) => set("flexibleMonth", e.target.value)}
                  required
                />
              </label>
              <label className="viajes-bar__cell viajes-bar__cell--narrow">
                <span>{t("fields.daysMin")}</span>
                <input
                  type="number"
                  min={1}
                  max={30}
                  value={value.daysMin ?? 4}
                  onChange={(e) => {
                    const min = Number(e.target.value);
                    onChange({
                      ...value,
                      daysMin: min,
                      daysMax: Math.max(min, value.daysMax ?? min),
                    });
                  }}
                />
              </label>
              <label className="viajes-bar__cell viajes-bar__cell--narrow">
                <span>{t("fields.daysMax")}</span>
                <input
                  type="number"
                  min={value.daysMin ?? 1}
                  max={30}
                  value={value.daysMax ?? 7}
                  onChange={(e) => set("daysMax", Number(e.target.value))}
                />
              </label>
            </div>
          )}

          <div className="viajes-search__actions">
            <button
              type="submit"
              className="viajes-btn viajes-btn--primary viajes-btn--wide"
              disabled={!step1Valid}
            >
              {t("actions.next")}
            </button>
          </div>
        </form>
      )}

      {step === 2 && (
        <form
          className="viajes-search__form"
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit();
          }}
        >
          <div className="viajes-summary">
            <strong>
              {value.origin} → {value.destination}
            </strong>
            <span>
              {value.dateMode === "exact"
                ? `${value.startDate} · ${value.endDate}`
                : `${value.flexibleMonth} · ${value.daysMin}–${value.daysMax} ${t("fields.daysUnit")}`}
            </span>
            <span>
              {value.travelers}{" "}
              {value.travelers === 1
                ? t("fields.travelerOne")
                : t("fields.travelerMany")}
            </span>
            <button type="button" className="viajes-link" onClick={() => setStep(1)}>
              {t("actions.editRoute")}
            </button>
          </div>

          <div className="viajes-field viajes-luxury">
            <label htmlFor="viajes-luxury">{t("fields.luxury")}</label>
            <input
              id="viajes-luxury"
              type="range"
              min={1}
              max={5}
              step={1}
              value={value.luxury}
              onChange={(e) => set("luxury", Number(e.target.value))}
            />
            <div className="viajes-luxury__meta">
              <span>
                {value.luxury}/5 — {t(`luxury.${value.luxury}`)}
              </span>
            </div>
          </div>

          <div className="viajes-field">
            <label>{t("fields.transport")}</label>
            <div className="viajes-seg" role="group">
              {(
                [
                  ["flight", t("transport.flight")],
                  ["bus", t("transport.bus")],
                  ["flexible", t("transport.flexible")],
                ] as [TransportPref, string][]
              ).map(([mode, label]) => (
                <button
                  key={mode}
                  type="button"
                  aria-pressed={value.transport === mode}
                  onClick={() => set("transport", mode)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="viajes-field">
            <label>{t("fields.interests")}</label>
            <div className="viajes-chips">
              {INTEREST_PRESETS.map((id) => (
                <button
                  key={id}
                  type="button"
                  className="viajes-chip"
                  aria-pressed={value.interests.includes(id)}
                  onClick={() => toggleInterest(id)}
                >
                  {t(`interests.${id}`)}
                </button>
              ))}
            </div>
          </div>

          <label className="viajes-field">
            <span>{t("fields.interestsNote")}</span>
            <textarea
              rows={2}
              value={value.interestsNote || ""}
              onChange={(e) => set("interestsNote", e.target.value)}
              placeholder={t("placeholders.interestsNote")}
            />
          </label>

          <div className="viajes-search__actions">
            <button
              type="button"
              className="viajes-btn viajes-btn--ghost"
              onClick={() => setStep(1)}
              disabled={loading}
            >
              {t("actions.back")}
            </button>
            <button
              type="submit"
              className="viajes-btn viajes-btn--primary viajes-btn--wide"
              disabled={loading}
            >
              {loading ? t("actions.generating") : t("actions.generate")}
            </button>
          </div>
        </form>
      )}
    </section>
  );
}
