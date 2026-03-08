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
      style={color && color !== "transparent" ? { background: color } : undefined}
      aria-label={`Scroll to ${targetId}`}
    >
      <div className="scroll-btn-icon" style={{ color: iconColor }}>
        <svg 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2.5" 
          strokeLinecap="round" 
          strokeLinejoin="round"
        >
          <path d="M7 8l5 5 5-5M7 13l5 5 5-5" />
        </svg>
      </div>
    </button>
  );
}
