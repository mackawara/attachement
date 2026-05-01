"use client";

import { useSession } from "next-auth/react";
import { apiFetch } from "@/lib/api";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  Container,
  Typography,
  TextField,
  Button,
  Box,
  Paper,
  Alert,
  CircularProgress,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Stack,
  Chip,
} from "@mui/material";
import SaveIcon from "@mui/icons-material/Save";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import AutoFixHighIcon from "@mui/icons-material/AutoFixHigh";
import LightbulbIcon from "@mui/icons-material/Lightbulb";

const DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday"] as const;
const DAY_LABELS: Record<string, string> = {
  monday: "Monday",
  tuesday: "Tuesday",
  wednesday: "Wednesday",
  thursday: "Thursday",
  friday: "Friday",
};

interface DayEntry {
  description: string;
  skills: string;
}

interface WeekData {
  _id: string;
  weekNumber: number;
  weekEnding: string;
  days: Record<(typeof DAYS)[number], DayEntry>;
  weeklyReport: string;
  supervisorComment: string;
  supervisorCommentAt: string | null;
}

interface StudentData {
  name: string;
  pin: string;
  program: string;
  companyName: string;
}

export default function SupervisorReviewWeek() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const [week, setWeek] = useState<WeekData | null>(null);
  const [student, setStudent] = useState<StudentData | null>(null);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [aiBusy, setAiBusy] = useState<"polish" | "draft" | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") router.push("/");
    if (status === "authenticated" && session?.user?.role !== "supervisor") {
      router.push("/");
    }
  }, [status, session, router]);

  useEffect(() => {
    if (!params.id) return;
    apiFetch(`/api/supervisor/weeks/${params.id}`)
      .then(async (r) => {
        if (!r.ok) throw new Error(await r.text());
        return r.json();
      })
      .then((data) => {
        setWeek(data.week);
        setStudent(data.student);
        setComment(data.week.supervisorComment || "");
        setLoading(false);
      })
      .catch(() => {
        setError("Could not load this week.");
        setLoading(false);
      });
  }, [params.id]);

  const handleSave = async () => {
    if (!week) return;
    setSaving(true);
    setError("");
    try {
      const res = await apiFetch(`/api/supervisor/weeks/${week._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ supervisorComment: comment }),
      });
      if (!res.ok) throw new Error("Failed to save");
      const updated = await res.json();
      setWeek({
        ...week,
        supervisorComment: updated.supervisorComment,
        supervisorCommentAt: updated.supervisorCommentAt,
      });
      setSuccess("Comment saved.");
      setTimeout(() => setSuccess(""), 3000);
    } catch {
      setError("Failed to save comment.");
    } finally {
      setSaving(false);
    }
  };

  const callAi = async (mode: "polish" | "draft") => {
    if (!week) return;
    setAiBusy(mode);
    setError("");
    try {
      const res = await apiFetch("/api/comment-suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode,
          draft: mode === "polish" ? comment : undefined,
          week: {
            weekNumber: week.weekNumber,
            weekEnding: week.weekEnding,
            weeklyReport: week.weeklyReport,
            days: week.days,
          },
        }),
      });
      if (!res.ok) throw new Error("Failed");
      const result = await res.json();
      if (result.comment) setComment(result.comment);
    } catch {
      setError("AI suggestion failed.");
    } finally {
      setAiBusy(null);
    }
  };

  if (status === "loading" || loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!session || !week || !student) return null;

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={() => router.push("/supervisor")}
        sx={{ mb: 2 }}
      >
        Back to Students
      </Button>

      <Box sx={{ mb: 3 }}>
        <Typography variant="h4">
          Week {week.weekNumber} — {student.name}
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          {student.pin}
          {student.program ? ` · ${student.program}` : ""}
          {student.companyName ? ` · ${student.companyName}` : ""}
          {" · "}Ending {week.weekEnding}
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Weekly Progress Chart
        </Typography>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: "bold", width: 100 }}>Day</TableCell>
                <TableCell sx={{ fontWeight: "bold" }}>
                  Description of Work Done
                </TableCell>
                <TableCell sx={{ fontWeight: "bold" }}>
                  New Skills Learnt
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {DAYS.map((day) => (
                <TableRow key={day}>
                  <TableCell sx={{ fontWeight: 500 }}>
                    {DAY_LABELS[day]}
                  </TableCell>
                  <TableCell>{week.days[day]?.description || "-"}</TableCell>
                  <TableCell>{week.days[day]?.skills || "-"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Trainee&apos;s Weekly Report
        </Typography>
        <Typography variant="body1">
          {week.weeklyReport || "No report entered."}
        </Typography>
      </Paper>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 2,
          }}
        >
          <Typography variant="h6">Supervisor Comment</Typography>
          {week.supervisorCommentAt && (
            <Chip
              size="small"
              label={`Last saved ${new Date(week.supervisorCommentAt).toLocaleString()}`}
              variant="outlined"
            />
          )}
        </Box>
        <TextField
          multiline
          rows={5}
          fullWidth
          placeholder="Write your review of this week's work…"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          sx={{ mb: 2 }}
        />
        <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={
              aiBusy === "polish" ? (
                <CircularProgress size={18} />
              ) : (
                <AutoFixHighIcon />
              )
            }
            onClick={() => callAi("polish")}
            disabled={aiBusy !== null || comment.trim().length === 0}
          >
            Polish my draft
          </Button>
          <Button
            variant="outlined"
            startIcon={
              aiBusy === "draft" ? (
                <CircularProgress size={18} />
              ) : (
                <LightbulbIcon />
              )
            }
            onClick={() => callAi("draft")}
            disabled={aiBusy !== null}
          >
            Suggest from week
          </Button>
        </Stack>
      </Paper>

      <Divider sx={{ my: 2 }} />

      <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
        <Button
          variant="contained"
          startIcon={saving ? <CircularProgress size={20} /> : <SaveIcon />}
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? "Saving..." : "Save Comment"}
        </Button>
      </Box>
    </Container>
  );
}
