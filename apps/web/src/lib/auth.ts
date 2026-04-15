import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    GitHub({
      clientId: process.env.GITHUB_CLIENT_ID ?? "",
      clientSecret: process.env.GITHUB_CLIENT_SECRET ?? ""
    })
  ],
  trustHost: true,
  session: {
    strategy: "jwt"
  },
  pages: {
    signIn: "/"
  },
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "github" && account.access_token) {
        // Store GitHub access token in JWT
        return true;
      }
      return true;
    },
    async jwt({ token, account }) {
      // Add access token to JWT
      if (account?.access_token) {
        token.accessToken = account.access_token;
      }
      return token;
    },
    async session({ session, token }) {
      // Add access token to session
      if (session.user) {
        session.accessToken = token.accessToken as string;
      }
      return session;
    }
  }
});
