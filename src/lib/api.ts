const base = process.env.NEXT_PUBLIC_BASEPATH ?? '';

export const apiFetch = (path: string, init?: RequestInit) =>
  fetch(`${base}${path}`, init);
