import {
  CRON_FIELD_SPECS,
  type CronAtomicField,
  type CronExpression,
  type CronField,
  type CronParseError,
  parseCronExpression,
} from "./cron";

export type CronTimeZoneMode = "local" | "utc";

export type CronScheduleSummary =
  | {
      ok: true;
      description: string;
      nextRuns: Date[];
    }
  | {
      ok: false;
      error: CronParseError;
    };

const WEEKDAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

function expandAtomicField(field: CronAtomicField, min: number, max: number): number[] {
  if (field.kind === "wildcard") {
    return Array.from({ length: max - min + 1 }, (_, index) => min + index);
  }

  if (field.kind === "value") {
    return [field.value];
  }

  return Array.from({ length: field.end - field.start + 1 }, (_, index) => field.start + index);
}

function expandField(field: CronField, min: number, max: number): number[] {
  if (field.kind === "list") {
    return [...new Set(field.items.flatMap((item) => expandAtomicField(item, min, max)))].sort(
      (left, right) => left - right
    );
  }

  if (field.kind === "step") {
    const baseValues = expandAtomicField(field.base, min, max);
    const stepStart = field.base.kind === "wildcard" ? min : baseValues[0];

    return baseValues.filter((value) => (value - stepStart) % field.step === 0);
  }

  return expandAtomicField(field, min, max);
}

function isWildcard(field: CronField): boolean {
  return field.kind === "wildcard";
}

