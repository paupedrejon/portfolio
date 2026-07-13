// app/fonts.ts
import {
  Space_Grotesk,
  JetBrains_Mono,
  Outfit,
  League_Spartan,
  Quicksand,
  Bebas_Neue,
  Playfair_Display,
} from "next/font/google";

// Display font - Bold, modern, geometric
export const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--font-display",
});

// Body font - Clean, readable
export const outfit = Outfit({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  display: "swap",
  variable: "--font-body",
});

// Mono font - Technical, code-like
export const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--font-mono",
});

// League Spartan - Hero name
export const leagueSpartan = League_Spartan({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
  variable: "--font-league-spartan",
});

// Monolínea para capa neón del hero (tubo fino Canva-style)
export const quicksand = Quicksand({
  subsets: ["latin"],
  weight: ["300"],
  display: "swap",
  variable: "--font-quicksand",
});

export const bebasNeue = Bebas_Neue({
  subsets: ["latin"],
  weight: ["400"],
  display: "swap",
  variable: "--font-bebas-neue",
});

export const playfairDisplay = Playfair_Display({
  subsets: ["latin"],
  weight: ["700", "900"],
  display: "swap",
  variable: "--font-playfair",
});

// Legacy export for compatibility
export const din = outfit;
