import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Week from "@/models/Week";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await connectDB();
  const { id } = await params;
  const week = await Week.findById(id);
  if (!week) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(week);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await connectDB();
  const { id } = await params;
  const body = await req.json();
  const {
    supervisorComment: _sc,
    supervisorCommentAt: _scAt,
    ...studentEditable
  } = body ?? {};
  void _sc;
  void _scAt;
  const week = await Week.findByIdAndUpdate(id, studentEditable, { new: true });
  if (!week) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(week);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await connectDB();
  const { id } = await params;
  await Week.findByIdAndDelete(id);
  return NextResponse.json({ success: true });
}
