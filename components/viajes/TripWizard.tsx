"use client";

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
};

export default function TripWizard({
  value,
  onChange,
  onSubmit,
  loading,
}: TripWizardProps) {
  const t = useTranslations("viajes");

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

  return (
    <section className="viajes-panel" aria-labelledby="viajes-wizard-title">
      <h2 id="viajes-wizard-title" className="viajes-panel__title">
        {t.rich("wizardTitle", {
          em: (chunks) => <em>{chunks}</em>,
        })}
      </h2>
      <p className="viajes-panel__hint">{t("wizardHint")}</p>

      <form
        className="viajes-form"
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit();
        }}
      >
        <div className="viajes-row viajes-row--2">
          <div className="viajes-field">
            <label htmlFor="viajes-origin">{t("fields.origin")}</label>
            <input
              id="viajes-origin"
              value={value.origin}
              onChange={(e) => set("origin", e.target.value)}
              placeholder={t("placeholders.origin")}
              required
              autoComplete="address-level2"
            />
          </div>
          <div className="viajes-field">
            <label htmlFor="viajes-destination">{t("fields.destination")}</label>
            <input
              id="viajes-destination"
              value={value.destination}
              onChange={(e) => set("destination", e.target.value)}
              placeholder={t("placeholders.destination")}
              required
              autoComplete="address-level2"
            />
          </div>
        </div>

        <div className="viajes-field">
          <label>{t("fields.dateMode")}</label>
          <div className="viajes-seg" role="group">
            {(
              [
                ["range", t("dateModes.range")],
                ["days", t("dateModes.days")],
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
        </div>

        {value.dateMode === "range" && (
          <div className="viajes-row viajes-row--2">
            <div className="viajes-field">
              <label htmlFor="viajes-start">{t("fields.startDate")}</label>
              <input
                id="viajes-start"
                type="date"
                value={value.startDate || ""}
                onChange={(e) => set("startDate", e.target.value)}
              />
            </div>
            <div className="viajes-field">
              <label htmlFor="viajes-end">{t("fields.endDate")}</label>
              <input
                id="viajes-end"
                type="date"
                value={value.endDate || ""}
                onChange={(e) => set("endDate", e.target.value)}
              />
            </div>
          </div>
        )}

        {value.dateMode === "days" && (
          <div className="viajes-field">
            <label htmlFor="viajes-days">{t("fields.days")}</label>
            <input
              id="viajes-days"
              type="number"
              min={1}
              max={21}
              value={value.days ?? 5}
              onChange={(e) => set("days", Number(e.target.value))}
            />
          </div>
        )}

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

        <div className="viajes-field">
          <label htmlFor="viajes-note">{t("fields.interestsNote")}</label>
          <textarea
            id="viajes-note"
            rows={3}
            value={value.interestsNote || ""}
            onChange={(e) => set("interestsNote", e.target.value)}
            placeholder={t("placeholders.interestsNote")}
          />
        </div>

        <div className="viajes-actions">
          <button
            type="submit"
            className="viajes-btn viajes-btn--primary"
            disabled={loading}
          >
            {loading ? t("actions.generating") : t("actions.generate")}
          </button>
        </div>
      </form>
    </section>
  );
}
