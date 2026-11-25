import type { DownloadFilters, DownloadSummary, ReportContext, SummarySort } from "@/interfaces/DownloadReport";
import { readDownloadFilters, validateDownloadFilters } from "@/utils/downloadReporting";

const DAY = 86400000;
export type DownloadPeriodChoice = "all" | "today" | "7d" | "30d" | "custom";
type SummaryGroup = DownloadSummary["groups"][number];
export interface ComparedDownloadGroup extends SummaryGroup { previous_events: number }

export function downloadPresetDates(choice: Exclude<DownloadPeriodChoice, "custom" | "all">, now = new Date()) {
  const today = Date.parse(`${now.toISOString().slice(0, 10)}T00:00:00Z`);
  const end = choice === "today" ? today : today - DAY;
  const days = choice === "30d" ? 30 : choice === "7d" ? 7 : 1;
  return { start_date: new Date(end - (days - 1) * DAY).toISOString().slice(0, 10), end_date: new Date(end).toISOString().slice(0, 10) };
}

// Explicit URL dates are authoritative, including historical bookmarked ranges.
export function resolveDownloadPeriod(params: URLSearchParams, now = new Date()) {
  const filters = readDownloadFilters(params);
  const requested = params.get("period");
  const preset = requested === "today" || requested === "7d" || requested === "30d" ? requested : null;
  if (!filters.start_date && !filters.end_date) {
    if (preset) return { filters: { ...filters, ...downloadPresetDates(preset, now) }, choice: preset as DownloadPeriodChoice, needsDates: true };
    return { filters, choice: (requested === "custom" ? "custom" : "all") as DownloadPeriodChoice, needsDates: false };
  }
  const dates = preset ? downloadPresetDates(preset, now) : null;
  const choice: DownloadPeriodChoice = dates && filters.start_date === dates.start_date && filters.end_date === dates.end_date ? preset! : "custom";
  return { filters, choice, needsDates: false };
}

export function previousDownloadPeriod(filters: DownloadFilters): { filters: DownloadFilters | null; reason: string | null } {
  const invalid = validateDownloadFilters(filters);
  if (invalid) return { filters: null, reason: invalid };
  if (!filters.start_date || !filters.end_date) return { filters: null, reason: "Select both UTC dates to compare equal-length periods. Open-ended ranges cannot be compared accurately." };
  const start = Date.parse(`${filters.start_date}T00:00:00Z`);
  const duration = Date.parse(`${filters.end_date}T00:00:00Z`) - start + DAY;
  const previousStart = new Date(start - duration).toISOString().slice(0, 10);
  const previousEnd = new Date(start - DAY).toISOString().slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(previousStart) || !/^\d{4}-\d{2}-\d{2}$/.test(previousEnd)) {
    return { filters: null, reason: "The preceding period falls outside the API's YYYY-MM-DD date range." };
  }
  return { filters: { ...filters, start_date: previousStart, end_date: previousEnd }, reason: null };
}

export function downloadGroupKey(row: ReportContext): string {
  // Codes distinguish unresolved or historically inconsistent attribution; titles never identify a group.
  return JSON.stringify([row.country.id, row.country.code, row.module?.id ?? null, row.package?.id ?? null, row.event_type]);
}

export function compareDownloadGroups(current: SummaryGroup[], previous: SummaryGroup[], sort: SummarySort, direction: "ASC" | "DESC"): ComparedDownloadGroup[] {
  const groups = new Map<string, ComparedDownloadGroup>();
  // Combine any indistinguishable historical buckets using the stable fields exposed by the API.
  for (const row of previous) {
    const key = downloadGroupKey(row);
    const existing = groups.get(key);
    if (existing) existing.previous_events += row.reported_download_events;
    else groups.set(key, { ...row, reported_download_events: 0, previous_events: row.reported_download_events });
  }
  for (const row of current) {
    const key = downloadGroupKey(row);
    const existing = groups.get(key);
    groups.set(key, { ...row, reported_download_events: (existing?.reported_download_events ?? 0) + row.reported_download_events, previous_events: existing?.previous_events ?? 0 });
  }
  const sortValue = (row: ComparedDownloadGroup) => sort === "country" ? row.country.name ?? "" : sort === "module" ? row.module?.title ?? "" : row.package?.title ?? "";
  return [...groups.values()].sort((left, right) => {
    const result = sort === "count" ? left.reported_download_events - right.reported_download_events : sortValue(left).localeCompare(sortValue(right));
    return (direction === "DESC" ? -result : result) || downloadGroupKey(left).localeCompare(downloadGroupKey(right));
  });
}

export function downloadChange(current: number, previous: number): { direction: "up" | "down" | "flat"; label: string } {
  if (current === previous) return { direction: "flat", label: "No change (0%)" };
  if (previous === 0) return { direction: "up", label: "New activity (previously 0)" };
  const percent = Math.abs((current - previous) / previous * 100);
  const amount = percent < 0.1 ? "<0.1" : percent.toLocaleString("en-US", { maximumFractionDigits: 1 });
  return { direction: current > previous ? "up" : "down", label: `${amount}% ${current > previous ? "increase" : "decrease"}` };
}
