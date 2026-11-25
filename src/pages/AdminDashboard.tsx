import { useCallback, useEffect, useState } from "react";
import { Navigate, useSearchParams } from "react-router-dom";
import Auth from "@/utils/auth";
import { fetchDownloads } from "@/api/downloadsApi";
import { fetchGoogleAPIKey } from "@/api/googleAPIKey";
import type { ModuleDownloadInterface } from "@/interfaces/ModuleDownloadInterface";
import GoogleMapsComponent from "@/components/GoogleMap";
import PageContainer from "@/components/ui/PageContainer";
import PageHeader from "@/components/ui/PageHeader";
import Button from "@/components/ui/Button";
import DownloadsNavigation from "@/components/Downloads/DownloadsNavigation";
import DownloadsFilters from "@/components/Downloads/DownloadsFilters";
import { downloadFilterParams, downloadMapQuery, readDownloadFilters, validateDownloadFilters } from "@/utils/downloadReporting";
import "./Downloads.css";

// Retain the existing map and legacy endpoint; only adapt the shared URL filters.
export default function AdminDashboard() {
  const [params] = useSearchParams();
  const filterQuery = downloadFilterParams(readDownloadFilters(params)).toString();
  const [downloads, setDownloads] = useState<ModuleDownloadInterface[]>([]);
  const [googleAPIKey, setGoogleAPIKey] = useState("");
  const [keyError, setKeyError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [retry, setRetry] = useState(0);
  // The map's onLoad callback is retained; the effect owns fetching to avoid duplicate requests.
  const handleMapLoad = useCallback(() => {}, []);
  useEffect(() => {
    if (!Auth.isSuperAdmin()) return;
    let active = true;
    setKeyError(null);
    fetchGoogleAPIKey().then(key => { if (active) setGoogleAPIKey(key); })
      .catch(() => { if (active) setKeyError("Unable to load the map configuration. Please retry."); });
    return () => { active = false; };
  }, [retry]);
  useEffect(() => {
    if (!Auth.isSuperAdmin()) return;
    const controller = new AbortController();
    setError(null); setLoading(true); setDownloads([]);
    const filters = readDownloadFilters(new URLSearchParams(filterQuery));
    const invalid = validateDownloadFilters(filters);
    if (invalid) { setError(invalid); setLoading(false); return () => controller.abort(); }
    fetchDownloads(downloadMapQuery(filters), controller.signal)
      .then(data => { if (!controller.signal.aborted) setDownloads(data); })
      .catch(failure => { if (!controller.signal.aborted) setError(failure instanceof Error ? failure.message : "Unable to load downloads."); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [filterQuery, retry]);
  if (!Auth.isSuperAdmin()) return <Navigate to="/exams" replace />;
  return <div className="downloads-page"><PageContainer><div className="downloads">
    <PageHeader title="Downloads Map" subtitle="Explore reported download events around the world" />
    <DownloadsNavigation /><DownloadsFilters />
    <p>The map shows reported events with coordinates. The table also includes events without coordinates.</p>
    {loading && <p role="status">Loading download markers...</p>}
    {(error || keyError) && <div className="downloads-error" role="alert">{error || keyError} <Button variant="secondary" onClick={() => setRetry(value => value + 1)}>Retry map</Button></div>}
    {!loading && !error && downloads.length === 0 && <p role="status">No mapped download events match these filters.</p>}
    {googleAPIKey && <div className="downloads-map-frame"><GoogleMapsComponent downloads={downloads} handleViewAllDownloads={handleMapLoad} googleAPIKey={googleAPIKey} /></div>}
  </div></PageContainer></div>;
}
