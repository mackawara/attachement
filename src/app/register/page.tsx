"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
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
import SaveIcon from "@mui/icons-material/Save";
import SchoolIcon from "@mui/icons-material/School";

interface FormData {
  name: string;
  pin: string;
  faculty: string;
  program: string;
  courseCode: string;
  year: string;
  companyName: string;
  companyAddress: string;
  supervisorName: string;
  supervisorDesignation: string;
  supervisorTelephone: string;
  supervisorMobile: string;
  attachmentFrom: string;
  attachmentTo: string;
}

export default function Register() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState<FormData>({
    name: "",
    pin: "",
    faculty: "Faculty of Technology",
    program: "",
    courseCode: "",
    year: "",
    companyName: "",
    companyAddress: "",
    supervisorName: "",
    supervisorDesignation: "",
    supervisorTelephone: "",
    supervisorMobile: "",
    attachmentFrom: "",
    attachmentTo: "",
  });

  const [isEdit, setIsEdit] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);

  useEffect(() => {
    if (status !== "authenticated") return;
    fetch("/api/student")
      .then((r) => r.json())
      .then((data) => {
        if (data.registered && data.student) {
          setIsEdit(true);
          const s = data.student;
          setForm({
            name: s.name || "",
            pin: s.pin || "",
            faculty: s.faculty || "Faculty of Technology",
            program: s.program || "",
            courseCode: s.courseCode || "",
            year: s.year || "",
            companyName: s.companyName || "",
            companyAddress: s.companyAddress || "",
            supervisorName: s.supervisorName || "",
            supervisorDesignation: s.supervisorDesignation || "",
            supervisorTelephone: s.supervisorTelephone || "",
            supervisorMobile: s.supervisorMobile || "",
            attachmentFrom: s.attachmentFrom || "",
            attachmentTo: s.attachmentTo || "",
          });
        }
        setLoadingProfile(false);
      });
  }, [status]);

  const update = (field: keyof FormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!form.name || !form.pin) {
      setError("Name and PIN are required.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/student", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("Failed to save");
      router.push("/dashboard");
    } catch {
      setError("Failed to save student details.");
    } finally {
      setSaving(false);
    }
  };

  if (status === "loading" || loadingProfile) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }
  if (!session) {
    router.push("/");
    return null;
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Box sx={{ textAlign: "center", mb: 4 }}>
        <SchoolIcon sx={{ fontSize: 48, color: "primary.main", mb: 1 }} />
        <Typography variant="h4" gutterBottom>
          {isEdit ? "Edit Profile" : "Student Registration"}
        </Typography>
        <Typography variant="body1" color="text.secondary">
          {isEdit
            ? "Update your student and attachment details."
            : "Fill in your details to set up your attachment logbook."}
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Personal Details
        </Typography>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              label="Full Name"
              fullWidth
              required
              value={form.name}
              onChange={(e) => update("name", e.target.value)}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              label="PIN Number"
              fullWidth
              required
              value={form.pin}
              onChange={(e) => update("pin", e.target.value)}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              label="Faculty"
              fullWidth
              value={form.faculty}
              onChange={(e) => update("faculty", e.target.value)}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              label="Program"
              fullWidth
              placeholder="e.g. BITH"
              value={form.program}
              onChange={(e) => update("program", e.target.value)}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              label="Course Code"
              fullWidth
              placeholder="e.g. BITH488"
              value={form.courseCode}
              onChange={(e) => update("courseCode", e.target.value)}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              label="Year / Stage of Study"
              fullWidth
              value={form.year}
              onChange={(e) => update("year", e.target.value)}
            />
          </Grid>
        </Grid>
      </Paper>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Company / Attachment Details
        </Typography>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              label="Company Name"
              fullWidth
              value={form.companyName}
              onChange={(e) => update("companyName", e.target.value)}
            />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <TextField
              label="Company Address"
              fullWidth
              value={form.companyAddress}
              onChange={(e) => update("companyAddress", e.target.value)}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              label="Attachment From"
              type="date"
              fullWidth
              slotProps={{ inputLabel: { shrink: true } }}
              value={form.attachmentFrom}
              onChange={(e) => update("attachmentFrom", e.target.value)}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              label="Attachment To"
              type="date"
              fullWidth
              slotProps={{ inputLabel: { shrink: true } }}
              value={form.attachmentTo}
              onChange={(e) => update("attachmentTo", e.target.value)}
            />
          </Grid>
        </Grid>
      </Paper>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Industry Supervisor
        </Typography>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              label="Supervisor Name"
              fullWidth
              value={form.supervisorName}
              onChange={(e) => update("supervisorName", e.target.value)}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              label="Designation"
              fullWidth
              value={form.supervisorDesignation}
              onChange={(e) => update("supervisorDesignation", e.target.value)}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              label="Telephone"
              fullWidth
              value={form.supervisorTelephone}
              onChange={(e) => update("supervisorTelephone", e.target.value)}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              label="Mobile"
              fullWidth
              value={form.supervisorMobile}
              onChange={(e) => update("supervisorMobile", e.target.value)}
            />
          </Grid>
        </Grid>
      </Paper>

      <Divider sx={{ my: 2 }} />

      <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
        <Button
          variant="contained"
          size="large"
          startIcon={saving ? <CircularProgress size={20} /> : <SaveIcon />}
          onClick={handleSubmit}
          disabled={saving}
        >
          {saving ? "Saving..." : "Save & Continue"}
        </Button>
      </Box>
    </Container>
  );
}
