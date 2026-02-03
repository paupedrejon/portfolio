import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";

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
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code"
        }
      }
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async redirect({ url, baseUrl }: any) {
      // Evitar loops: si la URL es la página de signin, redirigir a /study-agents
      if (url.includes("/auth/signin")) {
        return `${baseUrl}/study-agents`;
      }
      
      // Si la URL es relativa, construir la URL completa
      if (url.startsWith("/")) {
        return `${baseUrl}${url}`;
      }
      
      // Si la URL es absoluta y del mismo origen, permitirla
      try {
        const urlObj = new URL(url);
        if (urlObj.origin === baseUrl) {
          return url;
        }
      } catch {
        // Si no es una URL válida, usar la base URL
      }
      
      // Por defecto, redirigir a /study-agents
      return `${baseUrl}/study-agents`;
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async session({ session, token }: any) {
      if (session.user) {
        session.user.id = token.sub || "";
      }
      return session;
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async jwt({ token, account, user }: any) {
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
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 días
    updateAge: 24 * 60 * 60, // Actualizar cada 24 horas
  },
  jwt: {
    maxAge: 30 * 24 * 60 * 60, // 30 días
  },
};

const { handlers } = NextAuth(authOptions);

export const { GET, POST } = handlers;
