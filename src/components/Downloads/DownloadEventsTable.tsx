import { useEffect, useState } from "react";
import Button from "@/components/ui/Button";
import { fetchDownloadEvents } from "@/api/downloadReportsAPI";
import type { DownloadEvents, EventSort } from "@/interfaces/DownloadReport";
import { readDownloadFilters, reportCountryLabel, reportTitle, eventTypeLabels } from "@/utils/downloadReporting";

export default function DownloadEventsTable({ filterQuery }: { filterQuery: string }) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [sort, setSort] = useState<EventSort>("download_date");
  const [direction, setDirection] = useState<"ASC" | "DESC">("DESC");
  const [data, setData] = useState<DownloadEvents | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true); setError(null); setData(null);
    fetchDownloadEvents(readDownloadFilters(new URLSearchParams(filterQuery)), page, pageSize, sort, direction, controller.signal)
      .then(result => { if (!controller.signal.aborted) setData(result); })
      .catch(failure => { if (!controller.signal.aborted) setError(failure instanceof Error ? failure.message : "Unable to load individual events."); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [filterQuery, page, pageSize, sort, direction, retry]);
  return <section className="downloads-events" aria-labelledby="download-events-heading" aria-busy={loading}>
    <h2 id="download-events-heading">Individual reported events</h2>
    <p>Events matching the applied filters. Dates and times are shown in UTC. No profiles or precise coordinates are displayed.</p>
    <div className="downloads-toolbar">
      <label>Event sort<select value={sort} onChange={event => { setSort(event.target.value as EventSort); setPage(1); }}>
        <option value="download_date">Download date/time</option><option value="id">Event ID</option>
        <option value="country_id">Country ID</option><option value="module_id">Module ID</option><option value="package_id">Package ID</option>
      </select></label>
      <label>Event sort direction<select value={direction} onChange={event => { setDirection(event.target.value as "ASC" | "DESC"); setPage(1); }}><option value="DESC">Descending</option><option value="ASC">Ascending</option></select></label>
    </div>
    {loading && <p role="status">Loading individual events...</p>}
    {error && <div className="downloads-error" role="alert">{error} <Button variant="secondary" onClick={() => setRetry(value => value + 1)}>Retry events</Button></div>}
    {data && <>
      <p role="status">{data.total_records.toLocaleString()} reported events match the applied filters.</p>
      {data.records.length === 0 ? <p>No individual events on this page.</p> : <div className="downloads-table-scroll" tabIndex={0} role="region" aria-label="Individual reported events table">
        <table><caption className="downloads-filter-note">Individual reported download events</caption><thead><tr><th scope="col">Download date/time (UTC)</th><th scope="col">Module or package title</th><th scope="col">Country</th><th scope="col">Resource type</th></tr></thead>
          <tbody>{data.records.map(row => <tr key={row.id}><td>{new Date(row.download_date * 1000).toISOString().replace("T", " ").replace(".000Z", " UTC")}</td><td>{reportTitle(row)}</td><td>{reportCountryLabel(row.country)}</td><td>{eventTypeLabels[row.event_type]}</td></tr>)}</tbody>
        </table>
      </div>}
    </>}
    <div className="downloads-pagination" aria-label="Event pagination">
      <label>Events per page<select value={pageSize} onChange={event => { setPageSize(Number(event.target.value)); setPage(1); }}><option value={25}>25</option><option value={50}>50</option><option value={100}>100</option></select></label>
      <Button variant="secondary" disabled={loading || page === 1} onClick={() => setPage(value => value - 1)}>Previous events</Button>
      <span>{data ? `Page ${data.total_pages === 0 ? 0 : data.page} of ${data.total_pages}` : `Page ${page}`}</span>
      <Button variant="secondary" disabled={loading || !data || data.page >= data.total_pages} onClick={() => setPage(value => value + 1)}>Next events</Button>
    </div>
  </section>;
}
