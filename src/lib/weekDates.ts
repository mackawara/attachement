// Pure helpers for working out the default week number and week-ending date
// of the next logbook entry. Dates are "YYYY-MM-DD" strings (the format the
// <input type="date"> fields use) and all arithmetic is done in UTC so that
// server/browser time zones never shift a date by a day.

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const FRIDAY = 5;

function parseIsoDate(value: string | null | undefined): Date | null {
  if (!value || !ISO_DATE.test(value)) return null;
  const [y, m, d] = value.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  // Reject impossible dates such as 2026-02-31.
  if (
    date.getUTCFullYear() !== y ||
    date.getUTCMonth() !== m - 1 ||
    date.getUTCDate() !== d
  ) {
    return null;
  }
  return date;
}

function toIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function addDays(value: string, days: number): string | null {
  const date = parseIsoDate(value);
  if (!date) return null;
  date.setUTCDate(date.getUTCDate() + days);
  return toIsoDate(date);
}

/** The Friday on or after the given date (the date itself if it is a Friday). */
export function fridayOnOrAfter(value: string): string | null {
  const date = parseIsoDate(value);
  if (!date) return null;
  const offset = (FRIDAY - date.getUTCDay() + 7) % 7;
  date.setUTCDate(date.getUTCDate() + offset);
  return toIsoDate(date);
}

export function todayIso(now: Date = new Date()): string {
  // Use the local calendar date of `now`, not its UTC date.
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export interface WeekSummary {
  weekNumber: number;
  weekEnding: string;
}

export interface NextWeekDefaults {
  weekNumber: number;
  weekEnding: string;
  /** Where the date came from, so the UI can explain the pre-fill. */
  basis: "previous-week" | "attachment-start" | "today";
}

/**
 * Defaults for the next week:
 * - week number: one more than the highest existing week number (or 1);
 * - week ending: the latest week's ending date + 7 days. For the first week,
 *   the first Friday on/after the attachment start date, falling back to the
 *   Friday of the current week.
 */
export function nextWeekDefaults(
  weeks: WeekSummary[],
  attachmentFrom?: string | null,
  today: string = todayIso(),
): NextWeekDefaults {
  const safeToday = parseIsoDate(today) ? today : todayIso();
  const fallbackEnding = fridayOnOrAfter(safeToday) ?? safeToday;

  const latest = weeks.reduce<WeekSummary | null>(
    (best, w) =>
      Number.isFinite(w.weekNumber) && (!best || w.weekNumber > best.weekNumber)
        ? w
        : best,
    null,
  );

  if (latest) {
    const ending = addDays(latest.weekEnding, 7);
    return {
      weekNumber: latest.weekNumber + 1,
      weekEnding: ending ?? fallbackEnding,
      basis: ending ? "previous-week" : "today",
    };
  }

  const fromStart = attachmentFrom ? fridayOnOrAfter(attachmentFrom) : null;
  return {
    weekNumber: 1,
    weekEnding: fromStart ?? fallbackEnding,
    basis: fromStart ? "attachment-start" : "today",
  };
}
