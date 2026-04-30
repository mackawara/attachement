import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: NextRequest) {
  const { days } = await req.json();

  const dayEntries = Object.entries(days)
    .map(
      ([day, entry]: [string, unknown]) =>
        `${day}: ${(entry as { description: string }).description}`
    )
    .join("\n");

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: `You are helping a university student fill in their attachment/internship logbook.
Given brief notes about what they did each day, expand each day into:
1. A comprehensive "Description of Work Done" (2-3 sentences, professional tone)
2. "New Skills Learnt" (1-2 sentences about skills gained)

Also generate a "Trainee's Weekly Report" paragraph (4-6 sentences summarizing the entire week).

Respond in JSON format:
{
  "days": {
    "monday": { "description": "...", "skills": "..." },
    "tuesday": { "description": "...", "skills": "..." },
    "wednesday": { "description": "...", "skills": "..." },
    "thursday": { "description": "...", "skills": "..." },
    "friday": { "description": "...", "skills": "..." }
  },
  "weeklyReport": "..."
}`,
      },
      {
        role: "user",
        content: `Here are the brief notes for each day:\n${dayEntries}`,
      },
    ],
    response_format: { type: "json_object" },
  });

  const result = JSON.parse(completion.choices[0].message.content || "{}");
  return NextResponse.json(result);
}
