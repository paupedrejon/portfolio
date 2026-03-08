"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import Stepper, { Step } from "./Stepper";
import { X, Zap, Briefcase, Palette, HelpCircle, Sparkles, User, Mail, Send } from "lucide-react";

const CONTACT_REASONS = [
  { value: "project",  label: "Project / Collaboration", icon: Zap,        desc: "Let's create something together" },
  { value: "job",      label: "Job offer",               icon: Briefcase,  desc: "Full-time or part-time opportunity" },
  { value: "freelance",label: "Freelance work",          icon: Palette,    desc: "Short-term project or contract" },
  { value: "question", label: "General question",        icon: HelpCircle, desc: "Just want to chat or ask something" },
  { value: "other",    label: "Other",                   icon: Sparkles,   desc: "Something else entirely" },
] as const;

type ContactFormData = { reason: string; name: string; email: string; message: string };
type ContactFormModalProps = { isOpen: boolean; onClose: () => void };

const SectionLabel = ({ children }: { children: React.ReactNode }) => (
  <p style={{ color: "rgba(139,92,246,0.85)", fontSize: "13px", fontWeight: 700, letterSpacing: "3px", textTransform: "uppercase", margin: "0 0 6px" }}>
    {children}
  </p>
);

const StepHeading = ({ children }: { children: React.ReactNode }) => (
  <h3 style={{ color: "white", fontSize: "24px", fontWeight: 800, letterSpacing: "-0.5px", margin: "0 0 14px", lineHeight: 1.2 }}>
    {children}
  </h3>
);

function CloseBtn({ onClick }: { onClick: () => void }) {
  const [hov, setHov] = useState(false);
  return (
    <button
      onClick={onClick} aria-label="Close"
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        position: "absolute", top: "20px", right: "20px",
        width: "36px", height: "36px", borderRadius: "50%",
        backgroundColor: hov ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.06)",
        border: "1px solid rgba(255,255,255,0.1)",
        color: hov ? "white" : "rgba(255,255,255,0.45)",
        display: "flex", alignItems: "center", justifyContent: "center",
        cursor: "pointer", transition: "all 0.2s",
      }}
    >
      <X size={15} />
    </button>
  );
}

