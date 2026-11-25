import { useEffect, useState } from "react";
import { Navigate, useSearchParams } from "react-router-dom";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import Auth from "@/utils/auth";
import PageContainer from "@/components/ui/PageContainer";
import PageHeader from "@/components/ui/PageHeader";
import Button from "@/components/ui/Button";
import DownloadsNavigation from "@/components/Downloads/DownloadsNavigation";
import DownloadsFilters from "@/components/Downloads/DownloadsFilters";
import DownloadEventsTable from "@/components/Downloads/DownloadEventsTable";
import { fetchDownloadSummary } from "@/api/downloadReportsAPI";
import type { DownloadSummary, SummarySort } from "@/interfaces/DownloadReport";
import { downloadFilterParams, readDownloadFilters, validateDownloadFilters, reportCountryLabel, reportTitle, eventTypeLabels, summaryStatistics } from "@/utils/downloadReporting";
import { compareDownloadGroups, downloadChange, downloadGroupKey, downloadPresetDates, previousDownloadPeriod, resolveDownloadPeriod } from "@/utils/downloadComparisons";
import type { DownloadPeriodChoice } from "@/utils/downloadComparisons";
import "./Downloads.css";

export default function DownloadsTablePage() {
  const [params, setParams] = useSearchParams();
  const period = resolveDownloadPeriod(params);
  const filterQuery = downloadFilterParams(period.filters).toString();
  const filtersError = validateDownloadFilters(period.filters);
  const previous = period.choice === "all" ? { filters: null, reason: null } : previousDownloadPeriod(period.filters);
  const previousQuery = previous.filters ? downloadFilterParams(previous.filters).toString() : null;
  const sort = (["count", "country", "module", "package"].includes(params.get("sort_by") ?? "") ? params.get("sort_by") : "count") as SummarySort;
  const direction = params.get("sort_dir") === "ASC" ? "ASC" : "DESC";
  const [summary, setSummary] = useState<DownloadSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [retry, setRetry] = useState(0);
  const [eventsContext, setEventsContext] = useState<string | null>(null);
  const [groupPage, setGroupPage] = useState(1);
  const [comparison, setComparison] = useState<DownloadSummary | null>(null);
  const [comparisonError, setComparisonError] = useState<string | null>(null);
  const [comparisonLoading, setComparisonLoading] = useState(false);
  const requestKey = JSON.stringify([filterQuery, sort, direction]);
  const [activeRequest, setActiveRequest] = useState(requestKey);
  const paramsQuery = params.toString();
  useEffect(() => {
    if (!Auth.isSuperAdmin()) return;
    const source = new URLSearchParams(paramsQuery);
    const resolved = resolveDownloadPeriod(source);
    if (resolved.needsDates) {
      source.set("start_date", resolved.filters.start_date);
      source.set("end_date", resolved.filters.end_date);
      source.set("period", resolved.choice);
      setParams(source, { replace: true });
    }
  }, [paramsQuery, setParams]);
  useEffect(() => {
    if (!Auth.isSuperAdmin()) return;
    const controller = new AbortController();
    setSummary(null); setError(null); setLoading(true); setGroupPage(1);
    setComparison(null); setComparisonError(null); setComparisonLoading(previousQuery !== null); setActiveRequest(requestKey);
    fetchDownloadSummary(readDownloadFilters(new URLSearchParams(filterQuery)), sort, direction, controller.signal)
      .then(data => { if (!controller.signal.aborted) setSummary(data); })
      .catch(failure => { if (!controller.signal.aborted) setError(failure instanceof Error ? failure.message : "Unable to load download summary."); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    if (previousQuery !== null) {
      fetchDownloadSummary(readDownloadFilters(new URLSearchParams(previousQuery)), sort, direction, controller.signal)
        .then(data => { if (!controller.signal.aborted) setComparison(data); })
        .catch(failure => { if (!controller.signal.aborted) setComparisonError(failure instanceof Error ? failure.message : "Unable to load comparison summary."); })
        .finally(() => { if (!controller.signal.aborted) setComparisonLoading(false); });
    }
    return () => controller.abort();
  }, [filterQuery, previousQuery, sort, direction, retry, requestKey]);
  if (!Auth.isSuperAdmin()) return <Navigate to="/exams" replace />;
  function changeSort(next: SummarySort, nextDirection = next === sort && direction === "DESC" ? "ASC" : "DESC") {
    const updated = new URLSearchParams(params);
    updated.set("sort_by", next); updated.set("sort_dir", nextDirection); setParams(updated);
  }
  function choosePeriod(choice: DownloadPeriodChoice) {
    const updated = new URLSearchParams(params);
    updated.set("period", choice);
    if (choice === "all") {
      updated.delete("start_date"); updated.delete("end_date");
    } else if (choice !== "custom") {
      const dates = downloadPresetDates(choice);
      updated.set("start_date", dates.start_date); updated.set("end_date", dates.end_date);
    }
    setParams(updated);
  }
  const currentSummary = activeRequest === requestKey ? summary : null;
  const previousSummary = activeRequest === requestKey ? comparison : null;
  const stats = currentSummary ? summaryStatistics(currentSummary) : null;
  const groupedRows = currentSummary ? previousSummary
    ? compareDownloadGroups(currentSummary.groups, previousSummary.groups, sort, direction)
    : currentSummary.groups.map(group => ({ ...group, previous_events: 0 })) : [];
  const groupPages = Math.ceil(groupedRows.length / 25);
  const activeGroupPage = Math.min(groupPage, Math.max(1, groupPages));
  const visibleGroups = groupedRows.slice((activeGroupPage - 1) * 25, activeGroupPage * 25);
  const unfinished = !!period.filters.end_date && period.filters.end_date >= new Date().toISOString().slice(0, 10);
  function changeCell(current: number, prior: number) {
    if (period.choice === "all") return <td>Not applicable</td>;
    if (!previousSummary) return <td>{comparisonLoading || activeRequest !== requestKey ? "Loading comparison..." : "Comparison unavailable"}</td>;
    const change = downloadChange(current, prior);
    const Icon = change.direction === "up" ? TrendingUp : change.direction === "down" ? TrendingDown : Minus;
    return <td><span className={`downloads-change downloads-change-${change.direction}`}><Icon size={16} aria-hidden="true" />{change.label}</span><small className="downloads-previous-count">Previous: {prior.toLocaleString()}</small></td>;
  }
  function header(label: string, field: SummarySort) {
    return <th scope="col" aria-sort={sort === field ? direction === "ASC" ? "ascending" : "descending" : "none"}><button type="button" onClick={() => changeSort(field)}>{label}{sort === field ? direction === "ASC" ? " (ascending)" : " (descending)" : ""}</button></th>;
  }
  return <div className="downloads-page"><PageContainer><div className="downloads">
    <PageHeader title="Downloads Table" subtitle="Geographic and module-level reporting" />
    <DownloadsNavigation />
    <p>Reported download events reflect tracking reports, not verified completed file transfers or unique users. Country attribution is reported or derived, not verified device location.</p>
    <div className="downloads-period-bar">
      <label>Reporting period<select value={period.choice} onChange={event => choosePeriod(event.target.value as DownloadPeriodChoice)}>
        <option value="all">All time</option><option value="today">Today (UTC)</option><option value="7d">Last 7 days</option><option value="30d">Last 30 days</option><option value="custom">Custom date range</option>
      </select></label>
      <div><p>Last 7 / 30 days use completed UTC calendar days ending yesterday. Custom dates are set below.</p>
        <p><strong>Selected:</strong> {period.choice === "all" ? "All time" : `${period.filters.start_date || "Unbounded start"} through ${period.filters.end_date || "Unbounded end"} (UTC, inclusive).`}</p>
        {previous.filters && <p><strong>Comparison:</strong> {previous.filters.start_date} through {previous.filters.end_date} (UTC, inclusive).</p>}
        {unfinished && <p className="downloads-filter-note">This range includes UTC days that are not complete. Change compares calendar periods, not equal elapsed hours or a rolling 24-hour window.</p>}
      </div>
    </div>
    <DownloadsFilters />
    {previous.reason && <p role="status" className="downloads-filter-note">Comparison unavailable: {previous.reason}</p>}
    {filtersError && <p role="alert" className="downloads-error">{filtersError}</p>}
    <section aria-label="Download summary" aria-busy={loading || comparisonLoading || activeRequest !== requestKey}>
      {(loading || activeRequest !== requestKey) && <p role="status">Loading download summary...</p>}
      {activeRequest === requestKey && error && <div role="alert" className="downloads-error">{error} <Button variant="secondary" onClick={() => setRetry(value => value + 1)}>Retry summary</Button></div>}
      {activeRequest === requestKey && comparisonLoading && <p role="status">Loading comparison period...</p>}
      {activeRequest === requestKey && comparisonError && <div role="alert" className="downloads-error">Comparison unavailable: {comparisonError} <Button variant="secondary" onClick={() => setRetry(value => value + 1)}>Retry comparison</Button></div>}
      {currentSummary && stats && <>
        <div className="downloads-stats">
          <div className="downloads-stat"><span>Total reported download events</span><strong>{currentSummary.total_records.toLocaleString()}</strong></div>
          <div className="downloads-stat"><span>Countries represented</span><strong>{stats.countries.toLocaleString()}</strong><small>Resolved countries only</small></div>
          <div className="downloads-stat"><span>Module/package groups</span><strong>{stats.resources.toLocaleString()}</strong><small>Distinct resource combinations, including unattributed</small></div>
          <div className="downloads-stat"><span>Unknown-country events</span><strong>{currentSummary.unknown_country_events.toLocaleString()}</strong><small>Includes unresolved country codes</small></div>
        </div>
        <p>{currentSummary.missing_coordinate_events.toLocaleString()} reported events lack coordinates. These remain in this report; the map shows events with coordinates. Unknown-country and missing-coordinate counts can overlap.</p>
        <div className="downloads-toolbar"><h2>Activity by country and resource</h2>
          <label>Summary sort<select value={sort} onChange={event => changeSort(event.target.value as SummarySort, direction)}><option value="count">Reported events</option><option value="country">Country</option><option value="module">Module title</option><option value="package">Package title</option></select></label>
          <label>Summary sort direction<select value={direction} onChange={event => changeSort(sort, event.target.value)}><option value="DESC">Descending</option><option value="ASC">Ascending</option></select></label>
          <Button variant="secondary" onClick={() => setEventsContext(eventsContext === filterQuery ? null : filterQuery)}>{eventsContext === filterQuery ? "Hide individual events" : "View individual events"}</Button>
        </div>
        {previousSummary && <p className="downloads-filter-note">Groups active only in the comparison period are included with zero current events. Groups sharing the API's exposed country/resource identifiers are combined for comparison.</p>}
      </>}
      <div className="downloads-table-scroll" tabIndex={0} role="region" aria-label="Aggregated download activity table">
        <table><caption className="downloads-filter-note">Reported events grouped by stored country and resource attribution</caption><thead><tr>{header("Country", "country")}{header("Module or package title", "module")}<th scope="col">Resource type</th>{header("Reported downloads (events)", "count")}<th scope="col">Change</th></tr></thead>
          <tbody>{visibleGroups.length > 0 ? visibleGroups.map((group, index) => <tr key={`${downloadGroupKey(group)}-${index}`}><td>{reportCountryLabel(group.country)}</td><td>{reportTitle(group)}</td><td>{eventTypeLabels[group.event_type]}</td><td>{group.reported_download_events.toLocaleString()}</td>{changeCell(group.reported_download_events, group.previous_events)}</tr>) : <tr><td colSpan={5} role="status">{currentSummary
            ? `No reported download events match these filters. ${period.choice === "all" ? "Try clearing country, module, or package filters." : "Try All time or clear country, module, or package filters."}`
            : loading || activeRequest !== requestKey ? "Loading download summary..." : "The report could not be loaded. Retry using the control above."}</td></tr>}</tbody>
        </table>
      </div>
      {groupPages > 1 && <div className="downloads-pagination" aria-label="Summary pagination"><Button variant="secondary" disabled={activeGroupPage === 1} onClick={() => setGroupPage(value => value - 1)}>Previous groups</Button><span>Group page {activeGroupPage} of {groupPages}</span><Button variant="secondary" disabled={activeGroupPage >= groupPages} onClick={() => setGroupPage(value => value + 1)}>Next groups</Button></div>}
    </section>
    {eventsContext === filterQuery && !filtersError && <DownloadEventsTable key={filterQuery} filterQuery={filterQuery} />}
  </div></PageContainer></div>;
}
