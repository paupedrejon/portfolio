"use client";

export type SkillCardItem = {
  name: string;
  category: string;
  icon: string;
  description: string;
  abbreviation?: string;
};

interface SkillCardProps {
  skill: SkillCardItem;
  onOpen: (skill: SkillCardItem) => void;
}

export function SkillCard({ skill, onOpen }: SkillCardProps) {
  return (
    <button type="button" className="skills-card" onClick={() => onOpen(skill)}>
      <div className="skills-card__icon">
        {skill.icon ? (
          <img src={skill.icon} alt="" className="skills-card__icon-img" />
        ) : (
          <span className="skills-card__abbr">{skill.abbreviation}</span>
        )}
      </div>
      <div className="skills-card__body">
        <h3 className="skills-card__name">{skill.name}</h3>
        <p className="skills-card__category">{skill.category}</p>
      </div>
    </button>
  );
}
