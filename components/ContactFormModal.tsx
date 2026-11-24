"use client";

import { FormEvent, useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useTranslations } from "next-intl";
import {
  X,
  Zap,
  Briefcase,
  Palette,
  HelpCircle,
  Sparkles,
  User,
  Mail,
  Send,
  Check,
} from "lucide-react";
import "./contact-form-modal.css";

const REASON_KEYS = ["project", "job", "freelance", "question", "other"] as const;

const REASON_ICONS = {
  project: Zap,
  job: Briefcase,
  freelance: Palette,
  question: HelpCircle,
  other: Sparkles,
} as const;

type ContactFormData = { reason: string; name: string; email: string; message: string };
type ContactFormModalProps = { isOpen: boolean; onClose: () => void };

export default function ContactFormModal({ isOpen, onClose }: ContactFormModalProps) {
  const t = useTranslations("contact.form");
  const [formData, setFormData] = useState<ContactFormData>({
    reason: "project",
    name: "",
    email: "",
    message: "",
  });
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
    };
  }, [isOpen, onClose]);

  const canSubmit =
    formData.reason &&
    formData.name.trim().length > 1 &&
    formData.email.includes("@") &&
    formData.message.trim().length > 2 &&
    status !== "loading";

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    setStatus("loading");
    setErrorMsg("");
    try {
      const reasonLabel = t(
        `reasons.${formData.reason as (typeof REASON_KEYS)[number]}.label`,
      );
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reason: reasonLabel,
          name: formData.name.trim(),
          email: formData.email.trim(),
          message: formData.message.trim(),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || "Failed to send");
      }
      setStatus("success");
      setTimeout(() => {
        onClose();
        setFormData({ reason: "project", name: "", email: "", message: "" });
        setStatus("idle");
      }, 2200);
    } catch (err) {
      setStatus("error");
      setErrorMsg(err instanceof Error ? err.message : t("errorGeneric"));
    }
  };

  return (
    <AnimatePresence>
      {isOpen ? (
        <div key="contact-modal" className="contact-form-modal" role="presentation">
          <motion.div
            className="contact-form-modal__backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          <motion.div
            className="contact-form-modal__panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby="contact-form-title"
            onClick={(e) => e.stopPropagation()}
            initial={{ opacity: 0, scale: 0.96, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 16 }}
            transition={{ type: "spring", bounce: 0.12, duration: 0.38 }}
          >
            <div className="contact-form-modal__glow contact-form-modal__glow--1" aria-hidden />
            <div className="contact-form-modal__glow contact-form-modal__glow--2" aria-hidden />

            <button
              type="button"
              className="contact-form-modal__close"
              onClick={onClose}
              aria-label={t("close")}
            >
              <X size={15} />
            </button>

            {status === "success" ? (
              <motion.div
                className="contact-form-modal__success"
                initial={{ opacity: 0, scale: 0.94 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <div className="contact-form-modal__success-icon" aria-hidden>
                  <Check size={32} strokeWidth={2.5} />
                </div>
                <h3 className="contact-form-modal__success-title">{t("successTitle")}</h3>
                <p className="contact-form-modal__success-text">{t("successText")}</p>
              </motion.div>
            ) : (
              <form className="contact-form-modal__form" onSubmit={handleSubmit} noValidate>
                <header className="contact-form-modal__header">
                  <p className="contact-form-modal__kicker">{t("kicker")}</p>
                  <h2 id="contact-form-title" className="contact-form-modal__title">
                    {t("title")}
                  </h2>
                  <p className="contact-form-modal__subtitle">{t("subtitle")}</p>
                </header>

                {status === "error" ? (
                  <div className="contact-form-modal__error" role="alert">
                    {errorMsg}. {t("tryAgain")}
                  </div>
                ) : null}

                <div className="contact-form-modal__body">
                  <fieldset className="contact-form-modal__fieldset">
                    <legend className="contact-form-modal__legend">{t("reasonLabel")}</legend>
                    <div className="contact-form-modal__chips" role="radiogroup">
                      {REASON_KEYS.map((key) => {
                        const Icon = REASON_ICONS[key];
                        const sel = formData.reason === key;
                        return (
                          <button
                            key={key}
                            type="button"
                            role="radio"
                            aria-checked={sel}
                            className={`contact-form-modal__chip${sel ? " is-selected" : ""}`}
                            onClick={() => setFormData((p) => ({ ...p, reason: key }))}
                          >
                            <Icon size={15} strokeWidth={2.25} aria-hidden />
                            <span>{t(`reasons.${key}.label`)}</span>
                          </button>
                        );
                      })}
                    </div>
                  </fieldset>

                  <div className="contact-form-modal__fields">
                    <label className="contact-form-modal__field">
                      <User
                        size={18}
                        strokeWidth={2}
                        className="contact-form-modal__field-icon"
                      />
                      <input
                        type="text"
                        className="contact-form-modal__input"
                        value={formData.name}
                        placeholder={t("namePlaceholder")}
                        required
                        autoComplete="name"
                        onChange={(e) =>
                          setFormData((p) => ({ ...p, name: e.target.value }))
                        }
                      />
                    </label>
                    <label className="contact-form-modal__field">
                      <Mail
                        size={18}
                        strokeWidth={2}
                        className="contact-form-modal__field-icon"
                      />
                      <input
                        type="email"
                        className="contact-form-modal__input"
                        value={formData.email}
                        placeholder={t("emailPlaceholder")}
                        required
                        autoComplete="email"
                        onChange={(e) =>
                          setFormData((p) => ({ ...p, email: e.target.value }))
                        }
                      />
                    </label>
                  </div>

                  <label className="contact-form-modal__message">
                    <span className="sr-only">{t("messageLabel")}</span>
                    <textarea
                      className="contact-form-modal__textarea"
                      value={formData.message}
                      onChange={(e) =>
                        setFormData((p) => ({ ...p, message: e.target.value }))
                      }
                      placeholder={t("messagePlaceholder")}
                      rows={4}
                      required
                    />
                  </label>
                </div>

                <div className="contact-form-modal__footer">
                  <button
                    type="submit"
                    className="contact-form-modal__submit"
                    disabled={!canSubmit}
                  >
                    <Send size={16} strokeWidth={2.25} aria-hidden />
                    {status === "loading" ? t("sending") : t("complete")}
                  </button>
                </div>
              </form>
            )}
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  );
}
