"use client";
import React,{ useCallback, useRef } from "react";
import { Poppins, Roboto_Mono } from "next/font/google";
import ScrollButton from "@/components/ScrollButton";   




const poppins = Poppins({ subsets: ["latin"], weight: ["600", "800"] });
const robotoMono = Roboto_Mono({ subsets: ["latin"], weight: ["400", "700"] });

type Props = {
  icon?: React.ReactNode;
  title: string;          // Bachelor’s degree in…
  school: string;         // UPC…
  years?: string;         // 2023–2027*
  note?: string;          // opcional: “Minor…”, etc.
  href?: string;
};

export default function EducationItem({ icon, title, school, years, note, href }: Props) {
  const ref = useRef<HTMLAnchorElement>(null);
  
    const handleClick = useCallback(() => {
      const btn = ref.current;
      if (btn) {
        btn.classList.add("clicked");
        setTimeout(() => btn.classList.remove("clicked"), 450);
      }
    }, []);

  return (
    <div className="edu-card" >
      <div className="edu-left">
        
        {icon && <div className="edu-icon">{icon}</div>}
        <div className="edu-text">
          <p className={`${poppins.className} edu-sub`}>{school}</p>
          <h3 className={`${robotoMono.className} edu-title`}>{title}</h3>


      

          
          {note ? <p className="edu-note">{note}</p> : null}
        </div>
        
      </div>

      {years ? (
        <div className={`${robotoMono.className} edu-years`}>
          {years}
          
          
        </div>
      ) : null}
      
      
    </div>
  );
}
