"use client";

import { useState } from "react";

interface ScrollButtonProps {
  targetId: string;
  color?: string;
  iconColor?: string;
}

export default function ScrollButton({ 
  targetId, 
  color = "transparent", 
  iconColor = "var(--text-secondary)" 
}: ScrollButtonProps) {
  const [clicked, setClicked] = useState(false);

  const handleClick = () => {
    setClicked(true);
    setTimeout(() => setClicked(false), 500);
    
    const target = document.getElementById(targetId);
    if (target) {
      target.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`scroll-btn ${clicked ? "clicked" : ""}`}
      style={{ background: color }}
      aria-label={`Scroll to ${targetId}`}
    >
      <svg 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke={iconColor} 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      >
        <path d="M12 5v14M5 12l7 7 7-7" />
      </svg>
    </button>
  );
}
