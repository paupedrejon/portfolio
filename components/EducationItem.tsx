"use client";
import React from "react";
import { Poppins, Roboto_Mono } from "next/font/google";

const poppins = Poppins({ subsets: ["latin"], weight: ["600", "800"] });
const robotoMono = Roboto_Mono({ subsets: ["latin"], weight: ["400", "700"] });

type Props = {
  icon?: React.ReactNode;
  title: string;          // Bachelor’s degree in…
  school: string;         // UPC…
  years?: string;         // 2023–2027*
  note?: string;          // opcional: “Minor…”, etc.
};

export default function EducationItem({ icon, title, school, years, note }: Props) {
  return (
    <div className="edu-card">
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
