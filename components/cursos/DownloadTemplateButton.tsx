"use client";

import { signIn, useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import { usePathname } from "next/navigation";
import { useState } from "react";

export default function DownloadTemplateButton() {
  const t = useTranslations("cursos");
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDownload() {
    if (!session) {
      signIn("google", {
        callbackUrl: pathname || "/es/cursos/react",
      });
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/cursos/react/download", { method: "POST" });
      if (res.status === 503) {
        setError(t("supabaseNotConfigured"));
        return;
      }
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Error al descargar");
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "react-portfolio-starter.zip";
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        type="button"
        onClick={handleDownload}
        disabled={loading || status === "loading"}
        className="btn-primary text-lg px-10 py-4 disabled:opacity-60"
      >
        {loading
          ? t("downloading")
          : session
            ? t("downloadTemplate")
            : t("loginToDownload")}
      </button>
      {error && <p className="cursos-download-error">{error}</p>}
    </div>
  );
}
