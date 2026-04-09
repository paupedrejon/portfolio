// app/layout.tsx
import "./globals.css";
import { Analytics } from "@vercel/analytics/react";
import { Providers } from "./providers";
import ConditionalHeader from "@/components/ConditionalHeader";
import { spaceGrotesk, outfit, jetbrainsMono, leagueSpartan } from "./fonts";
import { FaGithub, FaLinkedin } from "react-icons/fa";
import { AiOutlineMail } from "react-icons/ai";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getLocale, getTranslations } from "next-intl/server";
import CustomCursor from "@/components/CustomCursor";
import HapticFeedback from "@/components/HapticFeedback";

export const metadata = {
  title: "Pau Pedrejon — Software Engineer & Developer",
  description: "Portfolio showcasing my projects, skills and experience as a software engineer specializing in game development, web applications, and creative technology.",
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
  const messages = await getMessages();
  const tFooter = await getTranslations("footer");

  return (
    <html
      lang={locale}
      className={`${spaceGrotesk.variable} ${outfit.variable} ${jetbrainsMono.variable} ${leagueSpartan.variable}`}
      suppressHydrationWarning
    >
      <body className="overflow-x-hidden w-full" suppressHydrationWarning>
        <Providers>
          <NextIntlClientProvider messages={messages} locale={locale}>
            <ConditionalHeader />

            <main className="pt-0 w-full">{children}</main>
            <CustomCursor />
            <HapticFeedback />

            {/* Footer */}
            <footer className="footer">
          <div className="footer-content">
            {/* Social Links */}
            <div className="footer-social">
              <a
                href="https://github.com/paupedrejon"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="GitHub"
              >
                <FaGithub size={20} />
              </a>
              <a
                href="https://es.linkedin.com/in/pau-pedrejon-sobrino-0b5643380"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="LinkedIn"
              >
                <FaLinkedin size={20} />
              </a>
              <a
                href="mailto:paupedrejon@gmail.com"
                aria-label="Email"
              >
                <AiOutlineMail size={20} />
              </a>
            </div>

            {/* Copyright */}
            <p className="footer-copyright">
              © {new Date().getFullYear()} Pau Pedrejon. {tFooter("craftedWithPassion")}
            </p>
          </div>
        </footer>

            <Analytics />
          </NextIntlClientProvider>
        </Providers>
      </body>
    </html>
  );
}
