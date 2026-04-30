"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  Container,
  Typography,
  Box,
  Paper,
  Grid,
  CircularProgress,
  Alert,
  Button,
  Divider,
  Chip,
  Stack,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import PersonIcon from "@mui/icons-material/Person";

interface Student {
  _id: string;
  name: string;
  pin: string;
  faculty: string;
  program: string;
  courseCode: string;
  year: string;
  email: string;
  companyName: string;
  companyAddress: string;
  supervisorName: string;
  supervisorDesignation: string;
  supervisorTelephone: string;
  supervisorMobile: string;
  supervisorEmail: string;
  attachmentFrom: string;
  attachmentTo: string;
}

interface Week {
  _id: string;
  weekNumber: number;
  weekEnding: string;
  weeklyReport: string;
  supervisorComment: string;
  supervisorCommentAt: string | null;
}

interface Field {
  label: string;
  value: string;
}

function FieldRow({ label, value }: Field) {
  return (
    <Grid size={{ xs: 12, sm: 6 }}>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="body1">{value || "—"}</Typography>
    </Grid>
  );
}

export default function SupervisorStudentDetail() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const [student, setStudent] = useState<Student | null>(null);
  const [weeks, setWeeks] = useState<Week[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") router.push("/");
    if (status === "authenticated" && session?.user?.role !== "supervisor") {
      router.push("/");
    }
  }, [status, session, router]);

  useEffect(() => {
    if (!params.id) return;
    fetch(`/api/supervisor/students/${params.id}`)
      .then(async (r) => {
        if (!r.ok) throw new Error(await r.text());
        return r.json();
      })
      .then((data) => {
        setStudent(data.student);
        setWeeks(data.weeks);
        setLoading(false);
      })
      .catch(() => {
        setError("Could not load this student.");
        setLoading(false);
      });
  }, [params.id]);

  if (status === "loading" || loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!session || !student) return null;

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={() => router.push("/supervisor")}
        sx={{ mb: 2 }}
      >
        Back to Students
      </Button>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
        <PersonIcon sx={{ fontSize: 40, color: "primary.main" }} />
        <Box>
          <Typography variant="h4">{student.name}</Typography>
          <Typography variant="body2" color="text.secondary">
            {student.pin}
            {student.program ? ` · ${student.program}` : ""}
          </Typography>
        </Box>
      </Box>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Personal Details
        </Typography>
        <Grid container spacing={2}>
          <FieldRow label="Full Name" value={student.name} />
          <FieldRow label="PIN" value={student.pin} />
          <FieldRow label="Faculty" value={student.faculty} />
          <FieldRow label="Program" value={student.program} />
          <FieldRow label="Course Code" value={student.courseCode} />
          <FieldRow label="Year / Stage" value={student.year} />
          <FieldRow label="Email" value={student.email} />
        </Grid>
      </Paper>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Attachment
        </Typography>
        <Grid container spacing={2}>
          <FieldRow label="Company" value={student.companyName} />
          <FieldRow label="Address" value={student.companyAddress} />
          <FieldRow label="From" value={student.attachmentFrom} />
          <FieldRow label="To" value={student.attachmentTo} />
        </Grid>
      </Paper>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Industry Supervisor (as listed by student)
        </Typography>
        <Grid container spacing={2}>
          <FieldRow label="Name" value={student.supervisorName} />
          <FieldRow label="Designation" value={student.supervisorDesignation} />
          <FieldRow label="Telephone" value={student.supervisorTelephone} />
          <FieldRow label="Mobile" value={student.supervisorMobile} />
          <FieldRow label="Email" value={student.supervisorEmail} />
        </Grid>
      </Paper>

      <Divider sx={{ my: 3 }} />

      <Typography variant="h6" gutterBottom>
        Weekly Submissions ({weeks.length})
      </Typography>
      {weeks.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          No weeks submitted yet.
        </Typography>
      ) : (
        <Stack spacing={1}>
          {weeks.map((w) => (
            <Box
              key={w._id}
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 2,
                p: 1.5,
                border: 1,
                borderColor: "divider",
                borderRadius: 1,
              }}
            >
              <Box>
                <Typography variant="subtitle1">Week {w.weekNumber}</Typography>
                <Typography variant="caption" color="text.secondary">
                  Ending {w.weekEnding}
                </Typography>
              </Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Chip
                  size="small"
                  color={w.supervisorComment ? "success" : "default"}
                  label={w.supervisorComment ? "Reviewed" : "Pending"}
                  variant={w.supervisorComment ? "filled" : "outlined"}
                />
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => router.push(`/supervisor/week/${w._id}`)}
                >
                  Review
                </Button>
              </Box>
            </Box>
          ))}
        </Stack>
      )}
    </Container>
  );
}
