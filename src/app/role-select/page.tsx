"use client";

import { useSession } from "next-auth/react";
import { apiFetch } from "@/lib/api";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Container,
  Box,
  Typography,
  Card,
  CardActionArea,
  CardContent,
  Stack,
  CircularProgress,
  Alert,
} from "@mui/material";
import SchoolIcon from "@mui/icons-material/School";
import SupervisorAccountIcon from "@mui/icons-material/SupervisorAccount";

export default function RoleSelect() {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const [submitting, setSubmitting] = useState<"student" | "supervisor" | null>(
    null,
  );
  const [error, setError] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") router.push("/");
  }, [status, router]);

  useEffect(() => {
    if (status !== "authenticated") return;
    if (session?.user?.role === "student") router.replace("/dashboard");
    if (session?.user?.role === "supervisor") router.replace("/supervisor");
  }, [status, session, router]);

  const pick = async (role: "student" | "supervisor") => {
    setSubmitting(role);
    setError("");
    try {
      const res = await apiFetch("/api/role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });
      if (!res.ok) throw new Error("Failed to set role");
      await update();
      router.replace(role === "student" ? "/dashboard" : "/supervisor");
    } catch {
      setError("Could not save your selection. Please try again.");
      setSubmitting(null);
    }
  };

  if (status === "loading" || !session) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="sm" sx={{ py: 6 }}>
      <Box sx={{ textAlign: "center", mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Welcome, {session.user?.name ?? "there"}
        </Typography>
        <Typography variant="body1" color="text.secondary">
          How are you using this logbook?
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Stack spacing={2}>
        <Card variant="outlined">
          <CardActionArea
            disabled={submitting !== null}
            onClick={() => pick("student")}
          >
            <CardContent
              sx={{ display: "flex", alignItems: "center", gap: 2, p: 3 }}
            >
              <SchoolIcon sx={{ fontSize: 40, color: "primary.main" }} />
              <Box>
                <Typography variant="h6">I&apos;m a student</Typography>
                <Typography variant="body2" color="text.secondary">
                  Track my weekly attachment progress and submit it to my
                  supervisor.
                </Typography>
              </Box>
              {submitting === "student" && (
                <CircularProgress size={20} sx={{ ml: "auto" }} />
              )}
            </CardContent>
          </CardActionArea>
        </Card>

        <Card variant="outlined">
          <CardActionArea
            disabled={submitting !== null}
            onClick={() => pick("supervisor")}
          >
            <CardContent
              sx={{ display: "flex", alignItems: "center", gap: 2, p: 3 }}
            >
              <SupervisorAccountIcon
                sx={{ fontSize: 40, color: "primary.main" }}
              />
              <Box>
                <Typography variant="h6">I&apos;m a supervisor</Typography>
                <Typography variant="body2" color="text.secondary">
                  Review my students&apos; submissions and add comments.
                </Typography>
              </Box>
              {submitting === "supervisor" && (
                <CircularProgress size={20} sx={{ ml: "auto" }} />
              )}
            </CardContent>
          </CardActionArea>
        </Card>
      </Stack>
    </Container>
  );
}
