"use client";

import { useSession } from "next-auth/react";
import { apiFetch } from "@/lib/api";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Container,
  Typography,
  Button,
  Box,
  Card,
  CardContent,
  CardActions,
  Grid,
  Chip,
  CircularProgress,
  IconButton,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DownloadIcon from "@mui/icons-material/Download";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import PersonIcon from "@mui/icons-material/Person";

interface Week {
  _id: string;
  weekNumber: number;
  weekEnding: string;
  weeklyReport: string;
}

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [weeks, setWeeks] = useState<Week[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/");
    if (status === "authenticated") {
      const role = session?.user?.role;
      if (!role) router.push("/role-select");
      else if (role === "supervisor") router.push("/supervisor");
    }
  }, [status, session, router]);

  useEffect(() => {
    if (status !== "authenticated") return;

    apiFetch("/api/student")
      .then((r) => r.json())
      .then((data) => {
        if (!data.registered) {
          router.push("/register");
          return;
        }
        return apiFetch("/api/weeks");
      })
      .then((r) => r?.json())
      .then((data) => {
        if (data) setWeeks(data);
        setLoading(false);
      });
  }, [status, router]);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this week?")) return;
    await apiFetch(`/api/weeks/${id}`, { method: "DELETE" });
    setWeeks((prev) => prev.filter((w) => w._id !== id));
  };

  const handleDownload = async () => {
    const res = await apiFetch("/api/docx");
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "ZOU_ATTACHMENT_LOGBOOK.docx";
    a.click();
    URL.revokeObjectURL(url);
  };

  if (status === "loading" || !session) return null;

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 4,
        }}
      >
        <Typography variant="h4">Weekly Progress</Typography>
        <Box sx={{ display: "flex", gap: 1 }}>
          <Button
            variant="text"
            startIcon={<PersonIcon />}
            onClick={() => router.push("/register")}
          >
            Profile
          </Button>
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={handleDownload}
            disabled={weeks.length === 0}
          >
            Download Logbook
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => router.push("/week/new")}
          >
            New Week
          </Button>
        </Box>
      </Box>

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
          <CircularProgress />
        </Box>
      ) : weeks.length === 0 ? (
        <Card sx={{ textAlign: "center", py: 8 }}>
          <CardContent>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No weeks logged yet
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Start by adding your first weekly progress entry.
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => router.push("/week/new")}
            >
              Add Week 1
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Grid container spacing={3}>
          {weeks.map((week) => (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={week._id}>
              <Card sx={{ height: "100%" }}>
                <CardContent>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      mb: 1,
                    }}
                  >
                    <Typography variant="h6">
                      Week {week.weekNumber}
                    </Typography>
                    <Chip
                      label={`Ending: ${week.weekEnding}`}
                      size="small"
                      color="primary"
                      variant="outlined"
                    />
                  </Box>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      display: "-webkit-box",
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: "vertical",
                    }}
                  >
                    {week.weeklyReport || "No report yet"}
                  </Typography>
                </CardContent>
                <CardActions>
                  <Button
                    size="small"
                    startIcon={<EditIcon />}
                    onClick={() => router.push(`/week/${week._id}`)}
                  >
                    View / Edit
                  </Button>
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => handleDelete(week._id)}
                    sx={{ ml: "auto" }}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Container>
  );
}
