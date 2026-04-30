import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import Week from "@/models/Week";
import Student from "@/models/Student";

async function loadAuthorizedWeek(weekId: string, supervisorEmail: string) {
  await connectDB();
  const week = await Week.findById(weekId);
  if (!week) return { error: "Not found", status: 404 as const };
  const student = await Student.findById(week.studentId);
  if (!student) return { error: "Not found", status: 404 as const };
  if ((student.supervisorEmail || "").toLowerCase() !== supervisorEmail) {
    return { error: "Forbidden", status: 403 as const };
  }
  return { week, student };
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (
    !session?.user?.email ||
    session.user.role !== "supervisor"
  ) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = await params;
  const result = await loadAuthorizedWeek(
    id,
    session.user.email.toLowerCase(),
  );
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }
  return NextResponse.json({ week: result.week, student: result.student });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (
    !session?.user?.email ||
    session.user.role !== "supervisor"
  ) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = await params;
  const result = await loadAuthorizedWeek(
    id,
    session.user.email.toLowerCase(),
  );
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  const { supervisorComment } = await req.json();
  if (typeof supervisorComment !== "string") {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  result.week.supervisorComment = supervisorComment;
  result.week.supervisorCommentAt = new Date();
  await result.week.save();

  return NextResponse.json(result.week);
}
