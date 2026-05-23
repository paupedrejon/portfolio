"use client";

import EgoPillButton from "./EgoPillButton";

type Props = {
  href?: string;
  label: string;
  className?: string;
};

const APK_HREF = "/e-Go.apk";

export default function EgoDownloadButton({
  href = APK_HREF,
  label,
  className = "",
}: Props) {
  return (
    <EgoPillButton href={href} download variant="primary" className={className}>
      <span>{label}</span>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="7 10 12 15 17 10" />
        <line x1="12" y1="15" x2="12" y2="3" />
      </svg>
    </EgoPillButton>
  );
}
