"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession, signIn } from "next-auth/react";
import {
  Container,
  Box,
  Typography,
  Button,
  Paper,
  Stack,
  Snackbar,
  Alert,
} from "@mui/material";
import GitHubIcon from "@mui/icons-material/GitHub";
import MenuBookIcon from "@mui/icons-material/MenuBook";

function SignInContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";
  const error = searchParams.get("error");
  const [snackOpen, setSnackOpen] = useState(() => !!error);

  useEffect(() => {
    if (session) router.push(callbackUrl);
  }, [session, router, callbackUrl]);

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
            Sign in
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
            Use your approved GitHub account to access the attachment logbook.
          </Typography>
          <Stack spacing={2}>
            <Button
              variant="contained"
              size="large"
              startIcon={<GitHubIcon />}
              onClick={() => signIn("github", { callbackUrl })}
            >
              Continue with GitHub
            </Button>
          </Stack>
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
          {error === "AccessDenied"
            ? "Access denied — your email is not on the approved list. Contact your administrator."
            : "Sign-in failed. Please try again."}
        </Alert>
      </Snackbar>
    </Container>
  );
}

export default function SignInPage() {
  return (
    <Suspense>
      <SignInContent />
    </Suspense>
  );
}
