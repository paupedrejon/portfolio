import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase/admin";

const clientId = process.env.GOOGLE_CLIENT_ID?.trim() || "";
const clientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim() || "";
const secret = process.env.NEXTAUTH_SECRET?.trim() || "";

export const authOptions = {
  providers: [
    GoogleProvider({
      clientId,
      clientSecret,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
        },
      },
    }),
  ],
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
  callbacks: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async signIn({ user }: { user?: any }) {
      if (user?.id && isSupabaseConfigured()) {
        try {
          const supabase = getSupabaseAdmin();
          await supabase.from("profiles").upsert(
            {
              user_id: user.id,
              display_name: user.name ?? null,
              avatar_url: user.image ?? null,
              updated_at: new Date().toISOString(),
            },
            { onConflict: "user_id" }
          );
        } catch (e) {
          console.error("Error upserting profile:", e);
        }
      }
      return true;
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async redirect({ url, baseUrl }: any) {
      if (url.includes("/auth/signin")) {
        return `${baseUrl}/study-agents`;
      }
      if (url.includes("/cursos")) {
        if (url.startsWith("/")) return `${baseUrl}${url}`;
        return url;
      }
      if (url.startsWith("/")) {
        return `${baseUrl}${url}`;
      }
      try {
        const urlObj = new URL(url);
        if (urlObj.origin === baseUrl) {
          return url;
        }
      } catch {
        /* invalid url */
      }
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
    strategy: "jwt" as const,
    maxAge: 30 * 24 * 60 * 60,
    updateAge: 24 * 60 * 60,
  },
  jwt: {
    maxAge: 30 * 24 * 60 * 60,
  },
};

export const { handlers, auth, signIn, signOut } = NextAuth(authOptions);
