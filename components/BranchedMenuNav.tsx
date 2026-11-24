"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { Link, useRouter } from "@/i18n/navigation";
import { usePathname } from "next/navigation";
import {
  AiBrain01Icon,
  Briefcase01Icon,
  ContactIcon,
  CourseIcon,
  Download04Icon,
  Folder01Icon,
  GraduationScrollIcon,
  Home01Icon,
  Mail01Icon,
  SourceCodeIcon,
  UserIcon,
} from "@hugeicons/core-free-icons";
import BranchedMenu, { type BranchedMenuItem } from "./BranchedMenu";
import "./BranchedMenuNav.css";

type NavLeaf = {
  label: string;
  link: string;
  external?: boolean;
};

type SocialItem = {
  label: string;
  link: string;
};

type BranchedMenuNavProps = {
  items: NavLeaf[];
  socialItems?: SocialItem[];
  displaySocials?: boolean;
  logoUrl?: string;
  menuButtonColor?: string;
  accentColor?: string;
  lineColor?: string;
  inkColor?: string;
  theme?: "cherry" | "teal";
  isFixed?: boolean;
  closeOnClickAway?: boolean;
  closeOnPathnameChange?: string;
  headerExtra?: ReactNode;
  exploreLabel?: string;
  connectLabel?: string;
};

function stripLocale(path: string): string {
  const cleaned = path.replace(/^\/(es|en|it)(?=\/|$)/, "") || "/";
  return cleaned;
}

function matchActive(pathname: string, link: string): boolean {
  const current = stripLocale(pathname);
  const target = link.startsWith("http") || link.startsWith("mailto:") || link.endsWith(".pdf")
    ? link
    : stripLocale(link);
  if (target === "/" || target === "") return current === "/" || current === "";
  return current === target || current.startsWith(`${target}/`);
}

export default function BranchedMenuNav({
  items,
  socialItems = [],
  displaySocials = true,
  logoUrl = "/LOGO_portfolio.png",
  menuButtonColor = "#ffffff",
  accentColor = "#e04667",
  lineColor = "#48292f",
  inkColor = "#f5eeed",
  theme = "cherry",
  isFixed = true,
  closeOnClickAway = true,
  closeOnPathnameChange,
  headerExtra,
  exploreLabel = "Explorar",
  connectLabel = "Más",
}: BranchedMenuNavProps) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname() ?? "/";

  const iconFor = useCallback((link: string) => {
    if (link === "/" || link === "") return Home01Icon;
    if (link.includes("proyecto") || link.includes("project")) return Folder01Icon;
    if (link.includes("skill")) return AiBrain01Icon;
    if (link.includes("experience") || link.includes("experiencia")) return Briefcase01Icon;
    if (link.includes("education") || link.includes("educacion")) return GraduationScrollIcon;
    if (link.includes("about")) return UserIcon;
    if (link.includes("contact")) return ContactIcon;
    if (link.includes("curso")) return CourseIcon;
    if (link.endsWith(".pdf") || link.includes("CV")) return Download04Icon;
    if (link.includes("github")) return SourceCodeIcon;
    if (link.startsWith("mailto:")) return Mail01Icon;
    return SourceCodeIcon;
  }, []);

  const branchedItems = useMemo<BranchedMenuItem[]>(() => {
    const main = items.filter(
      (it) =>
        !it.external &&
        !it.link.includes("contact") &&
        !it.link.includes("curso")
    );
    const more = items.filter(
      (it) =>
        it.external ||
        it.link.includes("contact") ||
        it.link.includes("curso")
    );

    const sections: BranchedMenuItem[] = [
      {
        label: exploreLabel,
        children: main.map((it) => ({
          value: it.link,
          label: it.label,
          icon: iconFor(it.link),
        })),
      },
    ];

    if (more.length) {
      sections.push({
        label: connectLabel,
        children: more.map((it) => ({
          value: it.link,
          label: it.label,
          icon: iconFor(it.link),
        })),
      });
    }

    return sections;
  }, [items, exploreLabel, connectLabel, iconFor]);

  const defaultActive = useMemo(() => {
    const all = branchedItems.flatMap((s) => s.children ?? []);
    const hit = all.find((c) => matchActive(pathname, c.value));
    return hit?.value ?? all[0]?.value ?? "";
  }, [branchedItems, pathname]);

  const closeMenu = useCallback(() => setOpen(false), []);
  const toggleMenu = useCallback(() => setOpen((v) => !v), []);

  useEffect(() => {
    if (closeOnPathnameChange !== undefined && open) closeMenu();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [closeOnPathnameChange]);

  useEffect(() => {
    if (!closeOnClickAway || !open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeMenu();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [closeOnClickAway, open, closeMenu]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const onSelect = (value: string) => {
    closeMenu();
    if (
      value.startsWith("http") ||
      value.startsWith("mailto:") ||
      value.endsWith(".pdf")
    ) {
      window.open(value, "_blank", "noopener,noreferrer");
      return;
    }
    router.push(value);
  };

  return (
    <div
      className={`bmn-wrapper${isFixed ? " bmn-fixed" : ""}`}
      data-open={open || undefined}
      data-theme={theme}
      style={
        {
          "--bmn-btn": menuButtonColor,
          "--bmn-accent": accentColor,
        } as CSSProperties
      }
    >
      <header className="bmn-header" aria-label="Main navigation header">
        <Link href="/" className="bmn-logo" aria-label="Logo">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={logoUrl}
            alt="Logo"
            className="bmn-logo-img"
            draggable={false}
            width={40}
            height={40}
          />
        </Link>
        <div className="bmn-header-actions">
          {headerExtra}
          <button
            type="button"
            className="bmn-toggle"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            aria-controls="branched-menu-panel"
            onClick={toggleMenu}
          >
            <span className="bmn-hamburger" aria-hidden="true">
              <span className="bmn-hamburger-line" />
              <span className="bmn-hamburger-line" />
              <span className="bmn-hamburger-line" />
            </span>
          </button>
        </div>
      </header>

      <div
        className="bmn-backdrop"
        aria-hidden={!open}
        onClick={closeOnClickAway ? closeMenu : undefined}
      />

      <aside
        id="branched-menu-panel"
        className="bmn-panel"
        aria-hidden={!open}
      >
        <div className="bmn-panel-inner">
          <BranchedMenu
            key={defaultActive}
            items={branchedItems}
            defaultOpen={[0, 1]}
            defaultActive={defaultActive}
            onSelect={onSelect}
            color={inkColor}
            accentColor={accentColor}
            lineColor={lineColor}
            width={280}
            rowHeight={38}
            indent={42}
            trunk={14}
            radius={10}
            lineWidth={1.5}
            fontSize={14}
            drawDuration={400}
            foldDuration={300}
          />

          {displaySocials && socialItems.length > 0 ? (
            <div className="bmn-socials" aria-label="Social links">
              <h3 className="bmn-socials-title">Socials</h3>
              <ul className="bmn-socials-list" role="list">
                {socialItems.map((s) => (
                  <li key={s.label}>
                    <a
                      href={s.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bmn-socials-link"
                    >
                      {s.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      </aside>
    </div>
  );
}
