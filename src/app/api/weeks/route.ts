import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import Week from "@/models/Week";
import Student from "@/models/Student";

export async function GET() {
  const session = await auth();
  if (!session?.user?.githubId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectDB();
  const student = await Student.findOne({ githubId: session.user.githubId });
  if (!student) {
    return NextResponse.json([]);
  }

  const weeks = await Week.find({ studentId: student._id }).sort({
    weekNumber: 1,
  });
  return NextResponse.json(weeks);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.githubId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectDB();
  const student = await Student.findOne({ githubId: session.user.githubId });
  if (!student) {
    return NextResponse.json({ error: "Register first" }, { status: 400 });
  }

  const body = await req.json();
  const week = await Week.create({ ...body, studentId: student._id });
  return NextResponse.json(week, { status: 201 });
}
