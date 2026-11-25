export type DownloadEventType = "module" | "package" | "module_and_package" | "unattributed";
export interface ReportCountry { id: number | null; code: string | null; name: string | null; resolved: boolean }
export interface ReportResource { id: number; title: string | null }
export interface ReportContext {
  event_type: DownloadEventType;
  country: ReportCountry;
  module: ReportResource | null;
  package: ReportResource | null;
}
export interface ReportPeriod { timezone: "UTC"; start_inclusive: number | null; end_exclusive: number | null }
export interface DownloadSummary {
  metric: "reported_download_events";
  period: ReportPeriod;
  total_records: number;
  unknown_country_events: number;
  missing_coordinate_events: number;
  groups: (ReportContext & { reported_download_events: number })[];
}
export interface DownloadEvents {
  metric: "reported_download_events";
  period: ReportPeriod;
  total_records: number;
  page: number;
  page_size: number;
  total_pages: number;
  records: (ReportContext & { id: number; download_date: number })[];
}
export type SummarySort = "count" | "country" | "module" | "package";
export type EventSort = "download_date" | "id" | "country_id" | "module_id" | "package_id";
export interface DownloadFilters {
  start_date: string;
  end_date: string;
  country_code: string;
  module_id: string;
  package_id: string;
}
