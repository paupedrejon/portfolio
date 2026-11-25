"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";

type ViajesDateFieldProps = {
  label: string;
  value: string; // YYYY-MM-DD
  onChange: (iso: string) => void;
  min?: string;
  required?: boolean;
};

const WEEKDAYS = ["L", "M", "X", "J", "V", "S", "D"];

function parseIso(iso: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return null;
  const d = new Date(`${iso}T12:00:00`);
  return Number.isNaN(d.getTime()) ? null : d;
}

function toIso(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function formatDisplay(iso: string, locale = "es"): string {
  const d = parseIso(iso);
  if (!d) return "—";
  return d.toLocaleDateString(locale, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1, 12);
}

/** Monday-first grid cells for a month */
function monthCells(view: Date): (Date | null)[] {
  const first = startOfMonth(view);
  const startPad = (first.getDay() + 6) % 7; // Mon=0
  const daysInMonth = new Date(
    view.getFullYear(),
    view.getMonth() + 1,
    0,
  ).getDate();
  const cells: (Date | null)[] = [];
  for (let i = 0; i < startPad; i++) cells.push(null);
  for (let day = 1; day <= daysInMonth; day++) {
    cells.push(new Date(view.getFullYear(), view.getMonth(), day, 12));
  }
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

export default function ViajesDateField({
  label,
  value,
  onChange,
  min,
  required,
}: ViajesDateFieldProps) {
  const selected = parseIso(value);
  const minDate = parseIso(min || "");
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<Date>(() =>
    startOfMonth(selected || new Date()),
  );
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (selected) setView(startOfMonth(selected));
  }, [value]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const cells = useMemo(() => monthCells(view), [view]);
  const monthLabel = view.toLocaleDateString("es", {
    month: "long",
    year: "numeric",
  });

  const disabledDay = (d: Date) => {
    if (!minDate) return false;
    return toIso(d) < toIso(minDate);
  };

  return (
    <div className="viajes-date" ref={rootRef}>
      <span className="viajes-sky-label">{label}</span>
      <button
        type="button"
        className="viajes-date__trigger"
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={() => setOpen((o) => !o)}
      >
        <CalendarDays size={16} aria-hidden />
        <span>{value ? formatDisplay(value) : "Elegir fecha"}</span>
      </button>
      {/* Keep a hidden input for native form required validation */}
      <input
        type="text"
        tabIndex={-1}
        aria-hidden
        required={required}
        value={value}
        onChange={() => undefined}
        className="viajes-date__ghost"
      />
      {open && (
        <div className="viajes-date__pop" role="dialog" aria-label={label}>
          <div className="viajes-date__nav">
            <button
              type="button"
              aria-label="Mes anterior"
              onClick={() =>
                setView(
                  new Date(view.getFullYear(), view.getMonth() - 1, 1, 12),
                )
              }
            >
              <ChevronLeft size={16} aria-hidden />
            </button>
            <strong>{monthLabel}</strong>
            <button
              type="button"
              aria-label="Mes siguiente"
              onClick={() =>
                setView(
                  new Date(view.getFullYear(), view.getMonth() + 1, 1, 12),
                )
              }
            >
              <ChevronRight size={16} aria-hidden />
            </button>
          </div>
          <div className="viajes-date__week">
            {WEEKDAYS.map((d) => (
              <span key={d}>{d}</span>
            ))}
          </div>
          <div className="viajes-date__grid">
            {cells.map((d, i) => {
              if (!d) return <span key={`e-${i}`} className="viajes-date__empty" />;
              const iso = toIso(d);
              const isSel = value === iso;
              const isDis = disabledDay(d);
              return (
                <button
                  key={iso}
                  type="button"
                  disabled={isDis}
                  aria-pressed={isSel}
                  className={
                    isSel
                      ? "viajes-date__day viajes-date__day--sel"
                      : "viajes-date__day"
                  }
                  onClick={() => {
                    onChange(iso);
                    setOpen(false);
                  }}
                >
                  {d.getDate()}
                </button>
              );
            })}
          </div>
          <div className="viajes-date__foot">
            <button
              type="button"
              onClick={() => {
                onChange("");
                setOpen(false);
              }}
            >
              Borrar
            </button>
            <button
              type="button"
              onClick={() => {
                const today = toIso(new Date());
                if (minDate && today < toIso(minDate)) return;
                onChange(today);
                setView(startOfMonth(new Date()));
                setOpen(false);
              }}
            >
              Hoy
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