function formatTime(hour: number, minute: number): string {
  return `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
}

function describeTime(expression: CronExpression): string {
  if (
    expression.minute.kind === "step" &&
    expression.minute.base.kind === "wildcard" &&
    expression.hour.kind === "wildcard"
  ) {
    return `Every ${expression.minute.step} minutes`;
  }

  if (expression.minute.kind === "wildcard" && expression.hour.kind === "wildcard") {
    return "Every minute";
  }

  if (expression.minute.kind === "value" && expression.hour.kind === "value") {
    return `At ${formatTime(expression.hour.value, expression.minute.value)}`;
  }

  if (expression.minute.kind === "value" && expression.hour.kind === "wildcard") {
    return `At minute ${expression.minute.value} past every hour`;
  }

  return `Runs on a custom ${expression.minute.raw} ${expression.hour.raw} schedule`;
}

function describeDayAndMonth(expression: CronExpression): string {
  const hasDayOfMonth = !isWildcard(expression.dayOfMonth);
  const hasMonth = !isWildcard(expression.month);
  const hasDayOfWeek = !isWildcard(expression.dayOfWeek);

  if (!hasDayOfMonth && !hasMonth && !hasDayOfWeek) {
    return "every day";
  }

  if (!hasDayOfMonth && !hasMonth && expression.dayOfWeek.kind === "value") {
    return `on ${WEEKDAY_NAMES[expression.dayOfWeek.value]}`;
  }

  if (expression.dayOfMonth.kind === "value" && !hasMonth && !hasDayOfWeek) {
    return `on day ${expression.dayOfMonth.value} of every month`;
  }

  return `when ${expression.dayOfMonth.raw} ${expression.month.raw} ${expression.dayOfWeek.raw} matches`;
}

function getDatePart(
  date: Date,
  mode: CronTimeZoneMode,
  field: "minute" | "hour" | "day" | "month" | "weekday"
) {
  if (mode === "utc") {
    if (field === "minute") return date.getUTCMinutes();
    if (field === "hour") return date.getUTCHours();
    if (field === "day") return date.getUTCDate();
    if (field === "month") return date.getUTCMonth() + 1;
    return date.getUTCDay();
  }

  if (field === "minute") return date.getMinutes();
  if (field === "hour") return date.getHours();
  if (field === "day") return date.getDate();
  if (field === "month") return date.getMonth() + 1;
  return date.getDay();
}

function roundUpToNextMinute(date: Date, mode: CronTimeZoneMode): Date {
  const next = new Date(date.getTime());

  if (mode === "utc") {
    next.setUTCSeconds(0, 0);
    next.setUTCMinutes(next.getUTCMinutes() + 1);
    return next;
  }

  next.setSeconds(0, 0);
  next.setMinutes(next.getMinutes() + 1);
  return next;
}

function addOneMinute(date: Date, mode: CronTimeZoneMode): Date {
  const next = new Date(date.getTime());
  if (mode === "utc") {
    next.setUTCMinutes(next.getUTCMinutes() + 1);
    return next;
  }

  next.setMinutes(next.getMinutes() + 1);
  return next;
}

function matchesDate(expression: CronExpression, date: Date, mode: CronTimeZoneMode): boolean {
  const minuteMatches = expandField(
    expression.minute,
    CRON_FIELD_SPECS.minute.min,
    CRON_FIELD_SPECS.minute.max
  ).includes(getDatePart(date, mode, "minute"));
  const hourMatches = expandField(
    expression.hour,
    CRON_FIELD_SPECS.hour.min,
    CRON_FIELD_SPECS.hour.max
  ).includes(getDatePart(date, mode, "hour"));
  const monthMatches = expandField(
    expression.month,
    CRON_FIELD_SPECS.month.min,
    CRON_FIELD_SPECS.month.max
  ).includes(getDatePart(date, mode, "month"));
  const dayOfMonthMatches = expandField(
    expression.dayOfMonth,
    CRON_FIELD_SPECS.dayOfMonth.min,
    CRON_FIELD_SPECS.dayOfMonth.max
  ).includes(getDatePart(date, mode, "day"));
  const dayOfWeekMatches = expandField(
    expression.dayOfWeek,
    CRON_FIELD_SPECS.dayOfWeek.min,
    CRON_FIELD_SPECS.dayOfWeek.max
  ).includes(getDatePart(date, mode, "weekday"));

  const dayMatches =
    isWildcard(expression.dayOfMonth) && isWildcard(expression.dayOfWeek)
      ? true
      : isWildcard(expression.dayOfMonth)
        ? dayOfWeekMatches
        : isWildcard(expression.dayOfWeek)
          ? dayOfMonthMatches
          : dayOfMonthMatches || dayOfWeekMatches;

  return minuteMatches && hourMatches && monthMatches && dayMatches;
}

export function describeCronSchedule(
  expression: CronExpression,
  timeZone: CronTimeZoneMode
): string {
  const timePart = describeTime(expression);
  const dayPart = describeDayAndMonth(expression);

  if (dayPart === "every day" && (timePart === "Every minute" || timePart.startsWith("Every "))) {
    return `${timePart} using ${timeZone === "utc" ? "UTC" : "local time"}`;
  }

  return `${timePart} ${dayPart} using ${timeZone === "utc" ? "UTC" : "local time"}`;
}

export function getNextCronRuns(
  expression: CronExpression,
  options: { start: Date; count: number; timeZone: CronTimeZoneMode }
): Date[] {
  const results: Date[] = [];
  let cursor = roundUpToNextMinute(options.start, options.timeZone);
  const maxIterations = 60 * 24 * 366 * 5;

  for (
    let iteration = 0;
    iteration < maxIterations && results.length < options.count;
    iteration += 1
  ) {
    if (matchesDate(expression, cursor, options.timeZone)) {
      results.push(new Date(cursor.getTime()));
    }

    cursor = addOneMinute(cursor, options.timeZone);
  }

  return results;
}

export function buildCronScheduleSummary(
  input: string,
  options: { start: Date; count: number; timeZone: CronTimeZoneMode }
): CronScheduleSummary {
  const parsed = parseCronExpression(input);

  if (!parsed.ok) {
    return parsed;
  }

  return {
    ok: true,
    description: describeCronSchedule(parsed.value, options.timeZone),
    nextRuns: getNextCronRuns(parsed.value, options),
  };
}
