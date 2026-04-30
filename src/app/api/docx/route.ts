import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import Week from "@/models/Week";
import Student from "@/models/Student";
import {
  Document,
  Packer,
  Paragraph,
  Table,
  TableRow,
  TableCell,
  TextRun,
  AlignmentType,
  WidthType,
  BorderStyle,
  HeadingLevel,
  PageBreak,
} from "docx";

function cellBorders() {
  const border = {
    style: BorderStyle.SINGLE,
    size: 1,
    color: "000000",
  };
  return { top: border, bottom: border, left: border, right: border };
}

function headerCell(text: string, width: number) {
  return new TableCell({
    width: { size: width, type: WidthType.PERCENTAGE },
    borders: cellBorders(),
    children: [
      new Paragraph({
        children: [new TextRun({ text, bold: true, size: 22 })],
        alignment: AlignmentType.CENTER,
      }),
    ],
  });
}

function textCell(text: string, width: number) {
  return new TableCell({
    width: { size: width, type: WidthType.PERCENTAGE },
    borders: cellBorders(),
    children: [
      new Paragraph({
        children: [new TextRun({ text, size: 22 })],
      }),
    ],
  });
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.githubId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectDB();
  const student = await Student.findOne({ githubId: session.user.githubId });
  if (!student) {
    return NextResponse.json({ error: "Register first" }, { status: 400 });
  }

  const weeks = await Week.find({ studentId: student._id }).sort({ weekNumber: 1 });

  const sections: (Paragraph | Table)[] = [];

  sections.push(
    new Paragraph({ text: "" }),
    new Paragraph({ text: "" }),
    new Paragraph({
      children: [
        new TextRun({
          text: "FACULTY OF TECHNOLOGY",
          bold: true,
          size: 32,
        }),
      ],
      alignment: AlignmentType.CENTER,
    }),
    new Paragraph({
      children: [
        new TextRun({ text: "BITH/BSEH/BMTH/BNCH", size: 24 }),
      ],
      alignment: AlignmentType.CENTER,
    }),
    new Paragraph({ text: "" }),
    new Paragraph({ text: "" }),
    new Paragraph({
      children: [
        new TextRun({
          text: "STUDENT'S ATTACHMENT LOG-BOOK",
          bold: true,
          size: 36,
        }),
      ],
      alignment: AlignmentType.CENTER,
    }),
    new Paragraph({
      children: [
        new TextRun({ text: "DURATION: 2 SEMESTERS", size: 24 }),
      ],
      alignment: AlignmentType.CENTER,
    }),
    new Paragraph({ text: "" }),
    new Paragraph({ text: "" }),
    new Paragraph({
      children: [
        new TextRun({ text: `STUDENT NAME: ${student.name}`, size: 24 }),
      ],
    }),
    new Paragraph({
      children: [
        new TextRun({ text: `PIN NUMBER: ${student.pin}`, size: 24 }),
      ],
    }),
    new Paragraph({
      children: [
        new TextRun({ text: `PROGRAM: ${student.program}`, size: 24 }),
      ],
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `COURSE CODE: ${student.courseCode}`,
          size: 24,
        }),
      ],
    }),
    new Paragraph({
      children: [new PageBreak()],
    })
  );

  sections.push(
    new Paragraph({
      text: "STUDENT'S DETAILS",
      heading: HeadingLevel.HEADING_1,
      alignment: AlignmentType.CENTER,
    }),
    new Paragraph({ text: "" }),
    new Paragraph({
      children: [
        new TextRun({
          text: `Name of student: ${student.name}`,
          size: 24,
        }),
      ],
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `PIN No: ${student.pin}`,
          size: 24,
        }),
      ],
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `Faculty: ${student.faculty}`,
          size: 24,
        }),
      ],
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `Course of Study: ${student.program}`,
          size: 24,
        }),
      ],
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `Stage/Year of study: ${student.year}`,
          size: 24,
        }),
      ],
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `Company: ${student.companyName}`,
          size: 24,
        }),
      ],
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `Address: ${student.companyAddress}`,
          size: 24,
        }),
      ],
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `Industry Supervisor: ${student.supervisorName}`,
          size: 24,
        }),
      ],
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `Designation: ${student.supervisorDesignation}`,
          size: 24,
        }),
      ],
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `Telephone: ${student.supervisorTelephone}  Mobile: ${student.supervisorMobile}`,
          size: 24,
        }),
      ],
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `Duration From: ${student.attachmentFrom}  To: ${student.attachmentTo}`,
          size: 24,
        }),
      ],
    }),
    new Paragraph({ children: [new PageBreak()] })
  );

  const dayNames = ["monday", "tuesday", "wednesday", "thursday", "friday"] as const;
  const dayLabels = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

  for (const week of weeks) {
    sections.push(
      new Paragraph({
        children: [
          new TextRun({
            text: `STUDENT'S WEEKLY PROGRESS CHART              (WEEK ENDING: ${week.weekEnding})`,
            bold: true,
            size: 24,
          }),
        ],
      }),
      new Paragraph({ text: "" })
    );

    const tableRows = [
      new TableRow({
        children: [
          headerCell("DAY", 15),
          headerCell("DESCRIPTION OF WORK DONE", 50),
          headerCell("NEW SKILLS LEARNT", 35),
        ],
      }),
    ];

    for (let i = 0; i < dayNames.length; i++) {
      const day = week.days[dayNames[i]];
      tableRows.push(
        new TableRow({
          children: [
            textCell(dayLabels[i], 15),
            textCell(day?.description || "", 50),
            textCell(day?.skills || "", 35),
          ],
        })
      );
    }

    sections.push(
      new Table({
        rows: tableRows,
        width: { size: 100, type: WidthType.PERCENTAGE },
      }),
      new Paragraph({ text: "" }),
      new Paragraph({
        children: [
          new TextRun({
            text: `Student's Signature: ………………………………     Date: ${week.signatureDate || "………………"}`,
            size: 22,
          }),
        ],
      }),
      new Paragraph({ text: "" }),
      new Paragraph({
        children: [
          new TextRun({
            text: "Comments by Lecturer/Supervisor: ………………………………………………………",
            size: 22,
          }),
        ],
      }),
      new Paragraph({
        children: [
          new TextRun({ text: "………………………………………………………………………………………………………", size: 22 }),
        ],
      }),
      new Paragraph({ text: "" }),
      new Paragraph({
        children: [
          new TextRun({
            text: "Name: ……………………………………………………………………………",
            size: 22,
          }),
        ],
      }),
      new Paragraph({
        children: [
          new TextRun({
            text: "Signature: ………………………………………     Date: ………………",
            size: 22,
          }),
        ],
      }),
      new Paragraph({ text: "" }),
      new Paragraph({
        children: [
          new TextRun({
            text: "TRAINEE'S WEEKLY REPORT",
            bold: true,
            size: 24,
          }),
        ],
      }),
      new Paragraph({ text: "" }),
      new Paragraph({
        children: [
          new TextRun({ text: week.weeklyReport || "", size: 22 }),
        ],
      }),
      new Paragraph({ children: [new PageBreak()] })
    );
  }

  const doc = new Document({
    sections: [{ children: sections }],
  });

  const buffer = await Packer.toBuffer(doc);
  const uint8 = new Uint8Array(buffer);

  return new NextResponse(uint8, {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition":
        'attachment; filename="ZOU_ATTACHMENT_LOGBOOK.docx"',
    },
  });
}
