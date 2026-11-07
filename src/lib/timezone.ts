export const DEFAULT_TIMEZONE = "Africa/Johannesburg";

/**
 * Returns YYYY-MM-DD formatted date in the target timezone (default: Africa/Johannesburg GMT+2).
 */
export function getLocalDateString(
  date: Date = new Date(),
  timeZone: string = DEFAULT_TIMEZONE
): string {
  try {
    const formatter = new Intl.DateTimeFormat("en-CA", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    return formatter.format(date);
  } catch {
    // Fallback if invalid timezone is provided
    const sastOffsetMs = 2 * 60 * 60 * 1000;
    const sastDate = new Date(date.getTime() + sastOffsetMs);
    return sastDate.toISOString().slice(0, 10);
  }
}

/**
 * Computes time remaining until 00:00:00 midnight in the group's timezone.
 */
export function getTimeUntilMidnightReset(
  now: Date = new Date(),
  timeZone: string = DEFAULT_TIMEZONE
): { hours: number; minutes: number; seconds: number; formatted: string } {
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone,
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }).formatToParts(now);

    const h = parseInt(parts.find((p) => p.type === "hour")?.value || "0", 10) % 24;
    const m = parseInt(parts.find((p) => p.type === "minute")?.value || "0", 10);
    const s = parseInt(parts.find((p) => p.type === "second")?.value || "0", 10);

    const elapsedSeconds = h * 3600 + m * 60 + s;
    const remainingSeconds = Math.max(0, 86400 - elapsedSeconds);

    const hours = Math.floor(remainingSeconds / 3600);
    const minutes = Math.floor((remainingSeconds % 3600) / 60);
    const seconds = remainingSeconds % 60;

    const pad = (n: number) => String(n).padStart(2, "0");
    return {
      hours,
      minutes,
      seconds,
      formatted: `${pad(hours)}h ${pad(minutes)}m ${pad(seconds)}s`,
    };
  } catch {
    return { hours: 0, minutes: 0, seconds: 0, formatted: "00h 00m 00s" };
  }
}

/**
 * Returns the date string offset by N days (e.g., -1 for yesterday in SAST).
 */
export function getOffsetDateString(
  daysOffset: number,
  baseDate: Date = new Date(),
  timeZone: string = DEFAULT_TIMEZONE
): string {
  const shifted = new Date(baseDate.getTime() + daysOffset * 86400 * 1000);
  return getLocalDateString(shifted, timeZone);
}

