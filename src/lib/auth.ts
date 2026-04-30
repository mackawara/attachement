import NextAuth, { type NextAuthConfig } from "next-auth";
import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google";
import { isEmailAllowed, isGitHubUserAllowed } from "@/lib/allowedEmails";
import { connectDB } from "@/lib/mongodb";
import Student from "@/models/Student";
import User from "@/models/User";

async function isListedSupervisorEmail(
  email: string | null | undefined,
): Promise<boolean> {
  if (!email) return false;
  await connectDB();
  const match = await Student.exists({
    supervisorEmail: email.toLowerCase(),
  });
  return !!match;
}

async function hasUserRecord(
  githubId: string | null | undefined,
): Promise<boolean> {
  if (!githubId) return false;
  await connectDB();
  return !!(await User.exists({ githubId }));
}

export const authConfig: NextAuthConfig = {
  providers: [GitHub, Google],
  pages: {
    signIn: "/signin",
  },
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async signIn({ user, profile, account }) {
      const providerId = account?.providerAccountId ?? null;
      if (await hasUserRecord(providerId)) return true;
      if (await isListedSupervisorEmail(user.email)) return true;
      if (account?.provider === "github") {
        const username = (profile as { login?: string })?.login ?? "";
        return isGitHubUserAllowed(username, user.email ?? null);
      }
      return isEmailAllowed(user.email);
    },
    authorized({ auth }) {
      return !!auth?.user;
    },
    async jwt({ token, account, profile, trigger }) {
      if (account && profile) {
        token.githubId =
          (profile as { id?: number }).id?.toString() ??
          account.providerAccountId;
      }
      const shouldRefreshRole =
        !!account || trigger === "update" || !token.role;
      if (shouldRefreshRole && token.githubId) {
        await connectDB();
        const record = await User.findOne({ githubId: token.githubId })
          .select("role")
          .lean<{ role?: "student" | "supervisor" }>();
        token.role = record?.role;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user && typeof token.githubId === "string") {
        session.user.githubId = token.githubId;
      }
      if (session.user && token.role) {
        session.user.role = token.role;
      }
      return session;
    },
  },
};

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);
