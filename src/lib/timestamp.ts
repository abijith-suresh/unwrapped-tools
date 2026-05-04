export interface TimeZoneOption {
  label: string;
  tz: string;
}

export interface DerivedTimestampFormat {
  label: string;
  value: string;
}

export const DEFAULT_ZONES: TimeZoneOption[] = [
  { label: "UTC", tz: "UTC" },
  { label: "US/Eastern", tz: "America/New_York" },
  { label: "US/Pacific", tz: "America/Los_Angeles" },
];

export const PRESET_ZONES: TimeZoneOption[] = [
  { label: "UTC", tz: "UTC" },
  { label: "US/Eastern", tz: "America/New_York" },
  { label: "US/Central", tz: "America/Chicago" },
  { label: "US/Mountain", tz: "America/Denver" },
  { label: "US/Pacific", tz: "America/Los_Angeles" },
  { label: "London", tz: "Europe/London" },
  { label: "Paris", tz: "Europe/Paris" },
  { label: "Berlin", tz: "Europe/Berlin" },
  { label: "Moscow", tz: "Europe/Moscow" },
  { label: "Dubai", tz: "Asia/Dubai" },
  { label: "India", tz: "Asia/Kolkata" },
  { label: "Bangkok", tz: "Asia/Bangkok" },
  { label: "Singapore", tz: "Asia/Singapore" },
  { label: "Tokyo", tz: "Asia/Tokyo" },
  { label: "Sydney", tz: "Australia/Sydney" },
  { label: "Auckland", tz: "Pacific/Auckland" },
];

export function parseEpoch(raw: string): { ms: number; unit: "s" | "ms" } | null {
  const trimmed = raw.trim();

  if (!trimmed) {
    return null;
  }

  const value = Number(trimmed);

  if (!Number.isFinite(value)) {
    return null;
  }

  if (Math.abs(value) > 1e12) {
    return { ms: value, unit: "ms" };
  }

  return { ms: value * 1000, unit: "s" };
}

export function formatInZone(date: Date, tz: string): string {
  try {
    return new Intl.DateTimeFormat("en-GB", {
      timeZone: tz,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    })
      .format(date)
      .replace(",", "");
  } catch {
    return "Invalid timezone";
  }
}

export function formatUtcString(date: Date): string {
  return date.toUTCString();
}

export function formatRfc3339(date: Date): string {
  return date.toISOString();
}

export function formatRfc7231(date: Date): string {
  return date.toUTCString();
}

export function formatIso9075(date: Date): string {
  const pad = (value: number) => String(value).padStart(2, "0");

  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())} ${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}:${pad(date.getUTCSeconds())}`;
}

export function formatMongoObjectIdSeed(date: Date): string {
  return Math.floor(date.getTime() / 1000)
    .toString(16)
    .padStart(8, "0");
}

export function getDerivedTimestampFormats(date: Date): DerivedTimestampFormat[] {
  return [
    { label: "ISO 8601", value: date.toISOString() },
    { label: "RFC 3339", value: formatRfc3339(date) },
    { label: "RFC 7231", value: formatRfc7231(date) },
    { label: "UTC string", value: formatUtcString(date) },
    { label: "ISO 9075", value: formatIso9075(date) },
    { label: "Mongo ObjectID seed", value: formatMongoObjectIdSeed(date) },
  ];
}

export function localInputToMs(value: string): number | null {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.getTime();
}

export function msToLocalInput(ms: number): string {
  const date = new Date(ms);
  const pad = (value: number) => String(value).padStart(2, "0");

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
