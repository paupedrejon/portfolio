"use client";

import { useTranslations } from "next-intl";
import { Download } from "lucide-react";

type GuidePreviewProps = {
  html: string | null;
  title: string | null;
  loading: boolean;
  onPrint?: () => void;
  onDownloadHtml: () => void;
  /** Full-bleed iframe under the chrome of the page */
  fullscreen?: boolean;
  hideToolbar?: boolean;
};

export default function GuidePreview({
  html,
  title,
  loading,
  onDownloadHtml,
  fullscreen = false,
  hideToolbar = false,
}: GuidePreviewProps) {
  const t = useTranslations("viajes");

  return (
    <section
      className={`viajes-guide${fullscreen ? " viajes-guide--fs" : ""}`}
      aria-labelledby="viajes-preview-title"
    >
      {!hideToolbar && (
        <div className="viajes-guide__toolbar">
          <div>
            <h2 id="viajes-preview-title" className="viajes-guide__title">
              {title || t("previewTitlePlain")}
            </h2>
            {!html && (
              <p className="viajes-guide__hint">{t("previewHint")}</p>
            )}
          </div>
          {html && (
            <div className="viajes-actions">
              <button
                type="button"
                className="viajes-iconbtn viajes-iconbtn--primary"
                disabled={loading}
                onClick={onDownloadHtml}
                aria-label={t("actions.downloadHtml")}
                title={t("actions.downloadHtml")}
              >
                <Download size={18} aria-hidden />
              </button>
            </div>
          )}
        </div>
      )}
      {hideToolbar && (
        <h2 id="viajes-preview-title" className="sr-only">
          {title || t("previewTitlePlain")}
        </h2>
      )}

      {!html && !loading && (
        <div className="viajes-empty">
          <strong>{t("emptyTitle")}</strong>
          <span>{t("emptyBody")}</span>
        </div>
      )}
      {loading && !html && (
        <div className="viajes-empty">
          <strong>{t("actions.generating")}</strong>
          <span>{t("generatingHint")}</span>
        </div>
      )}
      {html && (
        <div className="viajes-guide__frame">
          <iframe
            title={title || t("previewFrameTitle")}
            srcDoc={html}
            allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
            referrerPolicy="strict-origin-when-cross-origin"
            sandbox="allow-same-origin allow-scripts allow-popups allow-popups-to-escape-sandbox allow-modals"
          />
        </div>
      )}
    </section>
  );
}
