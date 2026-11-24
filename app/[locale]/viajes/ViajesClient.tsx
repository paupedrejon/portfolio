"use client";

import TravelPlannerApp from "@/components/viajes/TravelPlannerApp";
import "../home.css";
import "../proyectos/proyectos.css";
import "./viajes.css";

export default function ViajesClient() {
  return (
    <div className="portfolio-page portfolio-page--cherry viajes-page">
      <TravelPlannerApp />
    </div>
  );
}
