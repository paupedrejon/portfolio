"use client";

import { useState } from "react";

interface CurriculumButtonProps {
  href: string;
  bgColor?: string;
  textColor?: string;
  label?: string;
}

export default function CurriculumButton({ 
  href, 
  bgColor = "var(--accent-primary)", 
  textColor = "#ffffff",
  label = "Download CV"
}: CurriculumButtonProps) {
  const [clicked, setClicked] = useState(false);

  const handleClick = () => {
    setClicked(true);
    setTimeout(() => setClicked(false), 500);
  };

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={handleClick}
      className={`curriculum-btn ${clicked ? "clicked" : ""}`}
      style={{ 
        background: bgColor.includes('gradient') ? bgColor : `linear-gradient(135deg, ${bgColor}, ${bgColor})`,
        color: textColor 
      }}
    >
      <svg 
        width="18" 
        height="18" 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="7 10 12 15 17 10" />
        <line x1="12" y1="15" x2="12" y2="3" />
      </svg>
      {label}
    </a>
  );
}
