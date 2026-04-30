import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import Student from "@/models/Student";

export async function GET() {
  const session = await auth();
  if (!session?.user?.githubId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectDB();
  const student = await Student.findOne({ githubId: session.user.githubId });
  if (!student) {
    return NextResponse.json({ registered: false });
  }
  return NextResponse.json({ registered: true, student });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.githubId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectDB();
  const body = await req.json();

  const existing = await Student.findOne({ githubId: session.user.githubId });
  if (existing) {
    const updated = await Student.findByIdAndUpdate(existing._id, body, {
      new: true,
    });
    return NextResponse.json(updated);
  }

  const student = await Student.create({
    ...body,
    githubId: session.user.githubId,
    email: session.user.email || "",
  });
  return NextResponse.json(student, { status: 201 });
}
