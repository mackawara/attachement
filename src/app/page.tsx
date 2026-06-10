"use client";

import { useSession, signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import {
  Container,
  Box,
  Typography,
  Button,
  Paper,
  Stack,
  Snackbar,
  Alert,
  TextField,
  Divider,
} from "@mui/material";
import GitHubIcon from "@mui/icons-material/GitHub";
import MenuBookIcon from "@mui/icons-material/MenuBook";

function HomeContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const error = searchParams.get("error");
  const [snackOpen, setSnackOpen] = useState(
    () => error === "AccessDenied" || error === "CredentialsSignin",
  );
  const [email, setEmail] = useState("");

  useEffect(() => {
    if (!session) return;
    const role = session.user?.role;
    if (role === "supervisor") router.push("/supervisor");
    else if (role === "student") router.push("/dashboard");
    else router.push("/role-select");
  }, [session, router]);

  if (status === "loading") return null;

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          minHeight: "80vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Paper elevation={3} sx={{ p: 5, textAlign: "center", width: "100%" }}>
          <MenuBookIcon sx={{ fontSize: 64, color: "primary.main", mb: 2 }} />
          <Typography variant="h4" gutterBottom>
            ZOU Attachment Logbook
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
            Digital logbook for tracking your weekly attachment progress.
            AI-powered to expand your brief notes into comprehensive reports.
          </Typography>
          <Stack spacing={2}>
            <Button
              variant="contained"
              size="large"
              startIcon={<GitHubIcon />}
              onClick={() => signIn("github", { callbackUrl: "/dashboard" })}
            >
              Sign in with GitHub
            </Button>
            <Button
              variant="outlined"
              size="large"
              startIcon={
                <svg width="20" height="20" viewBox="0 0 48 48">
                  <path fill="#4285F4" d="M47.5 24.5c0-1.6-.1-3.2-.4-4.7H24v9h13.1c-.6 3-2.3 5.5-4.9 7.2v6h7.9c4.6-4.3 7.4-10.6 7.4-17.5z"/>
                  <path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.9-6c-2.1 1.4-4.8 2.3-8 2.3-6.2 0-11.4-4.2-13.3-9.8H2.6v6.2C6.5 42.8 14.7 48 24 48z"/>
                  <path fill="#FBBC05" d="M10.7 28.7c-.5-1.4-.8-2.9-.8-4.7s.3-3.3.8-4.7v-6.2H2.6C.9 16.6 0 20.2 0 24s.9 7.4 2.6 10.9l8.1-6.2z"/>
                  <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9 3.5l6.7-6.7C35.9 2.4 30.4 0 24 0 14.7 0 6.5 5.2 2.6 13.1l8.1 6.2C12.6 13.7 17.8 9.5 24 9.5z"/>
                </svg>
              }
              onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
            >
              Sign in with Google
            </Button>
          </Stack>

          <Divider sx={{ my: 3 }}>Supervisors</Divider>

          <Box
            component="form"
            onSubmit={(e) => {
              e.preventDefault();
              signIn("supervisor-email", {
                email,
                callbackUrl: "/supervisor",
              });
            }}
          >
            <Stack spacing={2}>
              <TextField
                type="email"
                label="Supervisor email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                fullWidth
              />
              <Button
                type="submit"
                variant="contained"
                color="secondary"
                size="large"
                disabled={!email.trim()}
              >
                Sign in with email
              </Button>
            </Stack>
          </Box>
        </Paper>
      </Box>
      <Snackbar
        open={snackOpen}
        autoHideDuration={6000}
        onClose={() => setSnackOpen(false)}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          onClose={() => setSnackOpen(false)}
          severity="error"
          variant="filled"
          sx={{ width: "100%" }}
        >
          Access denied — your email is not on the approved list. Contact your
          administrator.
        </Alert>
      </Snackbar>
    </Container>
  );
}

export default function Home() {
  return (
    <Suspense>
      <HomeContent />
    </Suspense>
  );
}
