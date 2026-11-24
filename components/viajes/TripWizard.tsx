"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import {
  ArrowLeftRight,
  Backpack,
  Building2,
  Camera,
  CircleDollarSign,
  Compass,
  Crown,
  Hotel,
  Landmark,
  Leaf,
  Moon,
  Mountain,
  Plus,
  Search,
  ShoppingBag,
  Sparkles,
  TreePine,
  Utensils,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";
import CityAutocomplete from "@/components/viajes/CityAutocomplete";
import {
  INTEREST_PRESETS,
  type DateMode,
  type InterestPreset,
  type TripPlanInput,
} from "@/lib/viajes/types";

export type TripWizardProps = {
  value: TripPlanInput;
  onChange: (next: TripPlanInput) => void;
  onSubmit: () => void;
  loading: boolean;
  variant?: "hero" | "panel";
};

const INTEREST_ICONS: Record<InterestPreset, LucideIcon> = {
  food: Utensils,
  culture: Landmark,
  nature: TreePine,
  nightlife: Moon,
  shopping: ShoppingBag,
  museums: Camera,
  adventure: Mountain,
  relaxation: Leaf,
};

const LUXURY_ICONS: Record<number, LucideIcon> = {
  1: Backpack,
  2: CircleDollarSign,
  3: Hotel,
  4: Building2,
  5: Crown,
};

const MONTHS_SHORT = [
  "ene",
  "feb",
  "mar",
  "abr",
  "may",
  "jun",
  "jul",
  "ago",
  "sep",
  "oct",
  "nov",
  "dic",
];

function parseMonth(v?: string): { year: number; month: number } {
  const now = new Date();
  if (!v || !/^\d{4}-\d{2}$/.test(v)) {
    return { year: now.getFullYear(), month: now.getMonth() + 1 };
  }
  const [y, m] = v.split("-").map(Number);
  return { year: y, month: m };
}

/** Short label so it never clips in the bar: "nov 2026" */
function formatMonthShort(v?: string): string {
  const { year, month } = parseMonth(v);
  return `${MONTHS_SHORT[month - 1]} ${year}`;
}

