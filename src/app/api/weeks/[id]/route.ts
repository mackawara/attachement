import { NextRequest, NextResponse } from "next/server";
import { isValidObjectId } from "mongoose";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import Week from "@/models/Week";
import Student from "@/models/Student";

type RouteParams = { params: Promise<{ id: string }> };

/**
 * Resolves the signed-in student and validates the week id.
 * Returns either the student and id, or a ready-to-send error response.
 */
async function resolveStudent(params: RouteParams["params"]) {
  const session = await auth();
  if (!session?.user?.githubId) {
    return {
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  const { id } = await params;
  if (!isValidObjectId(id)) {
    return {
      error: NextResponse.json({ error: "Invalid week id" }, { status: 400 }),
    };
  }

  await connectDB();
  const student = await Student.findOne({ githubId: session.user.githubId });
  if (!student) {
    return {
      error: NextResponse.json({ error: "Not found" }, { status: 404 }),
    };
  }

  return { id, student };
}

export async function GET(_req: NextRequest, { params }: RouteParams) {
  const result = await resolveStudent(params);
  if ("error" in result) return result.error;

  const week = await Week.findOne({
    _id: result.id,
    studentId: result.student._id,
  });
  if (!week) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(week);
}

export async function PUT(req: NextRequest, { params }: RouteParams) {
  const result = await resolveStudent(params);
  if ("error" in result) return result.error;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  // Students may not set supervisor feedback, nor reassign the week's owner/id.
  const {
    supervisorComment: _sc,
    supervisorCommentAt: _scAt,
    studentId: _sid,
    _id: _wid,
    ...studentEditable
  } = body as Record<string, unknown>;
  void _sc;
  void _scAt;
  void _sid;
  void _wid;

  const week = await Week.findOneAndUpdate(
    { _id: result.id, studentId: result.student._id },
    studentEditable,
    { returnDocument: "after" },
  );
  if (!week) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(week);
}

export async function DELETE(_req: NextRequest, { params }: RouteParams) {
  const result = await resolveStudent(params);
  if ("error" in result) return result.error;

  const week = await Week.findOneAndDelete({
    _id: result.id,
    studentId: result.student._id,
  });
  if (!week) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ success: true });
}
