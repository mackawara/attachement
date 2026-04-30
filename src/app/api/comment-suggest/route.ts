import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { auth } from "@/lib/auth";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

interface DayEntry {
  description?: string;
  skills?: string;
}

interface WeekContext {
  weekNumber?: number;
  weekEnding?: string;
  weeklyReport?: string;
  days?: Record<string, DayEntry>;
}

function formatWeek(week: WeekContext): string {
  const lines: string[] = [];
  if (week.weekNumber) lines.push(`Week ${week.weekNumber}`);
  if (week.weekEnding) lines.push(`Ending: ${week.weekEnding}`);
  if (week.days) {
    for (const [day, entry] of Object.entries(week.days)) {
      const desc = entry?.description?.trim();
      const skills = entry?.skills?.trim();
      if (desc || skills) {
        lines.push(
          `${day}: ${desc || "(no description)"}${skills ? ` — skills: ${skills}` : ""}`,
        );
      }
    }
  }
  if (week.weeklyReport) lines.push(`\nWeekly report: ${week.weeklyReport}`);
  return lines.join("\n");
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (session?.user?.role !== "supervisor") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { mode, draft, week, gender } = await req.json();
  if (mode !== "polish" && mode !== "draft") {
    return NextResponse.json({ error: "Invalid mode" }, { status: 400 });
  }

  const pronoun = gender === "female" ? "she/her" : "he/him";
  const subjectPronoun = gender === "female" ? "She" : "He";
  const objectPronoun = gender === "female" ? "her" : "him";

  const system = `You are an industry supervisor writing a formal comment on a university student's weekly attachment logbook.

Strict style rules:
- Write in the THIRD PERSON, referring to the student as "the student" or "the trainee" — never as "you".
- Use the pronouns: ${pronoun} (e.g. "${subjectPronoun} demonstrated…", "encourage ${objectPronoun} to…").
- Do NOT use first person ("I", "we", "my").
- Use formal, evaluative language suited to a printed logbook signed by the supervisor (e.g. "The student demonstrated aptitude in…", "The trainee showed initiative when…", "${subjectPronoun} is encouraged to…").
- 1 or 2 sentences at most sentences, single paragraph, plain prose — no headings, no bullets, no salutations.
- Acknowledge specific work done, note progress or competencies observed, and where useful indicate one area for further development.`;

  const userContent =
    mode === "polish"
      ? `Polish this supervisor's draft comment into a clean, professional paragraph. Keep the supervisor's intent.\n\nDraft:\n${draft || ""}\n\nWeek context:\n${formatWeek(week || {})}`
      : `Write a fresh supervisor comment based on the week below.\n\nWeek:\n${formatWeek(week || {})}`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: system },
      { role: "user", content: userContent },
    ],
  });

  const comment = completion.choices[0].message.content?.trim() || "";
  return NextResponse.json({ comment });
}
