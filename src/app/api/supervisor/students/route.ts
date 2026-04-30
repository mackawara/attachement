import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import Student from "@/models/Student";
import Week from "@/models/Week";

export async function GET() {
  const session = await auth();
  if (
    !session?.user?.githubId ||
    !session.user.email ||
    session.user.role !== "supervisor"
  ) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await connectDB();
  const email = session.user.email.toLowerCase();
  const students = await Student.find({ supervisorEmail: email }).lean();

  const enriched = await Promise.all(
    students.map(async (s) => {
      const weeks = await Week.find({ studentId: s._id })
        .select("weekNumber weekEnding supervisorComment supervisorCommentAt")
        .sort({ weekNumber: 1 })
        .lean();
      return { ...s, weeks };
    }),
  );

  return NextResponse.json(enriched);
}
