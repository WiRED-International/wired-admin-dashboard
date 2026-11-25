import type { DownloadFilters, ReportContext, ReportResource, DownloadSummary } from "@/interfaces/DownloadReport";

export const downloadFilterKeys = ["start_date", "end_date", "country_code", "module_id", "package_id"] as const;
export function readDownloadFilters(params: URLSearchParams): DownloadFilters {
  return Object.fromEntries(downloadFilterKeys.map(key => [key, params.get(key) ?? ""])) as unknown as DownloadFilters;
}
export function downloadFilterParams(filters: DownloadFilters): URLSearchParams {
  const params = new URLSearchParams();
  downloadFilterKeys.forEach(key => { if (filters[key]) params.set(key, key === "country_code" ? filters[key].toUpperCase() : filters[key]); });
  return params;
}
export function validateDownloadFilters(filters: DownloadFilters): string | null {
  for (const key of ["start_date", "end_date"] as const) {
    const value = filters[key];
    if (value && (!/^\d{4}-\d{2}-\d{2}$/.test(value) || !Number.isFinite(Date.parse(`${value}T00:00:00Z`))
      || new Date(`${value}T00:00:00Z`).toISOString().slice(0, 10) !== value)) return "Enter valid UTC dates in YYYY-MM-DD format.";
  }
  if (filters.start_date && filters.end_date && filters.start_date > filters.end_date) return "Start date must not be after end date.";
  if (filters.country_code && !/^[a-z]{2}$/i.test(filters.country_code)) return "Choose a two-letter country code.";
  for (const key of ["module_id", "package_id"] as const) {
    if (filters[key] && (!/^[1-9]\d*$/.test(filters[key]) || Number(filters[key]) > 2147483647)) return "Resource IDs must be positive integers up to 2147483647.";
  }
  return null;
}
// Legacy map dates are inclusive Unix seconds; reporting dates are inclusive UTC days.
export function downloadMapQuery(filters: DownloadFilters): string {
  const params = downloadFilterParams(filters);
  if (filters.start_date) params.set("start_date", String(Date.parse(`${filters.start_date}T00:00:00Z`) / 1000));
  if (filters.end_date) params.set("end_date", String(Date.parse(`${filters.end_date}T00:00:00Z`) / 1000 + 86400 - 1));
  return params.toString();
}
export function reportCountryLabel(country: ReportContext["country"]): string {
  return country.resolved ? country.name ?? country.code ?? "Unknown country"
    : country.code ? `Unresolved country (${country.code})` : "Unknown country";
}
export function reportResourceLabel(resource: ReportResource | null, kind: string): string {
  return resource ? resource.title ?? `Unavailable ${kind} (ID ${resource.id})` : "";
}
export function reportTitle(row: ReportContext): string {
  return [reportResourceLabel(row.module, "module"), reportResourceLabel(row.package, "package")].filter(Boolean).join(" / ") || "Unattributed resource";
}
export const eventTypeLabels = { module: "Module", package: "Package", module_and_package: "Module and package", unattributed: "Unattributed" };
export function summaryStatistics(summary: DownloadSummary) {
  return {
    countries: new Set(summary.groups.filter(group => group.country.resolved).map(group => group.country.id ?? group.country.code)).size,
    resources: new Set(summary.groups.map(group => JSON.stringify([group.module?.id ?? null, group.package?.id ?? null]))).size,
  };
}
