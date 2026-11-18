import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import Week from "@/models/Week";
import Student from "@/models/Student";
import { nextWeekDefaults, type WeekSummary } from "@/lib/weekDates";

// GET /api/weeks/next?today=YYYY-MM-DD
// Returns the suggested week number and week-ending date for a new entry.
// `today` is optional and lets the browser pass its local date.
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.githubId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectDB();
  const student = await Student.findOne({ githubId: session.user.githubId })
    .select("attachmentFrom")
    .lean<{ _id: unknown; attachmentFrom?: string }>();
  if (!student) {
    return NextResponse.json({ error: "Register first" }, { status: 400 });
  }

  const weeks = await Week.find({ studentId: student._id })
    .select("weekNumber weekEnding")
    .lean<WeekSummary[]>();

  const today = req.nextUrl.searchParams.get("today") ?? undefined;
  return NextResponse.json(
    nextWeekDefaults(weeks, student.attachmentFrom, today),
  );
}
