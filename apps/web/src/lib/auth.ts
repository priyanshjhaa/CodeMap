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
    signIn: "/"
  },
  callbacks: {
    async signIn({ user, account }) {
      if (!account?.access_token) return false;

      // Sync with backend
      try {
        const response = await fetch(`${process.env.API_BASE_URL}/api/auth/github/callback`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
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
          }),
          credentials: 'include'
        });

        if (!response.ok) {
          console.error('Failed to sync with backend');
          return false;
        }

        const data = await response.json();
        // Store userId in token for session callback
        user.id = data.userId;

        return true;
      } catch (error) {
        console.error('Auth callback error:', error);
        return false;
      }
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
