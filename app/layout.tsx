// app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";
import "./section-pages.css";
import VercelAnalyticsGate from "@/components/analytics/VercelAnalyticsGate";
import { Providers } from "./providers";
import { spaceGrotesk, outfit, jetbrainsMono, leagueSpartan, quicksand } from "./fonts";
import { FaGithub, FaLinkedin } from "react-icons/fa";
import { AiOutlineMail } from "react-icons/ai";
import { getLocale, getTranslations } from "next-intl/server";
import HapticsRoot from "@/components/HapticsRoot";
import { CONTACT_EMAIL, GITHUB_URL, LINKEDIN_URL, DEFAULT_OG_IMAGE, SITE_NAME, SITE_URL } from "@/lib/seo/config";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} — Software Engineer & Developer`,
    template: "%s",
  },
  description:
    "Full-Stack Software Engineer portfolio — React, Node.js, AI. Real production projects, professional experience, and open to opportunities in Barcelona and remote.",
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    images: [{ url: DEFAULT_OG_IMAGE }],
  },
  twitter: {
    card: "summary_large_image",
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: '/Favicon.png', sizes: 'any', type: 'image/png' },
      { url: '/Favicon32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/Favicon16x16.png', sizes: '16x16', type: 'image/png' },
    ],
    shortcut: '/Favicon.png',
    apple: '/Favicon.png',
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await getLocale();
  const tFooter = await getTranslations("footer");

  return (
    <html
      lang={locale}
      className={`${spaceGrotesk.variable} ${outfit.variable} ${jetbrainsMono.variable} ${leagueSpartan.variable} ${quicksand.variable}`}
      suppressHydrationWarning
    >
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Playfair+Display:wght@700;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="overflow-x-hidden w-full" suppressHydrationWarning>
        <HapticsRoot />
        <Providers>
          {children}

          {/* Footer */}
          <footer className="footer">
          <div className="footer-content">
            {/* Social Links */}
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
              <a
                href={`mailto:${CONTACT_EMAIL}`}
                aria-label="Email"
              >
                <AiOutlineMail size={20} />
              </a>
            </div>

            {/* Copyright */}
            <p className="footer-copyright">
              © {new Date().getFullYear()} Pau Pedrejon. {tFooter("craftedWithPassion")}
              {" · "}
              <a href={`/${locale}/privacy`} className="footer-legal-link">
                {tFooter("privacy")}
              </a>
            </p>
          </div>
        </footer>

          <VercelAnalyticsGate />
        </Providers>
      </body>
    </html>
  );
}
