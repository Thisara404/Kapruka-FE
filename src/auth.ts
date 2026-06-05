import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        name: { label: "Name", type: "text" },
        image: { label: "Image", type: "text" },
        isFirebase: { label: "IsFirebase", type: "text" },
      },
      async authorize(credentials) {
        // Firebase Login / Registration Verification Pathway
        if (credentials?.isFirebase === "true") {
          try {
            const res = await fetch(`${BACKEND_URL}/api/auth/google-login`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                email: credentials.email,
                name: credentials.name || credentials.email,
                image: credentials.image || undefined,
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
            console.error("[Auth FE] Error during Firebase authentication sync:", error);
            return null;
          }
        }

        // Standard direct Email/Password Verification Pathway (used when testing without Firebase)
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
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        if ((user as any).accessToken) {
          token.accessToken = (user as any).accessToken;
        }
        // Explicitly preserve name and profile picture from the provider
        if (user.name) token.name = user.name;
        if (user.image) token.picture = user.image;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        (session as any).accessToken = token.accessToken as string;
        // Restore name and picture from token
        if (token.name) session.user.name = token.name as string;
        if (token.picture) session.user.image = token.picture as string;
      }
      return session;
    },
  },
  secret: process.env.AUTH_SECRET,
});