export default function ContactFormModal({ isOpen, onClose }: ContactFormModalProps) {
  const [formData, setFormData] = useState<ContactFormData>({ reason: "", name: "", email: "", message: "" });
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const handleFinalStepCompleted = async () => {
    setStatus("loading");
    setErrorMsg("");
    try {
      const reasonLabel = CONTACT_REASONS.find(r => r.value === formData.reason)?.label ?? formData.reason;
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
      setTimeout(() => { onClose(); setFormData({ reason: "", name: "", email: "", message: "" }); setStatus("idle"); }, 2500);
    } catch (err) {
      setStatus("error");
      setErrorMsg(err instanceof Error ? err.message : "Something went wrong");
    }
  };

  const fieldWrap: React.CSSProperties = {
    display: "flex", alignItems: "center", gap: "14px",
    padding: "15px 18px",
    backgroundColor: "#111",
    border: "1px solid rgba(255,255,255,0.09)",
    borderRadius: "14px", cursor: "text",
    transition: "border-color 0.2s",
  };

  const inputBase: React.CSSProperties = {
    backgroundColor: "transparent", border: "none", padding: 0,
    color: "white", fontSize: "16px", width: "100%", outline: "none",
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div key="contact-modal" style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}>

          {/* Backdrop */}
          <motion.div
            style={{ position: "absolute", inset: 0, backgroundColor: "rgba(0,0,0,0.9)", backdropFilter: "blur(14px)" }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            onClick={e => e.stopPropagation()}
            initial={{ opacity: 0, scale: 0.93, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.93, y: 24 }}
            transition={{ type: "spring", bounce: 0.18, duration: 0.42 }}
            style={{
              position: "relative", zIndex: 10,
              width: "100%", maxWidth: "560px",
              backgroundColor: "#000",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "28px",
              padding: "32px 36px 28px",
            }}
          >
            {/* Glows */}
            <div style={{ position: "absolute", top: "-100px", right: "-100px", width: "340px", height: "340px", borderRadius: "50%", background: "radial-gradient(circle, rgba(139,92,246,0.22) 0%, transparent 60%)", filter: "blur(50px)", pointerEvents: "none" }} />
            <div style={{ position: "absolute", bottom: "-80px", left: "-80px", width: "260px", height: "260px", borderRadius: "50%", background: "radial-gradient(circle, rgba(99,102,241,0.14) 0%, transparent 60%)", filter: "blur(40px)", pointerEvents: "none" }} />

            <CloseBtn onClick={onClose} />

            {/* ── SUCCESS ── */}
            {status === "success" ? (
              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} style={{ padding: "48px 0", textAlign: "center" }}>
                <div style={{ width: "80px", height: "80px", borderRadius: "50%", background: "linear-gradient(135deg, rgba(16,185,129,0.25), rgba(16,185,129,0.05))", border: "1px solid rgba(16,185,129,0.4)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px" }}>
                  <svg width="36" height="36" fill="none" stroke="#10b981" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                </div>
                <h3 style={{ color: "white", fontSize: "24px", fontWeight: 800, marginBottom: "8px" }}>Message sent!</h3>
                <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "15px" }}>I&apos;ll get back to you soon.</p>
              </motion.div>

            ) : (
              <>
                {/* Header */}
                <div style={{ marginBottom: "20px" }}>
                  <SectionLabel>Contact</SectionLabel>
                  <h2 style={{ color: "white", fontSize: "32px", fontWeight: 900, letterSpacing: "-1.5px", margin: "0 0 4px", fontFamily: "var(--font-league-spartan)" }}>
                    Get in touch
                  </h2>
                  <p style={{ color: "rgba(255,255,255,0.38)", fontSize: "16px", margin: 0 }}>
                    Let&apos;s build something together
                  </p>
                </div>

                {status === "error" && (
                  <div style={{ marginBottom: "16px", padding: "12px 16px", backgroundColor: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.4)", borderRadius: "12px", color: "#fca5a5", fontSize: "14px" }}>
                    {errorMsg}. Try again.
                  </div>
                )}
                <Stepper
                  initialStep={1}
                  onFinalStepCompleted={handleFinalStepCompleted}
                  backButtonText="Back"
                  nextButtonText="→"
                  variant="premium"
                  className="contact-modal-stepper !aspect-auto !p-0"
                  stepCircleContainerClassName="!max-w-full !border-0 !bg-transparent !rounded-none !shadow-none"
                  stepContainerClassName="!p-0 !mb-2"
                  footerClassName="sticky bottom-0 z-10 bg-black pt-4 pb-0"
                  nextButtonProps={status === "loading" ? { disabled: true, children: "Sending…" } : {}}
                >

                  {/* STEP 1 */}
                  <Step>
                    <SectionLabel>Step 1 of 4</SectionLabel>
                    <StepHeading>What do you need?</StepHeading>
                    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                      {CONTACT_REASONS.map(r => {
                        const Icon = r.icon;
                        const sel = formData.reason === r.value;
                        return (
                          <label key={r.value} style={{
                            display: "flex", alignItems: "center", gap: "14px",
                            padding: "10px 14px",
                            backgroundColor: sel ? "rgba(139,92,246,0.13)" : "#0d0d0d",
                            border: sel ? "1px solid rgba(139,92,246,0.5)" : "1px solid rgba(255,255,255,0.07)",
                            borderRadius: "14px", cursor: "pointer",
                            transition: "all 0.18s ease",
                            boxShadow: sel ? "0 0 24px rgba(139,92,246,0.12)" : "none",
                          }}>
                            <input type="radio" name="reason" value={r.value} checked={sel}
                              onChange={e => setFormData(p => ({ ...p, reason: e.target.value }))}
                              className="sr-only" />
                            <div style={{
                              width: "38px", height: "38px", borderRadius: "10px", flexShrink: 0,
                              backgroundColor: sel ? "rgba(139,92,246,0.22)" : "rgba(255,255,255,0.05)",
                              border: sel ? "1px solid rgba(139,92,246,0.35)" : "1px solid rgba(255,255,255,0.07)",
                              display: "flex", alignItems: "center", justifyContent: "center",
                              color: sel ? "#a78bfa" : "rgba(255,255,255,0.38)",
                              transition: "all 0.18s",
                            }}>
                              <Icon size={18} strokeWidth={2} />
                            </div>
                            <div style={{ flex: 1 }}>
                              <div style={{ color: sel ? "white" : "rgba(255,255,255,0.7)", fontSize: "16px", fontWeight: sel ? 700 : 400 }}>
                                {r.label}
                              </div>
                              <div style={{ color: "rgba(255,255,255,0.28)", fontSize: "13px", marginTop: "2px" }}>
                                {r.desc}
                              </div>
                            </div>
                            {sel && (
                              <div style={{
                                width: "22px", height: "22px", borderRadius: "50%",
                                background: "linear-gradient(135deg,#8B5CF6,#6366F1)",
                                display: "flex", alignItems: "center", justifyContent: "center",
                                fontSize: "11px", color: "white", flexShrink: 0,
                                boxShadow: "0 0 12px rgba(139,92,246,0.6)",
                              }}>✓</div>
                            )}
                          </label>
                        );
                      })}
                    </div>
                  </Step>

                  {/* STEP 2 */}
                  <Step>
                    <SectionLabel>Step 2 of 4</SectionLabel>
                    <StepHeading>Your details</StepHeading>
                    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                      {([
                        { icon: User, placeholder: "Your name",      field: "name",  type: "text",  value: formData.name },
                        { icon: Mail, placeholder: "your@email.com", field: "email", type: "email", value: formData.email },
                      ] as const).map(({ icon: Icon, placeholder, field, type, value }) => (
                        <label key={field} style={fieldWrap}
                          onFocus={e => ((e.currentTarget as HTMLElement).style.borderColor = "rgba(139,92,246,0.5)")}
                          onBlur={e  => ((e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.09)")}
                        >
                          <Icon size={20} strokeWidth={2} style={{ color: "rgba(255,255,255,0.3)", flexShrink: 0 }} />
                          <input type={type} value={value} placeholder={placeholder} required
                            onChange={e => setFormData(p => ({ ...p, [field]: e.target.value }))}
                            style={{ ...inputBase, fontSize: "17px" }} />
                        </label>
                      ))}
                    </div>
                  </Step>

                  {/* STEP 3 */}
                  <Step>
                    <SectionLabel>Step 3 of 4</SectionLabel>
                    <StepHeading>Your message</StepHeading>
                    <textarea
                      value={formData.message}
                      onChange={e => setFormData(p => ({ ...p, message: e.target.value }))}
                      placeholder="Tell me about your project or inquiry..."
                      rows={6} required
                      style={{
                        width: "100%", resize: "none",
                        backgroundColor: "#111",
                        border: "1px solid rgba(255,255,255,0.09)",
                        borderRadius: "14px", padding: "16px 18px",
                        color: "white", fontSize: "16px", lineHeight: "1.75",
                        outline: "none", transition: "border-color 0.2s",
                        minHeight: "150px", fontFamily: "inherit",
                      }}
                      onFocus={e => (e.target.style.borderColor = "rgba(139,92,246,0.5)")}
                      onBlur={e  => (e.target.style.borderColor = "rgba(255,255,255,0.09)")}
                    />
                  </Step>

                  {/* STEP 4 */}
                  <Step>
                    <SectionLabel>Step 4 of 4</SectionLabel>
                    <StepHeading>Review &amp; send</StepHeading>
                    <div style={{
                      backgroundColor: "#0a0a0a",
                      border: "1px solid rgba(255,255,255,0.08)",
                      borderRadius: "16px", marginBottom: "20px", overflow: "hidden",
                    }}>
                      {[
                        { label: "Reason",  value: CONTACT_REASONS.find(r => r.value === formData.reason)?.label ?? formData.reason },
                        { label: "Name",    value: formData.name },
                        { label: "Email",   value: formData.email },
                        { label: "Message", value: formData.message },
                      ].map(({ label, value }, i, arr) => (
                        <div key={label} style={{ display: "flex", borderBottom: i < arr.length - 1 ? "1px solid rgba(255,255,255,0.06)" : "none" }}>
                          <div style={{
                            width: "90px", flexShrink: 0, padding: "14px 16px",
                            backgroundColor: "rgba(139,92,246,0.06)",
                            borderRight: "1px solid rgba(255,255,255,0.06)",
                            color: "rgba(139,92,246,0.85)", fontSize: "11px",
                            fontWeight: 700, letterSpacing: "1.5px", textTransform: "uppercase",
                            display: "flex", alignItems: "flex-start", paddingTop: "15px",
                          }}>
                            {label}
                          </div>
                          <div style={{ padding: "14px 16px", color: "rgba(255,255,255,0.8)", fontSize: "15px", lineHeight: "1.6", flex: 1 }}>
                            {value}
                          </div>
                        </div>
                      ))}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <Send size={13} style={{ color: "rgba(255,255,255,0.3)" }} />
                      <p style={{ color: "rgba(255,255,255,0.3)", fontSize: "13px", margin: 0 }}>
                        Clicking Complete opens your email client with this prefilled.
                      </p>
                    </div>
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