import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";

declare module "next-auth" {
  interface Session {
    accessToken?: string;
    userId?: string;
  }

  interface JWT {
    accessToken?: string;
    userId?: string;
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    GitHub({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: "repo read:org user:email"
        }
      }
    })
  ],
  trustHost: true,
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt"
  },
  pages: {
    signIn: "/login"
  },
  callbacks: {
    async signIn({ user, account }) {
      if (!account?.access_token) return false;

      const backendBaseUrl = process.env.API_BASE_URL;
      if (!backendBaseUrl) {
        return true;
      }

      // Let frontend OAuth succeed even if backend sync is not ready yet.
      try {
        const response = await fetch(`${backendBaseUrl}/api/auth/github/callback`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user: {
              email: user.email,
              name: user.name,
              image: user.image
            },
            account: {
              access_token: account.access_token,
              refresh_token: account.refresh_token,
              expires_at: account.expires_at
            }
          })
        });

        if (!response.ok) {
          console.error("Failed to sync GitHub session with backend", response.status);
          return true;
        }

        const data = (await response.json()) as { userId?: string };
        if (data.userId) {
          user.id = data.userId;
        }
      } catch (error) {
        console.error("Auth callback error:", error);
      }

      return true;
    },

    async jwt({ token, account, user }) {
      if (account) {
        token.accessToken = account.access_token;
      }
      if (user) {
        token.userId = user.id;
      }
      return token;
    },

    async session({ session, token }) {
      if (token.accessToken) {
        session.accessToken = String(token.accessToken);
      }
      if (token.userId) {
        session.userId = String(token.userId);
      }
      return session;
    }
  }
});
