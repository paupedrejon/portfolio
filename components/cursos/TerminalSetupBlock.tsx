"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

const COMMANDS = `npm install
npm run dev`;

export default function TerminalSetupBlock() {
  const t = useTranslations("cursos");
  const [copied, setCopied] = useState(false);

  async function copyAll() {
    try {
      await navigator.clipboard.writeText(COMMANDS);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  }

  return (
    <div className="cursos-terminal-block">
      <h3 className="cursos-terminal-block__title">{t("terminalSetupTitle")}</h3>
      <p className="cursos-terminal-block__intro">{t("terminalSetupIntro")}</p>
      <p className="cursos-terminal-block__npm">{t("terminalNpmHint")}</p>
      <div className="cursos-terminal-block__code-wrap">
        <pre className="cursos-terminal-block__code">
          <code>{COMMANDS}</code>
        </pre>
        <button type="button" className="cursos-terminal-block__copy" onClick={copyAll}>
          {copied ? t("terminalCopied") : t("terminalCopy")}
        </button>
      </div>
      <p className="cursos-terminal-block__note">{t("terminalAutoCheckNote")}</p>
    </div>
  );
}
