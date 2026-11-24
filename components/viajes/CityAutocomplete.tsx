"use client";

import { useEffect, useId, useRef, useState } from "react";
import { filterPopularCities } from "@/lib/viajes/cities";

type Props = {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  label?: string;
  id?: string;
  className?: string;
};

export default function CityAutocomplete({
  value,
  onChange,
  placeholder,
  label,
  id: idProp,
  className,
}: Props) {
  const autoId = useId();
  const id = idProp || autoId;
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const wrapRef = useRef<HTMLDivElement>(null);

  const suggestions = filterPopularCities(value, 8);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const pick = (city: string) => {
    onChange(city);
    setOpen(false);
  };

  return (
    <div className={`viajes-ac ${className || ""}`} ref={wrapRef}>
      {label ? (
        <label className="viajes-sky-label" htmlFor={id}>
          {label}
        </label>
      ) : null}
      <input
        id={id}
        className="viajes-sky-input"
        value={value}
        placeholder={placeholder}
        autoComplete="off"
        role="combobox"
        aria-expanded={open}
        aria-autocomplete="list"
        aria-controls={`${id}-list`}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
          setHighlight(0);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={(e) => {
          if (!open || suggestions.length === 0) return;
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setHighlight((h) => Math.min(h + 1, suggestions.length - 1));
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setHighlight((h) => Math.max(h - 1, 0));
          } else if (e.key === "Enter") {
            e.preventDefault();
            pick(suggestions[highlight] || value);
          } else if (e.key === "Escape") {
            setOpen(false);
          }
        }}
      />
      {open && suggestions.length > 0 ? (
        <ul id={`${id}-list`} className="viajes-ac-list" role="listbox">
          {suggestions.map((city, i) => (
            <li key={city} role="option" aria-selected={i === highlight}>
              <button
                type="button"
                className={`viajes-ac-option${i === highlight ? " is-active" : ""}`}
                onMouseEnter={() => setHighlight(i)}
                onMouseDown={(e) => {
                  e.preventDefault();
                  pick(city);
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path
                    d="M12 21s7-5.2 7-11a7 7 0 1 0-14 0c0 5.8 7 11 7 11Z"
                    stroke="currentColor"
                    strokeWidth="1.8"
                  />
                  <circle cx="12" cy="10" r="2.2" stroke="currentColor" strokeWidth="1.8" />
                </svg>
                <span>{city}</span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
