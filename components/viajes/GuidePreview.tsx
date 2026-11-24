"use client";

import { useTranslations } from "next-intl";

type GuidePreviewProps = {
  html: string | null;
  title: string | null;
  loading: boolean;
  onPrint: () => void;
  onDownloadHtml: () => void;
  compact?: boolean;
};

export default function GuidePreview({
  html,
  title,
  loading,
  onPrint,
  onDownloadHtml,
  compact = false,
}: GuidePreviewProps) {
  const t = useTranslations("viajes");

  return (
    <section
      className={`viajes-guide${compact ? " viajes-guide--compact" : ""}`}
      aria-labelledby="viajes-preview-title"
    >
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
              className="viajes-btn viajes-btn--ghost"
              disabled={loading}
              onClick={onPrint}
            >
              {t("actions.print")}
            </button>
            <button
              type="button"
              className="viajes-btn viajes-btn--primary"
              disabled={loading}
              onClick={onDownloadHtml}
            >
              {t("actions.downloadHtml")}
            </button>
          </div>
        )}
      </div>

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
            sandbox="allow-same-origin allow-modals"
          />
        </div>
      )}
    </section>
  );
}
