const KST_OFFSET = "+09:00";
const DAY_IN_MILLISECONDS = 24 * 60 * 60 * 1000;

export interface MetricsDateRange {
  from: string;
  to: string;
}

function parseDateOnly(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return null;
  }

  const parsed = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed.toISOString().slice(0, 10) === value ? parsed : null;
}

function addUtcDays(value: string, days: number): string | null {
  const parsed = parseDateOnly(value);
  if (!parsed) {
    return null;
  }

  return new Date(parsed.getTime() + days * DAY_IN_MILLISECONDS)
    .toISOString()
    .slice(0, 10);
}

function addUtcMonths(value: string, months: number): string | null {
  const parsed = parseDateOnly(value);
  if (!parsed) {
    return null;
  }

  const day = parsed.getUTCDate();
  const next = new Date(
    Date.UTC(parsed.getUTCFullYear(), parsed.getUTCMonth() + months, 1),
  );
  const lastDayOfMonth = new Date(
    Date.UTC(next.getUTCFullYear(), next.getUTCMonth() + 1, 0),
  ).getUTCDate();
  next.setUTCDate(Math.min(day, lastDayOfMonth));
  return next.toISOString().slice(0, 10);
}

export function toKstApiRange(
  fromDate: string,
  throughDate: string,
): MetricsDateRange | null {
  const from = parseDateOnly(fromDate);
  const through = parseDateOnly(throughDate);
  const exclusiveToDate = addUtcDays(throughDate, 1);

  if (!from || !through || !exclusiveToDate || from > through) {
    return null;
  }

  return {
    from: `${fromDate}T00:00:00${KST_OFFSET}`,
    to: `${exclusiveToDate}T00:00:00${KST_OFFSET}`,
  };
}

export function isLongerThan24Months(
  fromDate: string,
  throughDate: string,
): boolean {
  const exclusiveToDate = addUtcDays(throughDate, 1);
  const maximumExclusiveToDate = addUtcMonths(fromDate, 24);

  if (!exclusiveToDate || !maximumExclusiveToDate) {
    return false;
  }

  return exclusiveToDate > maximumExclusiveToDate;
}

export function getKstDateInputValue(isoValue: string): string {
  const parsed = new Date(isoValue);
  if (Number.isNaN(parsed.getTime())) {
    return "";
  }

  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(parsed);
  const values = Object.fromEntries(
    parts.map((part) => [part.type, part.value]),
  );
  return `${values.year}-${values.month}-${values.day}`;
}

export function getThroughDateInputValue(exclusiveToIso: string): string {
  const parsed = new Date(exclusiveToIso);
  if (Number.isNaN(parsed.getTime())) {
    return "";
  }

  return getKstDateInputValue(
    new Date(parsed.getTime() - DAY_IN_MILLISECONDS).toISOString(),
  );
}
