"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { ArrowRight, Github, Linkedin, Mail, Phone } from "lucide-react";
import { CONTACT_EMAIL, GITHUB_URL, LINKEDIN_URL } from "@/lib/seo/config";
import "../home.css";
import "../proyectos/proyectos.css";
import "./contact.css";
import PortfolioPageHero from "@/components/portfolio/PortfolioPageHero";
import HomeHeroBackground from "@/components/home/HomeHeroBackground";
import ContactFormModal from "@/components/ContactFormModal";
import LightRays from "@/components/LightRays";

const LINE_COUNT = 20;

function lineStyle(i: number) {
  const s = (i * 2654435761) % 10000 / 10000;
  const t = ((i + 1) * 1597334677) % 10000 / 10000;
  const u = ((i + 2) * 32416190071) % 10000 / 10000;
  const v = ((i + 3) * 2038074743) % 10000 / 10000;
  const w = ((i + 4) * 2166136261) % 10000 / 10000;
  const color = s > 0.5 ? "53, 140, 159" : "78, 179, 200";
  return {
    width: `${s * 2 + 1}px`,
    height: `${t * 250 + 120}px`,
    left: `${u * 100}%`,
    animationDuration: `${v * 8 + 6}s`,
    animationDelay: `${w * 5}s`,
    background: `linear-gradient(to top, rgba(${color}, 0), rgba(${color}, ${u * 0.35 + 0.25}))`,
    boxShadow: `0 0 ${v * 12 + 6}px rgba(${color}, 0.35)`,
  } as const;
}

const METHOD_KEYS = ["github", "linkedin", "email", "phone"] as const;

const METHOD_HREFS: Record<(typeof METHOD_KEYS)[number], string> = {
  github: GITHUB_URL,
  linkedin: LINKEDIN_URL,
  email: `mailto:${CONTACT_EMAIL}`,
  phone: "tel:+34689063590",
};

function MethodIcon({ id }: { id: (typeof METHOD_KEYS)[number] }) {
  const size = 28;
  const stroke = 1.75;
  switch (id) {
    case "github":
      return <Github size={size} strokeWidth={stroke} />;
    case "linkedin":
      return <Linkedin size={size} strokeWidth={stroke} />;
    case "email":
      return <Mail size={size} strokeWidth={stroke} />;
    case "phone":
      return <Phone size={size} strokeWidth={stroke} />;
  }
}

export default function ContactPage() {
  const t = useTranslations("contact");
  const tNav = useTranslations("nav");
  const [mounted, setMounted] = useState(false);
  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [weakDevice, setWeakDevice] = useState(false);

  const contactMethods = useMemo(
    () =>
      METHOD_KEYS.map((key) => ({
        key,
        href: METHOD_HREFS[key],
        title: t(`methods.${key}.title`),
        subtitle: t(`methods.${key}.subtitle`),
      })),
    [t],
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => {
      setReducedMotion(media.matches);
      setIsMobile(window.innerWidth < 768);
      const lowCpu = (navigator.hardwareConcurrency || 8) < 6;
      const lowMem =
        "deviceMemory" in navigator &&
        (navigator as Navigator & { deviceMemory?: number }).deviceMemory! <= 4;
      setWeakDevice(lowCpu || !!lowMem);
    };
    update();
    media.addEventListener("change", update);
    window.addEventListener("resize", update);
    return () => {
      media.removeEventListener("change", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  const showLightRays = !reducedMotion && !weakDevice;

  return (
    <div className="portfolio-page">
      <PortfolioPageHero
        className="contact-hero"
        kicker={t("badge")}
        title={t("title")}
        tagline={t("tagline")}
        scrollTargetId="contact"
        mounted={mounted}
        showCv={false}
        background={
          showLightRays ? (
            <LightRays
              raysOrigin="top-center"
              raysColor="#ffffff"
              raysSpeed={isMobile ? 0.75 : 1}
              lightSpread={0.5}
              rayLength={isMobile ? 2.2 : 3}
              followMouse={!isMobile}
              mouseInfluence={isMobile ? 0 : 0.1}
              noiseAmount={0}
              distortion={0}
              pulsating={false}
              fadeDistance={1}
              saturation={1}
            />
          ) : (
            <HomeHeroBackground />
          )
        }
      >
        <button
          type="button"
          onClick={() => setContactModalOpen(true)}
          className="portfolio-btn--cv home-btn--cv"
        >
          <span className="cv-btn-text">
            <Mail size={20} strokeWidth={2} />
            {tNav("contact")}
          </span>
        </button>
      </PortfolioPageHero>

      <ContactFormModal isOpen={contactModalOpen} onClose={() => setContactModalOpen(false)} />

      <section id="contact" className="contact-section">
        <div className="contact-section__ambient" aria-hidden>
          <div className="contact-section__pulse" />
          {mounted
            ? [...Array(LINE_COUNT)].map((_, i) => (
                <div key={i} className="contact-section__line" style={lineStyle(i)} />
              ))
            : null}
        </div>

        <div className="contact-section__inner">
          <div className="portfolio-filters contact-filters">
            <div className="portfolio-filters__bar">
              <h2 className="portfolio-filters__title">{t("sectionTitle")}</h2>
            </div>
          </div>

          <div className="contact-section__body">
            <div className="contact-methods">
              {contactMethods.map((method) => (
                <a
                  key={method.key}
                  href={method.href}
                  target={method.href.startsWith("http") ? "_blank" : undefined}
                  rel={method.href.startsWith("http") ? "noopener noreferrer" : undefined}
                  className="contact-method-card"
                >
                  <div className="contact-method-card__icon" aria-hidden>
                    <MethodIcon id={method.key} />
                  </div>
                  <h3 className="contact-method-card__title">{method.title}</h3>
                  <p className="contact-method-card__subtitle">{method.subtitle}</p>
                  <span className="contact-method-card__cta">
                    {t("getInTouch")}
                    <ArrowRight size={14} strokeWidth={2.5} aria-hidden />
                  </span>
                </a>
              ))}
            </div>

            <div className="portfolio-filters contact-filters">
              <div className="portfolio-filters__bar">
                <h2 className="portfolio-filters__title">{t("form.sectionTitle")}</h2>
              </div>
            </div>

            <article className="contact-form-block">
              <div className="contact-form-block__inner">
                <h3 className="contact-form-block__title">{t("form.ctaTitle")}</h3>
                <p className="contact-form-block__text">{t("form.ctaText")}</p>
                <div className="contact-form-block__actions">
                  <button
                    type="button"
                    className="contact-form-block__btn-primary"
                    onClick={() => setContactModalOpen(true)}
                  >
                    <Mail size={20} strokeWidth={2} aria-hidden />
                    {t("form.openForm")}
                  </button>
                  <a href="mailto:paupedrejon@gmail.com" className="contact-form-block__btn-secondary">
                    <Mail size={18} strokeWidth={2} aria-hidden />
                    {t("form.sendEmail")}
                  </a>
                </div>
              </div>
            </article>
          </div>
        </div>
      </section>
    </div>
  );
}
