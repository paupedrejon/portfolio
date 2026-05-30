"use client";

import { useRef } from "react";
import { useTranslations } from "next-intl";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";

type Props = {
  displayName: string;
  issuedAt: string;
};

const CERT_WIDTH = 800;
const CERT_HEIGHT = 560;

async function captureCertificate(node: HTMLDivElement) {
  const logo = node.querySelector("img");
  if (logo && !logo.complete) {
    await new Promise<void>((resolve, reject) => {
      logo.onload = () => resolve();
      logo.onerror = () => reject(new Error("Logo load failed"));
    });
  }

  const prev = {
    width: node.style.width,
    height: node.style.height,
    maxWidth: node.style.maxWidth,
  };
  node.style.width = `${CERT_WIDTH}px`;
  node.style.height = `${CERT_HEIGHT}px`;
  node.style.maxWidth = `${CERT_WIDTH}px`;

  try {
    return await html2canvas(node, {
      backgroundColor: "#ffffff",
      scale: 2,
      useCORS: true,
      allowTaint: false,
      width: CERT_WIDTH,
      height: CERT_HEIGHT,
    });
  } finally {
    node.style.width = prev.width;
    node.style.height = prev.height;
    node.style.maxWidth = prev.maxWidth;
  }
}

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
    const canvas = await captureCertificate(ref.current);
    const link = document.createElement("a");
    link.download = `diploma-react-${displayName.replace(/\s+/g, "-")}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  }

  async function downloadPdf() {
    if (!ref.current) return;
    const canvas = await captureCertificate(ref.current);
    const img = canvas.toDataURL("image/png");
    const pdf = new jsPDF({
      orientation: "landscape",
      unit: "px",
      format: [CERT_WIDTH, CERT_HEIGHT],
    });
    pdf.addImage(img, "PNG", 0, 0, CERT_WIDTH, CERT_HEIGHT);
    pdf.save(`diploma-react-${displayName.replace(/\s+/g, "-")}.pdf`);
  }

  return (
    <div className="cursos-diploma-generator">
      <div className="cursos-diploma-generator__preview">
        <div ref={ref} className="cursos-diploma-cert">
          <div className="cursos-diploma-cert__frame" aria-hidden />
          <div className="cursos-diploma-cert__corner cursos-diploma-cert__corner--tl" aria-hidden />
          <div className="cursos-diploma-cert__corner cursos-diploma-cert__corner--tr" aria-hidden />
          <div className="cursos-diploma-cert__corner cursos-diploma-cert__corner--bl" aria-hidden />
          <div className="cursos-diploma-cert__corner cursos-diploma-cert__corner--br" aria-hidden />

          <img
            src="/logo.svg"
            alt=""
            width={72}
            height={72}
            crossOrigin="anonymous"
            className="cursos-diploma-cert__logo"
          />

          <p className="cursos-diploma-cert__label">Certificado de finalización</p>

          <h2 className="cursos-diploma-cert__title">
            Curso de <span>React</span>
          </h2>

          <p className="cursos-diploma-cert__issuer">{t("diplomaSubtitle")}</p>

          <div className="cursos-diploma-cert__divider" aria-hidden />

          <p className="cursos-diploma-cert__intro">Se certifica que</p>
          <p className="cursos-diploma-cert__name">{displayName}</p>
          <p className="cursos-diploma-cert__body">
            ha completado con éxito los 30 niveles del curso
          </p>

          <p className="cursos-diploma-cert__date">{dateStr}</p>
          <p className="cursos-diploma-cert__site">paupedrejon.com</p>
        </div>
      </div>

      <div className="cursos-diploma-generator__actions">
        <button type="button" onClick={downloadPng} className="cursos-btn-primary">
          {t("diplomaDownloadPng")}
        </button>
        <button type="button" onClick={downloadPdf} className="cursos-btn-outline">
          {t("diplomaDownloadPdf")}
        </button>
      </div>
    </div>
  );
}
