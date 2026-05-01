"use client";

import { useSession } from "next-auth/react";
import { apiFetch } from "@/lib/api";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Container,
  Typography,
  TextField,
  Button,
  Box,
  Paper,
  Grid,
  Alert,
  CircularProgress,
  Divider,
} from "@mui/material";
import AutoFixHighIcon from "@mui/icons-material/AutoFixHigh";
import SaveIcon from "@mui/icons-material/Save";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";

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

type Days = Record<(typeof DAYS)[number], DayEntry>;

export default function NewWeek() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [weekNumber, setWeekNumber] = useState("");
  const [weekEnding, setWeekEnding] = useState("");
  const [days, setDays] = useState<Days>({
    monday: { description: "", skills: "" },
    tuesday: { description: "", skills: "" },
    wednesday: { description: "", skills: "" },
    thursday: { description: "", skills: "" },
    friday: { description: "", skills: "" },
  });
  const [weeklyReport, setWeeklyReport] = useState("");
  const [expanding, setExpanding] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [expanded, setExpanded] = useState(false);

  const updateDay = (day: (typeof DAYS)[number], field: keyof DayEntry, value: string) => {
    setDays((prev) => ({
      ...prev,
      [day]: { ...prev[day], [field]: value },
    }));
  };

  const handleExpand = async () => {
    setExpanding(true);
    setError("");
    try {
      const res = await apiFetch("/api/expand", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ days }),
      });
      if (!res.ok) throw new Error("Failed to expand");
      const result = await res.json();
      if (result.days) {
        setDays(result.days);
      }
      if (result.weeklyReport) {
        setWeeklyReport(result.weeklyReport);
      }
      setExpanded(true);
    } catch {
      setError("Failed to expand with AI. Check your OpenAI API key.");
    } finally {
      setExpanding(false);
    }
  };

  const handleSave = async () => {
    if (!weekNumber || !weekEnding) {
      setError("Week number and ending date are required.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const res = await apiFetch("/api/weeks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          weekNumber: parseInt(weekNumber),
          weekEnding,
          days,
          weeklyReport,
          signatureDate: weekEnding,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save");
      }
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  if (status === "loading") return null;
  if (!session) {
    router.push("/");
    return null;
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={() => router.push("/dashboard")}
        sx={{ mb: 2 }}
      >
        Back to Dashboard
      </Button>

      <Typography variant="h4" gutterBottom>
        New Weekly Entry
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Enter brief notes for each day, then use AI to expand them into
        comprehensive descriptions.
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid size={{ xs: 6 }}>
            <TextField
              label="Week Number"
              type="number"
              fullWidth
              value={weekNumber}
              onChange={(e) => setWeekNumber(e.target.value)}
            />
          </Grid>
          <Grid size={{ xs: 6 }}>
            <TextField
              label="Week Ending Date"
              type="date"
              fullWidth
              slotProps={{ inputLabel: { shrink: true } }}
              value={weekEnding}
              onChange={(e) => setWeekEnding(e.target.value)}
            />
          </Grid>
        </Grid>

        <Divider sx={{ mb: 3 }} />

        <Typography variant="subtitle1" sx={{ mb: 2 }}>
          {expanded
            ? "AI-Expanded Entries (edit if needed)"
            : "Brief Daily Notes"}
        </Typography>

        {DAYS.map((day) => (
          <Box key={day} sx={{ mb: 3 }}>
            <Typography variant="subtitle2" color="primary" gutterBottom>
              {DAY_LABELS[day]}
            </Typography>
            <TextField
              label="Description of Work Done"
              multiline
              rows={expanded ? 3 : 1}
              fullWidth
              value={days[day].description}
              onChange={(e) => updateDay(day, "description", e.target.value)}
              placeholder={
                expanded
                  ? ""
                  : "Brief note, e.g. 'Fixed login bug, attended standup'"
              }
              sx={{ mb: 1 }}
            />
            {expanded && (
              <TextField
                label="New Skills Learnt"
                multiline
                rows={2}
                fullWidth
                value={days[day].skills}
                onChange={(e) => updateDay(day, "skills", e.target.value)}
              />
            )}
          </Box>
        ))}

        {!expanded && (
          <Button
            variant="outlined"
            color="secondary"
            startIcon={
              expanding ? (
                <CircularProgress size={20} />
              ) : (
                <AutoFixHighIcon />
              )
            }
            onClick={handleExpand}
            disabled={expanding}
            fullWidth
            size="large"
            sx={{ mb: 2 }}
          >
            {expanding ? "Expanding with AI..." : "Expand with AI"}
          </Button>
        )}

        {expanded && (
          <>
            <Divider sx={{ my: 3 }} />
            <Typography variant="subtitle1" sx={{ mb: 1 }}>
              Trainee&apos;s Weekly Report
            </Typography>
            <TextField
              multiline
              rows={5}
              fullWidth
              value={weeklyReport}
              onChange={(e) => setWeeklyReport(e.target.value)}
            />
          </>
        )}
      </Paper>

      <Box sx={{ display: "flex", gap: 2, justifyContent: "flex-end" }}>
        {expanded && (
          <Button
            variant="outlined"
            onClick={() => {
              setExpanded(false);
              setWeeklyReport("");
            }}
          >
            Re-enter Notes
          </Button>
        )}
        <Button
          variant="contained"
          size="large"
          startIcon={
            saving ? <CircularProgress size={20} /> : <SaveIcon />
          }
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? "Saving..." : "Save Week"}
        </Button>
      </Box>
    </Container>
  );
}
