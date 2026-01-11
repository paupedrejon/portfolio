// app/layout.tsx
import "./globals.css";
import { Analytics } from "@vercel/analytics/react";
import { Providers } from "./providers";
import Header from "@/components/Header";
import { spaceGrotesk, outfit, jetbrainsMono } from "./fonts";
import { FaGithub, FaLinkedin } from "react-icons/fa";
import { AiOutlineMail } from "react-icons/ai";

export const metadata = {
  title: "Pau Pedrejon — Software Engineer & Developer",
  description: "Portfolio showcasing my projects, skills and experience as a software engineer specializing in game development, web applications, and creative technology.",
  icons: {
    icon: '/LOGO_portfolio.png',
    shortcut: '/LOGO_portfolio.png',
    apple: '/LOGO_portfolio.png',
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html 
      lang="en" 
      className={`${spaceGrotesk.variable} ${outfit.variable} ${jetbrainsMono.variable}`}
    >
      <body className="overflow-x-hidden w-full">
        <Providers>
        <Header />
        
        <main className="pt-0 w-full">
          {children}
        </main>

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
              © {new Date().getFullYear()} Pau Pedrejon. Crafted with passion.
            </p>
          </div>
        </footer>

        <Analytics />
        </Providers>
      </body>
    </html>
  );
}
