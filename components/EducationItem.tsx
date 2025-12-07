// components/EducationItem.tsx
import React from "react";

interface EducationItemProps {
  icon: React.ReactNode;
  title: string;
  school: string;
  years: string;
  href?: string;
}

export default function EducationItem({ 
  icon, 
  title, 
  school, 
  years, 
  href 
}: EducationItemProps) {
  const content = (
    <>
      <div className="edu-left">
        <div className="edu-icon">
          {icon}
        </div>
        <div>
          <h3 className="edu-title" style={{ fontFamily: 'var(--font-body)' }}>
            {title}
          </h3>
          <p className="edu-sub" style={{ fontFamily: 'var(--font-body)' }}>
            {school}
          </p>
        </div>
      </div>
      <span className="edu-years" style={{ fontFamily: 'var(--font-mono)' }}>
        {years}
      </span>
    </>
  );

  if (href) {
    return (
      <a 
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="edu-card"
      >
        {content}
        <svg 
          className="ml-2 opacity-40 flex-shrink-0"
          width="16" 
          height="16" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2"
        >
          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
          <polyline points="15 3 21 3 21 9" />
          <line x1="10" y1="14" x2="21" y2="3" />
        </svg>
      </a>
    );
  }

  return (
    <div className="edu-card">
      {content}
    </div>
  );
}
