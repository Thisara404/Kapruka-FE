import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          const res = await fetch(`${BACKEND_URL}/api/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: credentials.email,
              password: credentials.password,
            }),
          });
          const data = await res.json();
          if (res.ok && data.token) {
            return {
              id: data.user.id,
              email: data.user.email,
              name: data.user.name,
              image: data.user.image,
              accessToken: data.token,
            };
          }
          return null;
        } catch (error) {
          console.error("[Auth FE] Error during credentials authorize:", error);
          return null;
        }
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id;
        if (account?.provider === "google") {
          try {
            // Register/sync Google user in NestJS backend
            const res = await fetch(`${BACKEND_URL}/api/auth/google-login`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                email: user.email,
                name: user.name,
                image: user.image,
              }),
            });
            const data = await res.json();
            if (res.ok && data.token) {
              token.accessToken = data.token;
              token.id = data.user.id;
            }
          } catch (googleErr) {
            console.error("[Auth FE] Google login sync failed:", googleErr);
          }
        } else if ((user as any).accessToken) {
          token.accessToken = (user as any).accessToken;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        (session as any).accessToken = token.accessToken as string;
      }
      return session;
    },
  },
  secret: process.env.AUTH_SECRET,
});

