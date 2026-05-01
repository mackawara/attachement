"use client";

import { useSession } from "next-auth/react";
import { apiFetch } from "@/lib/api";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  CircularProgress,
  Chip,
  Stack,
  Divider,
  Button,
  Alert,
} from "@mui/material";
import SupervisorAccountIcon from "@mui/icons-material/SupervisorAccount";

interface SupWeek {
  _id: string;
  weekNumber: number;
  weekEnding: string;
  supervisorComment: string;
  supervisorCommentAt: string | null;
}

interface SupStudent {
  _id: string;
  name: string;
  pin: string;
  program: string;
  companyName: string;
  weeks: SupWeek[];
}

export default function SupervisorHome() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [students, setStudents] = useState<SupStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") router.push("/");
    if (status === "authenticated") {
      const role = session?.user?.role;
      if (!role) router.push("/role-select");
      else if (role === "student") router.push("/dashboard");
    }
  }, [status, session, router]);

  useEffect(() => {
    if (status !== "authenticated" || session?.user?.role !== "supervisor")
      return;

    apiFetch("/api/supervisor/students")
      .then(async (r) => {
        if (!r.ok) throw new Error(await r.text());
        return r.json();
      })
      .then((data) => {
        setStudents(data);
        setLoading(false);
      })
      .catch(() => {
        setError("Could not load students.");
        setLoading(false);
      });
  }, [status, session]);

  if (status === "loading" || !session) return null;

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 2,
          mb: 4,
        }}
      >
        <SupervisorAccountIcon sx={{ fontSize: 40, color: "primary.main" }} />
        <Box>
          <Typography variant="h4">Student Submissions</Typography>
          <Typography variant="body2" color="text.secondary">
            Signed in as {session.user?.email}
          </Typography>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
          <CircularProgress />
        </Box>
      ) : students.length === 0 ? (
        <Card sx={{ textAlign: "center", py: 8 }}>
          <CardContent>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No students assigned yet
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Students will appear here once they list your email
              ({session.user?.email}) as their supervisor.
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <Stack spacing={3}>
          {students.map((student) => (
            <Card key={student._id}>
              <CardContent>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    gap: 2,
                    mb: 2,
                  }}
                >
                  <Box>
                    <Typography variant="h6">{student.name}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {student.pin}
                      {student.program ? ` · ${student.program}` : ""}
                      {student.companyName ? ` · ${student.companyName}` : ""}
                    </Typography>
                  </Box>
                  <Button
                    size="small"
                    variant="text"
                    onClick={() =>
                      router.push(`/supervisor/student/${student._id}`)
                    }
                  >
                    View Profile
                  </Button>
                </Box>
                <Divider sx={{ mb: 2 }} />
                {student.weeks.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">
                    No weeks submitted yet.
                  </Typography>
                ) : (
                  <Stack spacing={1}>
                    {student.weeks.map((w) => (
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
                          <Typography variant="subtitle1">
                            Week {w.weekNumber}
                          </Typography>
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
                            onClick={() =>
                              router.push(`/supervisor/week/${w._id}`)
                            }
                          >
                            Review
                          </Button>
                        </Box>
                      </Box>
                    ))}
                  </Stack>
                )}
              </CardContent>
            </Card>
          ))}
        </Stack>
      )}
    </Container>
  );
}
