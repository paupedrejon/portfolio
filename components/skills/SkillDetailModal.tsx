"use client";

import { X } from "lucide-react";

type SkillDetailModalProps = {
  skill: {
    name: string;
    category: string;
    icon: string;
    description: string;
    abbreviation?: string;
  };
  onClose: () => void;
};

export default function SkillDetailModal({ skill, onClose }: SkillDetailModalProps) {
  return (
    <div className="skills-modal" onClick={onClose} role="presentation">
      <div
        className="skills-modal__panel"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="skills-modal-title"
      >
        <header className="skills-modal__header">
          <div className="skills-modal__icon">
            {skill.icon ? (
              <img src={skill.icon} alt="" className="skills-modal__icon-img" />
            ) : (
              <span className="skills-modal__abbr">{skill.abbreviation}</span>
            )}
          </div>
          <button
            type="button"
            className="skills-modal__close"
            onClick={onClose}
            aria-label="Cerrar"
          >
            <X size={20} strokeWidth={2} aria-hidden />
          </button>
        </header>

        <p className="skills-modal__category">{skill.category}</p>
        <h2 id="skills-modal-title" className="skills-modal__title">
          {skill.name}
        </h2>
        <div className="skills-modal__divider" aria-hidden />
        <p className="skills-modal__desc">{skill.description}</p>
      </div>
    </div>
  );
}
