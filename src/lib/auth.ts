import { AuthOptions } from "next-auth";
import GitHubProvider from "next-auth/providers/github";

function getAllowedEmails(): string[] {
  const raw = process.env.ALLOWED_EMAILS || "";
  return raw
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export const authOptions: AuthOptions = {
  providers: [
    GitHubProvider({
      clientId: process.env.GITHUB_ID!,
      clientSecret: process.env.GITHUB_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ user }) {
      const allowed = getAllowedEmails();
      if (allowed.length === 0) return true;
      const email = user.email?.toLowerCase() || "";
      if (!allowed.includes(email)) {
        return false;
      }
      return true;
    },
    async jwt({ token, account, profile }) {
      if (account && profile) {
        token.githubId =
          (profile as { id?: number }).id?.toString() ||
          account.providerAccountId;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as { githubId?: string }).githubId =
          token.githubId as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/",
  },
};
