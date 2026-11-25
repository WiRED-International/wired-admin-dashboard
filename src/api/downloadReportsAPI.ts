import Auth from "@/utils/auth";
import { apiPrefix } from "@/utils/globalVariables";
import type { DownloadEvents, DownloadFilters, DownloadSummary, EventSort, SummarySort } from "@/interfaces/DownloadReport";
import { downloadFilterParams, validateDownloadFilters } from "@/utils/downloadReporting";

function validContext(value: unknown): boolean {
  if (!value || typeof value !== "object") return false;
  const row = value as Record<string, unknown>;
  const country = row.country as Record<string, unknown> | null;
  const nullableText = (text: unknown) => text === null || typeof text === "string";
  const validResource = (resource: unknown) => {
    if (resource === null) return true;
    if (!resource || typeof resource !== "object") return false;
    const item = resource as Record<string, unknown>;
    return Number.isSafeInteger(item.id) && nullableText(item.title);
  };
  return ["module", "package", "module_and_package", "unattributed"].includes(String(row.event_type))
    && !!country && typeof country === "object" && typeof country.resolved === "boolean"
    && (country.id === null || Number.isSafeInteger(country.id)) && nullableText(country.code) && nullableText(country.name)
    && validResource(row.module) && validResource(row.package);
}

async function report<T>(endpoint: string, filters: DownloadFilters, extra: Record<string, string>, signal?: AbortSignal): Promise<T> {
  if (!Auth.isSuperAdmin()) throw new Error("Super-admin access is required for Downloads reporting.");
  const invalid = validateDownloadFilters(filters);
  if (invalid) throw new Error(invalid);
  const params = downloadFilterParams(filters);
  Object.entries(extra).forEach(([key, value]) => params.set(key, value));
  const response = await fetch(`${apiPrefix.replace(/\/$/, "")}/api/downloads/report/${endpoint}?${params}`, {
    headers: { Authorization: `Bearer ${Auth.getToken()}` }, signal, cache: "no-store",
  });
  if (!response.ok) {
    if (response.status === 401) throw new Error("Your session has expired. Sign in again to view Downloads.");
    if (response.status === 403) throw new Error("Super-admin access is required for Downloads reporting.");
    throw new Error(response.status === 400 ? "The reporting filters were rejected. Check the dates and resource IDs." : "Unable to load the download report. Please retry.");
  }
  const data = await response.json();
  if (data?.metric !== "reported_download_events" || data?.period?.timezone !== "UTC"
    || !Number.isSafeInteger(data.total_records) || data.total_records < 0
    || !Array.isArray(endpoint === "summary" ? data.groups : data.records)
    || (endpoint === "summary" ? !Number.isSafeInteger(data.unknown_country_events) || !Number.isSafeInteger(data.missing_coordinate_events)
      : !Number.isSafeInteger(data.page) || data.page < 1 || !Number.isSafeInteger(data.page_size) || data.page_size < 1 || data.page_size > 100 || !Number.isSafeInteger(data.total_pages) || data.total_pages < 0)) {
    throw new Error("The server returned an unexpected download report.");
  }
  const rows = (endpoint === "summary" ? data.groups : data.records) as Record<string, unknown>[];
  if (!rows.every(row => validContext(row) && (endpoint === "summary"
    ? Number.isSafeInteger(row.reported_download_events) && Number(row.reported_download_events) >= 0
    : Number.isSafeInteger(row.id) && typeof row.download_date === "number" && Number.isFinite(new Date(row.download_date * 1000).getTime())))) {
    throw new Error("The server returned an unexpected download report.");
  }
  return data as T;
}
export function fetchDownloadSummary(filters: DownloadFilters, sort: SummarySort = "count", direction: "ASC" | "DESC" = "DESC", signal?: AbortSignal) {
  return report<DownloadSummary>("summary", filters, { sort_by: sort, sort_dir: direction }, signal);
}
export function fetchDownloadEvents(filters: DownloadFilters, page = 1, pageSize = 25, sort: EventSort = "download_date", direction: "ASC" | "DESC" = "DESC", signal?: AbortSignal) {
  return report<DownloadEvents>("events", filters, { page: String(page), page_size: String(pageSize), sort_by: sort, sort_dir: direction }, signal);
}
