function getAllowedEmails(): string[] {
  return (process.env.ALLOWED_EMAILS || "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export function isGitHubUserAllowed(
  _username: string,
  email: string | null,
): boolean {
  const allowed = getAllowedEmails();
  if (allowed.length === 0) return true;
  return !!email && allowed.includes(email.toLowerCase());
}
