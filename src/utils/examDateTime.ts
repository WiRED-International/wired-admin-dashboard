import moment from "moment-timezone";

export const DEFAULT_EXAM_TIME_ZONE = "Africa/Nairobi";

function validTimeZone(value?: string | null): string | null {
  const zone = value?.trim();
  if (!zone || !moment.tz.zone(zone)) return null;
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: zone });
    return zone;
  } catch {
    return null;
  }
}

export function requireExamTimeZone(value?: string | null): string {
  const zone = validTimeZone(value);
  if (!zone) throw new Error("Select a valid exam timezone before saving.");
  return zone;
}

export function examDisplayTimeZone(timeZone?: string | null): string {
  return validTimeZone(timeZone) || DEFAULT_EXAM_TIME_ZONE;
}

export function formatExamDateTime(value: string, timeZone?: string | null) {
  return new Date(value).toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: examDisplayTimeZone(timeZone),
  });
}

// datetime-local needs wall time in the exam's zone, without an offset.
export function examDateTimeInput(value: string, timeZone?: string | null) {
  const zone = validTimeZone(timeZone);
  // Invalid zones must not produce plausible UTC wall times in editable fields.
  if (!zone) return "";
  const local = moment.utc(value).tz(zone);
  if (!local.isValid()) return "";
  const format = local.seconds() || local.milliseconds()
    ? "YYYY-MM-DDTHH:mm:ss.SSS"
    : "YYYY-MM-DDTHH:mm";
  return local.format(format);
}

// The existing API's Luxon parser accepts explicit UTC ISO values. Preserve the
// exact instant for an unchanged boundary; only changed wall times need resolving.
export function examScheduleValue(
  value: string,
  timeZone: string,
  original?: { utc: string; timeZone: string },
) {
  const zone = requireExamTimeZone(timeZone);
  const wall = moment.utc(value, moment.ISO_8601, true);
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,3})?)?$/.test(value) || !wall.isValid()) {
    throw new Error("Enter a valid exam date and time.");
  }
  const format = "YYYY-MM-DDTHH:mm:ss.SSS";
  if (original && validTimeZone(original.timeZone) === zone) {
    const previousInput = examDateTimeInput(original.utc, zone);
    if (previousInput && moment.utc(previousInput).valueOf() === wall.valueOf()) {
      return original.utc;
    }
  }

  // Enumerate the zone's offsets and retain only instants matching this wall
  // time. Zero matches means a DST gap; multiple matches mean a repeated hour.
  const offsets = new Set(moment.tz.zone(zone)!.offsets);
  const matches = new Set<number>();
  for (const offset of offsets) {
    const instant = wall.valueOf() + offset * 60_000;
    if (moment.tz(instant, zone).format(format) === wall.format(format)) {
      matches.add(instant);
    }
  }
  if (matches.size === 0) {
    throw new Error("This local time does not exist because the clocks move forward. Choose another time.");
  }
  if (matches.size > 1) {
    throw new Error("This local time occurs twice because the clocks move back. Choose a time outside the repeated hour.");
  }
  return value;
}

export function formatExamSchedulePreview(value: string, timeZone: string) {
  if (!value) return "Not Set";
  try {
    const zone = requireExamTimeZone(timeZone);
    examScheduleValue(value, zone);
    return formatExamDateTime(moment.tz(value, zone).toISOString(), zone);
  } catch (error) {
    return (error as Error).message;
  }
}
