"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useTranslations } from "next-intl";

type LevelCompleteProps = {
  open: boolean;
  levelId: number;
  onClose: () => void;
};

export function LevelCompleteCelebration({
  open,
  levelId,
  onClose,
}: LevelCompleteProps) {
  const t = useTranslations("cursos");

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="cursos-celebrate-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="cursos-celebrate-title"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="cursos-celebrate-modal"
            initial={{ scale: 0.5, opacity: 0, y: 40 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.85, opacity: 0, y: 20 }}
            transition={{ type: "spring", stiffness: 320, damping: 22 }}
            onClick={(e) => e.stopPropagation()}
          >
            <motion.div
              className="cursos-celebrate-modal__burst"
              initial={{ scale: 0 }}
              animate={{ scale: [0, 1.2, 1] }}
              transition={{ duration: 0.55, ease: "easeOut" }}
              aria-hidden
            />
            <motion.span
              className="cursos-celebrate-modal__icon"
              initial={{ rotate: -20, scale: 0 }}
              animate={{ rotate: 0, scale: 1 }}
              transition={{ type: "spring", delay: 0.1, stiffness: 400 }}
              aria-hidden
            >
              ✓
            </motion.span>
            <h2 id="cursos-celebrate-title" className="cursos-celebrate-modal__title">
              {t("celebrationTitle")}
            </h2>
            <p className="cursos-celebrate-modal__sub">
              {t("celebrationLevelSubtitle", { level: levelId })}
            </p>
            <button type="button" className="cursos-btn-primary" onClick={onClose}>
              {t("celebrationClose")}
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function StepPassedBurst({ active }: { active: boolean }) {
  if (!active) return null;
  return (
    <motion.span
      className="cursos-step-burst"
      aria-hidden
      initial={{ scale: 0.4, opacity: 0.9 }}
      animate={{ scale: 2.2, opacity: 0 }}
      transition={{ duration: 0.65, ease: "easeOut" }}
    />
  );
}
