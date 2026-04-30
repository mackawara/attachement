"use client";

import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
} from "@mui/material";
import { useSession, signIn, signOut } from "next-auth/react";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import GitHubIcon from "@mui/icons-material/GitHub";
import LogoutIcon from "@mui/icons-material/Logout";
import Link from "next/link";

export default function Navbar() {
  const { data: session } = useSession();

  return (
    <AppBar position="sticky">
      <Toolbar>
        <MenuBookIcon sx={{ mr: 1 }} />
        <Typography
          variant="h6"
          component={Link}
          href="/dashboard"
          sx={{ flexGrow: 1, textDecoration: "none", color: "inherit" }}
        >
          Attachment Logbook
        </Typography>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          {session ? (
            <>
              <Typography variant="body2">{session.user?.name}</Typography>
              <Button
                color="inherit"
                startIcon={<LogoutIcon />}
                onClick={() => signOut({ callbackUrl: "/" })}
              >
                Logout
              </Button>
            </>
          ) : (
            <Button
              color="inherit"
              startIcon={<GitHubIcon />}
              onClick={() => signIn("github")}
            >
              Sign In
            </Button>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
}