function NumSelect({
  label,
  value,
  min,
  max,
  onChange,
  suffix,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (n: number) => void;
  suffix?: string;
}) {
  const opts = [];
  for (let i = min; i <= max; i++) opts.push(i);
  return (
    <label className="viajes-numsel">
      <span className="viajes-sky-label">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      >
        {opts.map((n) => (
          <option key={n} value={n}>
            {suffix ? `${n} ${suffix}` : n}
          </option>
        ))}
      </select>
    </label>
  );
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
  const [monthOpen, setMonthOpen] = useState(false);
  const [addingStop, setAddingStop] = useState(false);
  const [draftStop, setDraftStop] = useState("");
  const monthRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!monthOpen) return;
    const onDoc = (e: MouseEvent) => {
      if (!monthRef.current?.contains(e.target as Node)) setMonthOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [monthOpen]);

  const set = <K extends keyof TripPlanInput>(key: K, v: TripPlanInput[K]) => {
    onChange({ ...value, [key]: v });
  };

  const destinations = value.destinations || [];
  const { year, month } = parseMonth(value.flexibleMonth);

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

  const routeLabel = useMemo(() => {
    const extra = destinations.length ? ` → ${destinations.join(" → ")}` : "";
    return `${value.origin} → ${value.destination}${extra}`;
  }, [value.origin, value.destination, destinations]);

  const commitStop = (city: string) => {
    const c = city.trim();
    if (c.length < 2) return;
    const all = [value.destination, ...destinations].map((x) =>
      x.toLowerCase(),
    );
    if (all.includes(c.toLowerCase())) {
      setDraftStop("");
      setAddingStop(false);
      return;
    }
    set("destinations", [...destinations, c].slice(0, 4));
    setDraftStop("");
    setAddingStop(false);
  };

  const updateStop = (index: number, city: string) => {
    const next = [...destinations];
    next[index] = city;
    set("destinations", next);
  };

  const removeStop = (index: number) => {
    set(
      "destinations",
      destinations.filter((_, i) => i !== index),
    );
  };

  return (
    <section
      className={`viajes-sky viajes-sky--${variant}`}
      aria-labelledby="viajes-wizard-title"
    >
      {step === 1 && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!step1Valid) return;
            setStep(2);
          }}
        >
          <div className="viajes-sky__top">
            <div className="viajes-seg viajes-seg--dates" role="group">
              <button
                type="button"
                aria-pressed={value.dateMode === "exact"}
                onClick={() => set("dateMode", "exact" as DateMode)}
              >
                {t("dateModes.roundtrip")}
              </button>
              <button
                type="button"
                aria-pressed={value.dateMode === "flexible"}
                onClick={() => set("dateMode", "flexible" as DateMode)}
              >
                {t("dateModes.flexible")}
              </button>
            </div>
            <span className="viajes-sky__hint">
              <Compass size={14} aria-hidden />
              {t("transport.allModes")}
            </span>
          </div>

          <div className="viajes-sky__stack" id="viajes-wizard-title">
            <div className="viajes-sky__bar">
              <div className="viajes-sky__field viajes-sky__field--city">
                <CityAutocomplete
                  label={t("fields.origin")}
                  value={value.origin}
                  onChange={(v) => set("origin", v)}
                  placeholder={t("placeholders.originCity")}
                />
              </div>

              <button
                type="button"
                className="viajes-sky__swap"
                aria-label={t("actions.swap")}
                onClick={() =>
                  onChange({
                    ...value,
                    origin: value.destination,
                    destination: value.origin,
                  })
                }
              >
                <ArrowLeftRight size={16} aria-hidden />
              </button>

              <div className="viajes-sky__field viajes-sky__field--city">
                <CityAutocomplete
                  label={t("fields.destination")}
                  value={value.destination}
                  onChange={(v) => set("destination", v)}
                  placeholder={t("placeholders.destinationCity")}
                />
              </div>

              {value.dateMode === "exact" ? (
                <>
                  <label className="viajes-sky__field">
                    <span className="viajes-sky-label">{t("fields.startDate")}</span>
                    <input
                      type="date"
                      value={value.startDate || ""}
                      onChange={(e) => set("startDate", e.target.value)}
                      required
                    />
                  </label>
                  <label className="viajes-sky__field">
                    <span className="viajes-sky-label">{t("fields.endDate")}</span>
                    <input
                      type="date"
                      value={value.endDate || ""}
                      onChange={(e) => set("endDate", e.target.value)}
                      required
                    />
                  </label>
                </>
              ) : (
                <>
                  <div
                    className="viajes-sky__field viajes-sky__field--month"
                    ref={monthRef}
                  >
                    <span className="viajes-sky-label">
                      {t("fields.flexibleMonth")}
                    </span>
                    <button
                      type="button"
                      className="viajes-month-trigger"
                      aria-expanded={monthOpen}
                      onClick={() => setMonthOpen((o) => !o)}
                    >
                      {formatMonthShort(value.flexibleMonth)}
                    </button>
                    {monthOpen ? (
                      <div className="viajes-month-pop">
                        <div className="viajes-month-pop__years">
                          <button
                            type="button"
                            onClick={() =>
                              set(
                                "flexibleMonth",
                                `${year - 1}-${String(month).padStart(2, "0")}`,
                              )
                            }
                          >
                            ‹
                          </button>
                          <strong>{year}</strong>
                          <button
                            type="button"
                            onClick={() =>
                              set(
                                "flexibleMonth",
                                `${year + 1}-${String(month).padStart(2, "0")}`,
                              )
                            }
                          >
                            ›
                          </button>
                        </div>
                        <div className="viajes-month-pop__grid">
                          {MONTHS_SHORT.map((label, i) => {
                            const m = i + 1;
                            const active = m === month;
                            return (
                              <button
                                key={label}
                                type="button"
                                className={active ? "is-active" : undefined}
                                onClick={() => {
                                  set(
                                    "flexibleMonth",
                                    `${year}-${String(m).padStart(2, "0")}`,
                                  );
                                  setMonthOpen(false);
                                }}
                              >
                                {label}.
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ) : null}
                  </div>

                  <div className="viajes-sky__field viajes-sky__field--days">
                    <NumSelect
                      label={t("fields.daysMin")}
                      value={value.daysMin ?? 4}
                      min={1}
                      max={30}
                      suffix={t("fields.daysUnitShort")}
                      onChange={(min) =>
                        onChange({
                          ...value,
                          daysMin: min,
                          daysMax: Math.max(min, value.daysMax ?? min),
                        })
                      }
                    />
                    <NumSelect
                      label={t("fields.daysMax")}
                      value={value.daysMax ?? 7}
                      min={value.daysMin ?? 1}
                      max={30}
                      suffix={t("fields.daysUnitShort")}
                      onChange={(max) => set("daysMax", max)}
                    />
                  </div>
                </>
              )}

              <div className="viajes-sky__field viajes-sky__field--pax">
                <NumSelect
                  label={t("fields.travelers")}
                  value={value.travelers}
                  min={1}
                  max={12}
                  onChange={(n) => set("travelers", n)}
                />
              </div>

              <button
                type="submit"
                className="viajes-sky__search"
                disabled={!step1Valid}
              >
                <Search size={18} aria-hidden />
                <span>{t("actions.search")}</span>
              </button>
            </div>

            <div className="viajes-stops">
              {destinations.map((city, i) => (
                <div key={`stop-${i}`} className="viajes-stops__row">
                  <CityAutocomplete
                    label={`${t("fields.stop")} ${i + 2}`}
                    value={city}
                    onChange={(v) => updateStop(i, v)}
                    placeholder={t("placeholders.destinationCity")}
                  />
                  <button
                    type="button"
                    className="viajes-stops__remove"
                    aria-label={t("actions.removeStop")}
                    onClick={() => removeStop(i)}
                  >
                    <X size={16} aria-hidden />
                  </button>
                </div>
              ))}

              {addingStop ? (
                <div className="viajes-stops__row">
                  <CityAutocomplete
                    label={`${t("fields.stop")} ${destinations.length + 2}`}
                    value={draftStop}
                    onChange={setDraftStop}
                    placeholder={t("placeholders.addCity")}
                  />
                  <button
                    type="button"
                    className="viajes-stops__confirm"
                    disabled={draftStop.trim().length < 2}
                    onClick={() => commitStop(draftStop)}
                  >
                    {t("actions.addStop")}
                  </button>
                  <button
                    type="button"
                    className="viajes-stops__remove"
                    aria-label={t("actions.removeStop")}
                    onClick={() => {
                      setDraftStop("");
                      setAddingStop(false);
                    }}
                  >
                    <X size={16} aria-hidden />
                  </button>
                </div>
              ) : destinations.length < 4 ? (
                <button
                  type="button"
                  className="viajes-stops__add"
                  onClick={() => setAddingStop(true)}
                >
                  <Plus size={15} aria-hidden />
                  {t("actions.addDestination")}
                </button>
              ) : null}
            </div>
          </div>
        </form>
      )}

      {step === 2 && (
        <form
          className="viajes-sky__step2"
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit();
          }}
        >
          <div className="viajes-sky__summary">
            <strong>{routeLabel}</strong>
            <span>
              {value.dateMode === "exact"
                ? `${value.startDate} · ${value.endDate}`
                : `${formatMonthShort(value.flexibleMonth)} · ${value.daysMin}–${value.daysMax}d`}
            </span>
            <span className="viajes-sky__summary-pax">
              <Users size={14} aria-hidden />
              {value.travelers}{" "}
              {value.travelers === 1
                ? t("fields.travelerOne")
                : t("fields.travelerMany")}
            </span>
            <button
              type="button"
              className="viajes-link"
              onClick={() => setStep(1)}
            >
              {t("actions.editRoute")}
            </button>
          </div>

          <div className="viajes-field">
            <span className="viajes-sky-label">{t("fields.luxury")}</span>
            <div className="viajes-lux" role="radiogroup">
              {[1, 2, 3, 4, 5].map((n) => {
                const Icon = LUXURY_ICONS[n];
                return (
                  <button
                    key={n}
                    type="button"
                    role="radio"
                    aria-checked={value.luxury === n}
                    className={`viajes-lux__opt${value.luxury === n ? " is-active" : ""}`}
                    onClick={() => set("luxury", n)}
                  >
                    <Icon size={18} aria-hidden />
                    <strong>{n}</strong>
                    <span>{t(`luxury.${n}`)}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="viajes-field">
            <span className="viajes-sky-label">{t("fields.interests")}</span>
            <div className="viajes-chips viajes-chips--icons">
              {INTEREST_PRESETS.map((id) => {
                const Icon = INTEREST_ICONS[id];
                return (
                  <button
                    key={id}
                    type="button"
                    className="viajes-chip viajes-chip--icon"
                    aria-pressed={value.interests.includes(id)}
                    onClick={() => toggleInterest(id)}
                  >
                    <Icon size={15} aria-hidden />
                    {t(`interests.${id}`)}
                  </button>
                );
              })}
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
              <Sparkles size={16} aria-hidden />
              {loading ? t("actions.generating") : t("actions.generate")}
            </button>
          </div>
        </form>
      )}
    </section>
  );
}
