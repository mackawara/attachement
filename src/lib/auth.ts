import NextAuth, { type NextAuthConfig } from "next-auth";
import GitHub from "next-auth/providers/github";
import { isGitHubUserAllowed } from "@/lib/allowedEmails";

export const authConfig: NextAuthConfig = {
  providers: [GitHub],
  pages: {
    signIn: "/signin",
  },
  session: {
    strategy: "jwt",
  },
  callbacks: {
    signIn({ user, profile }) {
      const username = (profile as { login?: string })?.login ?? "";
      console.log(username,user.email)
      return isGitHubUserAllowed(username, user.email ?? null);
    },
    authorized({ auth }) {
      return !!auth?.user;
    },
    jwt({ token, account, profile }) {
      if (account && profile) {
        token.githubId =
          (profile as { id?: number }).id?.toString() ??
          account.providerAccountId;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user && typeof token.githubId === "string") {
        session.user.githubId = token.githubId;
      }
      return session;
    },
  },
};

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);
