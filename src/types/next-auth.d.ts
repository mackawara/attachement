import "next-auth";
import "next-auth/jwt";

export type UserRole = "student" | "supervisor";

declare module "next-auth" {
  interface Session {
    user: {
      name?: string | null;
      email?: string | null;
      image?: string | null;
      githubId?: string;
      role?: UserRole;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    githubId?: string;
    role?: UserRole;
  }
}
