import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import Student from "@/models/Student";
import Week from "@/models/Week";

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

  await connectDB();
  const { id } = await params;
  const student = await Student.findById(id).lean<{
    supervisorEmail?: string;
  }>();
  if (!student) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (
    (student.supervisorEmail || "").toLowerCase() !==
    session.user.email.toLowerCase()
  ) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const weeks = await Week.find({ studentId: id })
    .sort({ weekNumber: 1 })
    .lean();

  return NextResponse.json({ student, weeks });
}
