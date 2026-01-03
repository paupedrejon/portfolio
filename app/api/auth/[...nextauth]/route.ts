import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import type { NextRequest } from "next/server";

// Verificar que las variables de entorno estén cargadas
const clientId = process.env.GOOGLE_CLIENT_ID?.trim() || "";
const clientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim() || "";
const secret = process.env.NEXTAUTH_SECRET?.trim() || "";

// Log en desarrollo para debug
if (process.env.NODE_ENV === "development") {
  console.log("🔍 NextAuth Config:");
  console.log("  - Client ID:", clientId ? `${clientId.substring(0, 20)}...` : "❌ NO CONFIGURADO");
  console.log("  - Client Secret:", clientSecret ? "✅ Configurado" : "❌ NO CONFIGURADO");
  console.log("  - Secret:", secret ? "✅ Configurado" : "❌ NO CONFIGURADO");
  console.log("  - NEXTAUTH_URL:", process.env.NEXTAUTH_URL || "http://localhost:3000");
}

const authOptions = {
  providers: [
    GoogleProvider({
      clientId,
      clientSecret,
    }),
  ],
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      // Permitir el inicio de sesión
      return true;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub || "";
      }
      return session;
    },
    async jwt({ token, account, user }) {
      if (account) {
        token.accessToken = account.access_token;
      }
      if (user) {
        token.id = user.id;
      }
      return token;
    },
  },
  secret: secret || undefined,
  debug: process.env.NODE_ENV === "development",
};

const { handlers } = NextAuth(authOptions);

export const { GET, POST } = handlers;
