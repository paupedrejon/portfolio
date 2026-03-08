"use client";

import { useState, useRef, useEffect } from "react";
import { useLocale } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { useTransition } from "react";

const locales = [
  { code: "es", label: "ES" },
  { code: "en", label: "EN" },
  { code: "it", label: "IT" },
] as const;

const LOCALE_PATTERN = /^\/(es|en|it)(\/|$)/;

function getPathnameWithoutLocale(raw: string): string {
  const stripped = raw.replace(LOCALE_PATTERN, "$2") || "/";
  return stripped.startsWith("/") ? stripped : `/${stripped}`;
}

export default function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const rawPathname = usePathname();
  const [isPending, startTransition] = useTransition();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const pathname = getPathnameWithoutLocale(rawPathname);
  const currentLocale = locales.find((l) => l.code === locale) ?? locales[0];
  const otherLocales = locales.filter((l) => l.code !== locale);

  const handleLocaleChange = (newLocale: string) => {
    if (newLocale === locale) return;
    startTransition(() => {
      router.replace(pathname, { locale: newLocale });
    });
    setIsOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} style={{ position: "relative" }}>
      <button
        onClick={() => setIsOpen((o) => !o)}
        disabled={isPending}
        aria-label="Seleccionar idioma"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.25rem",
          padding: 0,
          fontSize: "1.25rem",
          fontWeight: 500,
          background: "transparent",
          color: "inherit",
          border: "none",
          cursor: "pointer",
          lineHeight: 1,
        }}
      >
        {currentLocale.label}
        <span
          style={{
            transition: "transform 0.2s ease",
            fontSize: "0.65rem",
            opacity: 0.9,
          }}
        >
          {isOpen ? "▲" : "▼"}
        </span>
      </button>

      {isOpen && (
        <div
          role="listbox"
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            marginTop: "0.35rem",
            background: "transparent",
            minWidth: "3.5rem",
            zIndex: 50,
          }}
        >
          {otherLocales.map(({ code, label }, i) => (
            <button
              key={code}
              role="option"
              onClick={() => handleLocaleChange(code)}
              disabled={isPending}
              aria-label={`Cambiar a ${label}`}
              style={{
                display: "block",
                width: "100%",
                padding: "0.5rem 0",
                fontSize: "1.1rem",
                fontWeight: 500,
                background: "transparent",
                color: "inherit",
                border: "none",
                borderBottom: i < otherLocales.length - 1 ? "1px solid rgba(255,255,255,0.1)" : "none",
                textAlign: "left",
                cursor: "pointer",
                transition: "background 0.15s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.opacity = "0.8";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.opacity = "1";
              }}
            >
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
