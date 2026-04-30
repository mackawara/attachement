import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";

export async function GET() {
  const session = await auth();
  if (!session?.user?.githubId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  await connectDB();
  const user = await User.findOne({ githubId: session.user.githubId })
    .select("role")
    .lean<{ role?: "student" | "supervisor" }>();
  return NextResponse.json({ role: user?.role ?? null });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.githubId || !session.user.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { role } = await req.json();
  if (role !== "student" && role !== "supervisor") {
    return NextResponse.json({ error: "Invalid role" }, { status: 400 });
  }

  await connectDB();
  const existing = await User.findOne({ githubId: session.user.githubId });
  if (existing) {
    return NextResponse.json({ role: existing.role });
  }

  await User.create({
    githubId: session.user.githubId,
    email: session.user.email.toLowerCase(),
    role,
  });

  return NextResponse.json({ role });
}
