export function rupiah(n: number | string | null | undefined): string {
  const value = Math.round(Number(n) || 0);
  return `Rp ${value.toLocaleString("id-ID")}`;
}

export function formatTanggal(iso: string | Date): string {
  const d = typeof iso === "string" ? new Date(iso) : iso;
  return (
    d.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }) +
    ", " +
    d.toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
    })
  );
}

const GREETING_TZ = "Asia/Jakarta";

/** Time-of-day greeting in Asia/Jakarta (pagi / siang / sore / malam). */
export function timeOfDayGreeting(now = new Date()): string {
  const hour = Number(
    new Intl.DateTimeFormat("en-GB", {
      timeZone: GREETING_TZ,
      hour: "numeric",
      hour12: false,
    }).format(now),
  );

  if (hour >= 5 && hour < 11) return "Good morning";
  if (hour >= 11 && hour < 15) return "Good afternoon";
  if (hour >= 15 && hour < 19) return "Good evening";
  return "Good night";
}

/** First name for header greeting. */
export function firstName(fullName: string | null | undefined): string {
  const trimmed = (fullName ?? "").trim();
  if (!trimmed) return "there";
  return trimmed.split(/\s+/)[0] ?? "there";
}

/** Format a YYYY-MM-DD date input value for display (id-ID). */
export function formatDateInput(dateStr: string): string {
  if (!dateStr) return "";
  const [y, m, d] = dateStr.split("-").map(Number);
  if (!y || !m || !d) return dateStr;
  return new Date(y, m - 1, d).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/** Start of local day → ISO for API filter `from`. */
export function dateInputToStartIso(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d, 0, 0, 0, 0).toISOString();
}

/** End of local day → ISO for API filter `to`. */
export function dateInputToEndIso(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d, 23, 59, 59, 999).toISOString();
}

export function toDatetimeLocalValue(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/** Local calendar date as YYYY-MM-DD (for `<input type="date">`). */
export function toDateInputValue(date: Date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** Local YYYY-MM-DD key for a soldAt timestamp. */
export function localDateKey(iso: string | Date): string {
  const d = typeof iso === "string" ? new Date(iso) : iso;
  return toDateInputValue(d);
}

/** Group header label: HARI INI / KEMARIN / 12 Jul 2026 */
export function formatDayGroupLabel(
  dateKey: string,
  options?: { relative?: boolean },
): string {
  const relative = options?.relative ?? true;
  if (relative) {
    const today = toDateInputValue();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    if (dateKey === today) return "HARI INI";
    if (dateKey === toDateInputValue(yesterday)) return "KEMARIN";
  }
  return formatDateInput(dateKey).toUpperCase();
}

/** Inclusive list of local YYYY-MM-DD keys from `from` to `to` (newest first). */
export function eachDateKeyInRange(from: string, to: string): string[] {
  if (!from || !to) return [];
  const [fy, fm, fd] = from.split("-").map(Number);
  const [ty, tm, td] = to.split("-").map(Number);
  if (!fy || !fm || !fd || !ty || !tm || !td) return [];

  const keys: string[] = [];
  const cursor = new Date(fy, fm - 1, fd);
  const end = new Date(ty, tm - 1, td);
  if (cursor > end) return [];

  while (cursor <= end) {
    keys.push(toDateInputValue(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return keys.reverse();
}
