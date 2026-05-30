"use client";

import { useRef } from "react";
import { useTranslations } from "next-intl";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";

type Props = {
  displayName: string;
  issuedAt: string;
};

export default function DiplomaGenerator({ displayName, issuedAt }: Props) {
  const t = useTranslations("cursos");
  const ref = useRef<HTMLDivElement>(null);

  const dateStr = new Date(issuedAt).toLocaleDateString("es-ES", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  async function downloadPng() {
    if (!ref.current) return;
    const canvas = await html2canvas(ref.current, {
      backgroundColor: "#0a0a0f",
      scale: 2,
    });
    const link = document.createElement("a");
    link.download = `diploma-react-${displayName.replace(/\s+/g, "-")}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  }

  async function downloadPdf() {
    if (!ref.current) return;
    const canvas = await html2canvas(ref.current, {
      backgroundColor: "#0a0a0f",
      scale: 2,
    });
    const img = canvas.toDataURL("image/png");
    const pdf = new jsPDF({ orientation: "landscape", unit: "px", format: [800, 560] });
    pdf.addImage(img, "PNG", 0, 0, 800, 560);
    pdf.save(`diploma-react-${displayName.replace(/\s+/g, "-")}.pdf`);
  }

  return (
    <div className="flex flex-col items-center gap-8">
      <div
        ref={ref}
        className="w-full max-w-3xl aspect-[800/560] rounded-2xl border-2 border-indigo-500/40 p-12 flex flex-col items-center justify-center text-center relative overflow-hidden"
        style={{
          background:
            "radial-gradient(ellipse at 50% 30%, rgba(99,102,241,0.15) 0%, #0a0a0f 70%)",
        }}
      >
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage:
              "linear-gradient(rgba(99,102,241,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.3) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />
        <p className="text-sm uppercase tracking-[0.3em] text-indigo-400 relative z-10 mb-4">
          Certificado de finalización
        </p>
        <h2 className="text-3xl md:text-4xl font-bold gradient-text relative z-10 mb-2">
          Curso de REACT
        </h2>
        <p className="text-lg text-violet-300 relative z-10 mb-8">{t("diplomaSubtitle")}</p>
        <p className="text-[var(--text-muted)] relative z-10 mb-2">Se certifica que</p>
        <p className="text-4xl md:text-5xl font-bold text-white relative z-10 mb-8">
          {displayName}
        </p>
        <p className="text-[var(--text-secondary)] relative z-10">
          ha completado con éxito los 30 niveles del curso
        </p>
        <p className="text-sm text-[var(--text-muted)] relative z-10 mt-8">{dateStr}</p>
      </div>

      <div className="flex flex-wrap gap-4 justify-center">
        <button type="button" onClick={downloadPng} className="btn-primary">
          {t("diplomaDownloadPng")}
        </button>
        <button type="button" onClick={downloadPdf} className="btn-secondary">
          {t("diplomaDownloadPdf")}
        </button>
      </div>
    </div>
  );
}
