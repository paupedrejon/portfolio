"use client";
import React, { useCallback, useRef } from "react";
import { Poppins } from "next/font/google";

const poppins = Poppins({ subsets: ["latin"], weight: ["400", "600", "800"] });

type Props = {
  href: string;
  text?: string;
  bgColor?: string;   // fondo
  textColor?: string; // texto
};

export default function CurriculumButton({
  href="/PauPedrejonCV.pdf",
  text = "SEE CURRICULUM",
  bgColor = "#415ac9",
  textColor = "#fff",

}: Props) {
  const ref = useRef<HTMLAnchorElement>(null);

  const handleClick = useCallback(() => {
    const btn = ref.current;
    if (btn) {
      btn.classList.add("clicked");
      setTimeout(() => btn.classList.remove("clicked"), 450);
    }
  }, []);

  return (
    <div className="scroll-wrap" style={{ marginTop: "2rem" }}>
      <a
        ref={ref}
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        onClick={handleClick}
        className={`curriculum-btn ${poppins.className}`} // 👈 usa Poppins
        style={{
          background: bgColor,
          color: textColor,
        }}
      >
        {text}
      </a>
    </div>
  );
}
