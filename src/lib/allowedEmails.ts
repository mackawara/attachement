function getAllowedEmails(): string[] {
  return (process.env.ALLOWED_EMAILS || "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export function isEmailAllowed(email: string | null | undefined): boolean {
  const allowed = getAllowedEmails();
  if (allowed.length === 0) return true;
  return !!email && allowed.includes(email.toLowerCase());
}

export function isGitHubUserAllowed(
  _username: string,
  email: string | null,
): boolean {
  return isEmailAllowed(email);
}
