import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import Week from "@/models/Week";
import Student from "@/models/Student";
import { nextWeekDefaults, type WeekSummary } from "@/lib/weekDates";

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

  // Fill in the week number / ending date when the client leaves them out.
  if (!body.weekNumber || !body.weekEnding) {
    const existing = await Week.find({ studentId: student._id })
      .select("weekNumber weekEnding")
      .lean<WeekSummary[]>();
    const defaults = nextWeekDefaults(existing, student.attachmentFrom);
    body.weekNumber ||= defaults.weekNumber;
    body.weekEnding ||= defaults.weekEnding;
    body.signatureDate ||= body.weekEnding;
  }

  try {
    const week = await Week.create({ ...body, studentId: student._id });
    return NextResponse.json(week, { status: 201 });
  } catch (err) {
    if ((err as { code?: number }).code === 11000) {
      return NextResponse.json(
        { error: `Week ${body.weekNumber} already exists.` },
        { status: 409 },
      );
    }
    throw err;
  }
}
