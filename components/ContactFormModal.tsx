"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useTranslations } from "next-intl";
import Stepper, { Step } from "./Stepper";
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
  ArrowRight,
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
    reason: "",
    name: "",
    email: "",
    message: "",
  });
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const handleFinalStepCompleted = async () => {
    setStatus("loading");
    setErrorMsg("");
    try {
      const reasonLabel = formData.reason
        ? t(`reasons.${formData.reason as (typeof REASON_KEYS)[number]}.label`)
        : formData.reason;
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reason: reasonLabel,
          name: formData.name,
          email: formData.email,
          message: formData.message,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || "Failed to send");
      }
      setStatus("success");
      setTimeout(() => {
        onClose();
        setFormData({ reason: "", name: "", email: "", message: "" });
        setStatus("idle");
      }, 2500);
    } catch (err) {
      setStatus("error");
      setErrorMsg(err instanceof Error ? err.message : t("errorGeneric"));
    }
  };

  const reviewRows = [
    { key: "reason", value: formData.reason ? t(`reasons.${formData.reason as (typeof REASON_KEYS)[number]}.label`) : "" },
    { key: "name", value: formData.name },
    { key: "email", value: formData.email },
    { key: "message", value: formData.message },
  ] as const;

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          key="contact-modal"
          className="contact-form-modal"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 100,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "16px",
          }}
        >
          <motion.div
            className="contact-form-modal__backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          <motion.div
            className="contact-form-modal__panel"
            onClick={(e) => e.stopPropagation()}
            initial={{ opacity: 0, scale: 0.93, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.93, y: 24 }}
            transition={{ type: "spring", bounce: 0.18, duration: 0.42 }}
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
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                style={{ padding: "2.5rem 0", textAlign: "center" }}
              >
                <div className="contact-form-modal__success-icon" aria-hidden>
                  <Check size={36} strokeWidth={2.5} color="#4eb3c8" />
                </div>
                <h3 className="contact-form-modal__success-title">{t("successTitle")}</h3>
                <p className="contact-form-modal__success-text">{t("successText")}</p>
              </motion.div>
            ) : (
              <>
                <p className="contact-form-modal__kicker">{t("kicker")}</p>
                <h2 className="contact-form-modal__title">{t("title")}</h2>
                <p className="contact-form-modal__subtitle">{t("subtitle")}</p>

                {status === "error" && (
                  <div className="contact-form-modal__error" role="alert">
                    {errorMsg}. {t("tryAgain")}
                  </div>
                )}

                <Stepper
                  initialStep={1}
                  onFinalStepCompleted={handleFinalStepCompleted}
                  backButtonText={t("back")}
                  nextButtonText={
                    status === "loading" ? (
                      t("sending")
                    ) : (
                      <ArrowRight size={20} strokeWidth={2.5} aria-hidden />
                    )
                  }
                  completeButtonText={status === "loading" ? t("sending") : t("complete")}
                  variant="premium"
                  className="contact-modal-stepper contact-form-modal-stepper !aspect-auto !p-0"
                  stepCircleContainerClassName="!max-w-full !border-0 !bg-transparent !rounded-none !shadow-none"
                  stepContainerClassName="!p-0 !mb-2"
                  footerClassName="sticky bottom-0 z-10 bg-transparent pt-4 pb-0"
                  nextButtonProps={{ disabled: status === "loading" }}
                >
                  <Step>
                    <p className="contact-form-modal__step-label">{t("step1Label")}</p>
                    <h3 className="contact-form-modal__step-title">{t("step1Title")}</h3>
                    <div className="contact-form-modal__reasons">
                      {REASON_KEYS.map((key) => {
                        const Icon = REASON_ICONS[key];
                        const sel = formData.reason === key;
                        return (
                          <label
                            key={key}
                            className={`contact-form-modal__reason${sel ? " is-selected" : ""}`}
                          >
                            <input
                              type="radio"
                              name="reason"
                              value={key}
                              checked={sel}
                              onChange={(e) =>
                                setFormData((p) => ({ ...p, reason: e.target.value }))
                              }
                              className="sr-only"
                            />
                            <div className="contact-form-modal__reason-icon" aria-hidden>
                              <Icon size={18} strokeWidth={2} />
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div className="contact-form-modal__reason-label">
                                {t(`reasons.${key}.label`)}
                              </div>
                              <div className="contact-form-modal__reason-desc">
                                {t(`reasons.${key}.desc`)}
                              </div>
                            </div>
                            {sel ? (
                              <span className="contact-form-modal__reason-check" aria-hidden>
                                ✓
                              </span>
                            ) : null}
                          </label>
                        );
                      })}
                    </div>
                  </Step>

                  <Step>
                    <p className="contact-form-modal__step-label">{t("step2Label")}</p>
                    <h3 className="contact-form-modal__step-title">{t("step2Title")}</h3>
                    <div className="contact-form-modal__fields">
                      <label className="contact-form-modal__field">
                        <User size={20} strokeWidth={2} className="contact-form-modal__field-icon" />
                        <input
                          type="text"
                          className="contact-form-modal__input"
                          value={formData.name}
                          placeholder={t("namePlaceholder")}
                          required
                          onChange={(e) =>
                            setFormData((p) => ({ ...p, name: e.target.value }))
                          }
                        />
                      </label>
                      <label className="contact-form-modal__field">
                        <Mail size={20} strokeWidth={2} className="contact-form-modal__field-icon" />
                        <input
                          type="email"
                          className="contact-form-modal__input"
                          value={formData.email}
                          placeholder={t("emailPlaceholder")}
                          required
                          onChange={(e) =>
                            setFormData((p) => ({ ...p, email: e.target.value }))
                          }
                        />
                      </label>
                    </div>
                  </Step>

                  <Step>
                    <p className="contact-form-modal__step-label">{t("step3Label")}</p>
                    <h3 className="contact-form-modal__step-title">{t("step3Title")}</h3>
                    <textarea
                      className="contact-form-modal__textarea"
                      value={formData.message}
                      onChange={(e) =>
                        setFormData((p) => ({ ...p, message: e.target.value }))
                      }
                      placeholder={t("messagePlaceholder")}
                      rows={6}
                      required
                    />
                  </Step>

                  <Step>
                    <p className="contact-form-modal__step-label">{t("step4Label")}</p>
                    <h3 className="contact-form-modal__step-title">{t("step4Title")}</h3>
                    <div className="contact-form-modal__review" style={{ marginBottom: "1rem" }}>
                      {reviewRows.map(({ key, value }) => (
                        <div key={key} className="contact-form-modal__review-row">
                          <div className="contact-form-modal__review-key">
                            {t(`review.${key}`)}
                          </div>
                          <div className="contact-form-modal__review-val">{value}</div>
                        </div>
                      ))}
                    </div>
                    <p className="contact-form-modal__hint">
                      <Send size={13} aria-hidden />
                      {t("reviewHint")}
                    </p>
                  </Step>
                </Stepper>
              </>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
