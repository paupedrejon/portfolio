"use client";

import { usePathname } from "next/navigation";
import { FaGithub, FaLinkedin } from "react-icons/fa";
import { AiOutlineMail } from "react-icons/ai";
import { CONTACT_EMAIL, GITHUB_URL, LINKEDIN_URL } from "@/lib/seo/config";

export default function ConditionalFooter() {
  const pathname = usePathname();

  if (pathname?.startsWith("/study-agents")) {
    return null;
  }

  const locale = pathname?.match(/^\/(es|en|it)(?=\/|$)/)?.[1] ?? "es";
  const crafted =
    locale === "en"
      ? "Crafted with passion"
      : locale === "it"
        ? "Realizzato con passione"
        : "Hecho con pasión";
  const privacy =
    locale === "en" ? "Privacy" : locale === "it" ? "Privacy" : "Privacidad";

  return (
    <footer className="footer">
      <div className="footer-content">
        <div className="footer-social">
          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="GitHub"
          >
            <FaGithub size={20} />
          </a>
          <a
            href={LINKEDIN_URL}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="LinkedIn"
          >
            <FaLinkedin size={20} />
          </a>
          <a href={`mailto:${CONTACT_EMAIL}`} aria-label="Email">
            <AiOutlineMail size={20} />
          </a>
        </div>
        <p className="footer-copyright">
          © {new Date().getFullYear()} Pau Pedrejon. {crafted}
          {" · "}
          <a href={`/${locale}/privacy`} className="footer-legal-link">
            {privacy}
          </a>
          {" · "}
          <a href={`/${locale}/blog`} className="footer-legal-link">
            Blog
          </a>
        </p>
      </div>
    </footer>
  );
}
