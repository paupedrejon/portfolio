"use client";

interface CurriculumButtonProps {
  href: string;
  label?: string;
}

function DownloadIcon({ size = 16 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}

export default function CurriculumButton({ 
  href, 
  label = "Download CV"
}: CurriculumButtonProps) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="cv-download-btn"
    >
      <span className="cv-btn-text">
        <DownloadIcon size={16} />
        {label}
      </span>
    </a>
  );
}
