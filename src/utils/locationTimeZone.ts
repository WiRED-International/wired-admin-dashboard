import moment from "moment-timezone";

// Match the location API's policy within the timezone data offered by the picker.
// Keep this separate from exam validation, which permits additional aliases.
export function isValidLocationTimeZone(zone: unknown): zone is string {
  if (typeof zone !== "string" ||
      (zone !== "UTC" && !zone.includes("/")) ||
      zone !== zone.trim() || /^Etc\/GMT[+-]\d+$/i.test(zone) ||
      !moment.tz.zone(zone)) return false;
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: zone });
    return true;
  } catch {
    return false;
  }
}
