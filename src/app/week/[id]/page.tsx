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
  Grid,
  Alert,
  CircularProgress,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";
import SaveIcon from "@mui/icons-material/Save";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import AutoFixHighIcon from "@mui/icons-material/AutoFixHigh";

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
  signatureDate: string;
  supervisorComment?: string;
  supervisorCommentAt?: string | null;
}

export default function ViewWeek() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const [week, setWeek] = useState<WeekData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [expanding, setExpanding] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") router.push("/");
  }, [status, router]);

  useEffect(() => {
    if (params.id) {
      apiFetch(`/api/weeks/${params.id}`)
        .then((r) => r.json())
        .then((data) => {
          setWeek(data);
          setLoading(false);
        });
    }
  }, [params.id]);

  const updateDay = (day: (typeof DAYS)[number], field: keyof DayEntry, value: string) => {
    if (!week) return;
    setWeek({
      ...week,
      days: {
        ...week.days,
        [day]: { ...week.days[day], [field]: value },
      },
    });
  };

  const handleReExpand = async () => {
    if (!week) return;
    setExpanding(true);
    setError("");
    try {
      const res = await apiFetch("/api/expand", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ days: week.days }),
      });
      if (!res.ok) throw new Error("Failed to expand");
      const result = await res.json();
      setWeek({
        ...week,
        days: result.days || week.days,
        weeklyReport: result.weeklyReport || week.weeklyReport,
      });
    } catch {
      setError("Failed to expand with AI.");
    } finally {
      setExpanding(false);
    }
  };

  const handleSave = async () => {
    if (!week) return;
    setSaving(true);
    setError("");
    try {
      const res = await apiFetch(`/api/weeks/${week._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(week),
      });
      if (!res.ok) throw new Error("Failed to save");
      setSuccess("Saved successfully!");
      setEditing(false);
      setTimeout(() => setSuccess(""), 3000);
    } catch {
      setError("Failed to save.");
    } finally {
      setSaving(false);
    }
  };

  if (status === "loading" || loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!session || !week) return null;

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={() => router.push("/dashboard")}
        sx={{ mb: 2 }}
      >
        Back to Dashboard
      </Button>

      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >
        <Typography variant="h4" >
          Week {week.weekNumber}
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Ending: {week.weekEnding}
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

        {editing ? (
          <>
            <Grid container spacing={2} sx={{ mb: 2 }}>
              <Grid size={{ xs: 6 }}>
                <TextField
                  label="Week Number"
                  type="number"
                  fullWidth
                  value={week.weekNumber}
                  onChange={(e) =>
                    setWeek({ ...week, weekNumber: parseInt(e.target.value) })
                  }
                />
              </Grid>
              <Grid size={{ xs: 6 }}>
                <TextField
                  label="Week Ending"
                  type="date"
                  fullWidth
                  slotProps={{ inputLabel: { shrink: true } }}
                  value={week.weekEnding}
                  onChange={(e) =>
                    setWeek({ ...week, weekEnding: e.target.value })
                  }
                />
              </Grid>
            </Grid>
            {DAYS.map((day) => (
              <Box key={day} sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="primary">
                  {DAY_LABELS[day]}
                </Typography>
                <TextField
                  label="Description"
                  multiline
                  rows={2}
                  fullWidth
                  value={week.days[day]?.description || ""}
                  onChange={(e) => updateDay(day, "description", e.target.value)}
                  sx={{ mb: 1 }}
                />
                <TextField
                  label="Skills"
                  multiline
                  rows={1}
                  fullWidth
                  value={week.days[day]?.skills || ""}
                  onChange={(e) => updateDay(day, "skills", e.target.value)}
                />
              </Box>
            ))}
            <Button
              variant="outlined"
              startIcon={
                expanding ? (
                  <CircularProgress size={20} />
                ) : (
                  <AutoFixHighIcon />
                )
              }
              onClick={handleReExpand}
              disabled={expanding}
              sx={{ mb: 2 }}
            >
              {expanding ? "Expanding..." : "Re-expand with AI"}
            </Button>
          </>
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: "bold", width: 100 }}>
                    Day
                  </TableCell>
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
                    <TableCell>
                      {week.days[day]?.description || "-"}
                    </TableCell>
                    <TableCell>{week.days[day]?.skills || "-"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      {week.supervisorComment ? (
        <Paper
          sx={{
            p: 3,
            mb: 3,
            borderLeft: 4,
            borderColor: "success.main",
            bgcolor: "success.light",
          }}
        >
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 1,
            }}
          >
            <Typography variant="h6">Supervisor Comment</Typography>
            {week.supervisorCommentAt && (
              <Typography variant="caption" color="text.secondary">
                {new Date(week.supervisorCommentAt).toLocaleString()}
              </Typography>
            )}
          </Box>
          <Typography variant="body1" sx={{ whiteSpace: "pre-wrap" }}>
            {week.supervisorComment}
          </Typography>
        </Paper>
      ) : null}

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Trainee&apos;s Weekly Report
        </Typography>
        {editing ? (
          <TextField
            multiline
            rows={5}
            fullWidth
            value={week.weeklyReport}
            onChange={(e) =>
              setWeek({ ...week, weeklyReport: e.target.value })
            }
          />
        ) : (
          <Typography variant="body1">
            {week.weeklyReport || "No report entered."}
          </Typography>
        )}
      </Paper>

      <Divider sx={{ my: 2 }} />

      <Box sx={{ display: "flex", gap: 2, justifyContent: "flex-end" }}>
        {editing ? (
          <>
            <Button variant="outlined" onClick={() => setEditing(false)}>
              Cancel
            </Button>
            <Button
              variant="contained"
              startIcon={
                saving ? <CircularProgress size={20} /> : <SaveIcon />
              }
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </>
        ) : (
          <Button variant="contained" onClick={() => setEditing(true)}>
            Edit
          </Button>
        )}
      </Box>
    </Container>
  );
}
