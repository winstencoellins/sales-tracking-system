const TZ = "Asia/Jakarta";

/** Local calendar date YYYY-MM-DD in Asia/Jakarta. */
export function todayKeyJakarta(now = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

/** Shift a YYYY-MM-DD key by `delta` days (calendar arithmetic). */
export function shiftDateKey(dateKey: string, delta: number): string {
  const [y, m, d] = dateKey.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + delta));
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${dt.getUTCFullYear()}-${pad(dt.getUTCMonth() + 1)}-${pad(dt.getUTCDate())}`;
}

export function startOfDayJakarta(dateKey: string): Date {
  return new Date(`${dateKey}T00:00:00+07:00`);
}

export function endOfDayJakarta(dateKey: string): Date {
  return new Date(`${dateKey}T23:59:59.999+07:00`);
}

const DATE_KEY_RE = /^\d{4}-\d{2}-\d{2}$/;

export function isDateKey(value: string): boolean {
  if (!DATE_KEY_RE.test(value)) return false;
  const [y, m, d] = value.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return (
    dt.getUTCFullYear() === y &&
    dt.getUTCMonth() === m - 1 &&
    dt.getUTCDate() === d
  );
}

/** Equal-length prior window ending the day before `from`. */
export function resolveDateRangeWindow(
  from: string,
  to: string,
): { from: string; to: string; priorFrom: string; priorTo: string } {
  const spanDays =
    Math.round(
      (Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) /
        86_400_000,
    ) + 1;

  const priorTo = shiftDateKey(from, -1);
  const priorFrom = shiftDateKey(priorTo, -(spanDays - 1));

  return { from, to, priorFrom, priorTo };
}

/** Inclusive oldest→newest list of the last `n` local days ending at `endKey`. */
export function lastNDateKeys(endKey: string, n: number): string[] {
  const keys: string[] = [];
  for (let i = n - 1; i >= 0; i--) {
    keys.push(shiftDateKey(endKey, -i));
  }
  return keys;
}
