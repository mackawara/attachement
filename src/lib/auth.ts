import NextAuth, { type NextAuthConfig } from "next-auth";
import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
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
  providers: [
    GitHub,
    Google,
    // Supervisors sign in by just submitting their email. It is allowed if the
    // email is listed as a supervisor on a student record (or in ALLOWED_EMAILS).
    Credentials({
      id: "supervisor-email",
      name: "Supervisor email",
      credentials: {
        email: { label: "Email", type: "email" },
      },
      async authorize(credentials) {
        const email = (credentials?.email as string | undefined)
          ?.trim()
          .toLowerCase();
        if (!email) return null;

        const allowed =
          (await isListedSupervisorEmail(email)) || isEmailAllowed(email);
        if (!allowed) {
          console.warn(`[auth] denied supervisor email login for ${email}`);
          return null;
        }

        // Ensure a supervisor User record exists so role-gated routes pass.
        // githubId is reused as the stable identifier; for email logins it is
        // the email itself.
        await User.updateOne(
          { githubId: email },
          { $setOnInsert: { githubId: email, email, role: "supervisor" } },
          { upsert: true },
        );

        console.info(`[auth] supervisor email login for ${email}`);
        return { id: email, email, name: email };
      },
    }),
  ],
  trustHost: true,
  pages: {
    signIn: "/signin",
  },
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async signIn({ user, profile, account }) {
      // The supervisor email provider gates itself in authorize().
      if (account?.provider === "supervisor-email") return true;
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
    async jwt({ token, account, profile, user, trigger }) {
      if (account && profile) {
        token.githubId =
          (profile as { id?: number }).id?.toString() ??
          account.providerAccountId;
      }
      // Supervisor email login: the credentials user id is the email.
      if (account?.provider === "supervisor-email" && user?.id) {
        token.githubId = user.id;
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
