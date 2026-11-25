import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import Button from "@/components/ui/Button";
import { fetchModuleAndPackageInfo } from "@/api/modulesAPI";
import type { IdsAndNamesInterface } from "@/interfaces/IdsAndNamesInterface";
import type { DownloadFilters } from "@/interfaces/DownloadReport";
import { downloadFilterParams, readDownloadFilters, validateDownloadFilters } from "@/utils/downloadReporting";
import countries from "@/utils/countryNames.json";

export default function DownloadsFilters() {
  const [params, setParams] = useSearchParams();
  const serialized = downloadFilterParams(readDownloadFilters(params)).toString();
  const [filters, setFilters] = useState(() => readDownloadFilters(params));
  const [catalog, setCatalog] = useState<IdsAndNamesInterface>({ modules: [], packages: [] });
  const [catalogError, setCatalogError] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => { setFilters(readDownloadFilters(new URLSearchParams(serialized))); setError(null); }, [serialized]);
  useEffect(() => {
    let active = true;
    fetchModuleAndPackageInfo().then(data => { if (active) setCatalog(data); }).catch(() => { if (active) setCatalogError(true); });
    return () => { active = false; };
  }, []);
  function update(key: keyof DownloadFilters, value: string) { setFilters(current => ({ ...current, [key]: value })); }
  function resourceOptions(kind: "modules" | "packages", value: string) {
    return <>
      <option value="">All {kind}</option>
      {value && !catalog[kind].some(item => String(item.id) === value) && <option value={value}>Selected ID {value}</option>}
      {catalog[kind].map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
    </>;
  }
  return <form className="downloads-filters" onSubmit={event => {
    event.preventDefault();
    const invalid = validateDownloadFilters(filters);
    setError(invalid);
    if (!invalid) {
      const updated = downloadFilterParams(filters);
      // Keep the selected preset only while its applied dates remain unchanged.
      if (params.has("period")) updated.set("period", filters.start_date === (params.get("start_date") ?? "") && filters.end_date === (params.get("end_date") ?? "") ? params.get("period")! : "custom");
      for (const key of ["sort_by", "sort_dir"]) if (params.has(key)) updated.set(key, params.get(key)!);
      setParams(updated);
    }
  }}>
    <label>Start date (UTC)<input type="date" value={filters.start_date} onChange={event => update("start_date", event.target.value)} /></label>
    <label>End date (UTC, inclusive)<input type="date" value={filters.end_date} onChange={event => update("end_date", event.target.value)} /></label>
    <label>Country<select value={filters.country_code} onChange={event => update("country_code", event.target.value)}>
      <option value="">All countries</option>
      {filters.country_code && !countries.some(country => country.code === filters.country_code) && <option value={filters.country_code}>{filters.country_code}</option>}
      {countries.map(country => <option key={country.code} value={country.code}>{country.name}</option>)}
    </select></label>
    <label>Module<select value={filters.module_id} onChange={event => update("module_id", event.target.value)}>{resourceOptions("modules", filters.module_id)}</select></label>
    <label>Package<select value={filters.package_id} onChange={event => update("package_id", event.target.value)}>{resourceOptions("packages", filters.package_id)}</select></label>
    <div className="downloads-filter-actions"><Button type="submit">Apply filters</Button><Button variant="secondary" onClick={() => { setFilters(readDownloadFilters(new URLSearchParams())); setError(null); setParams(new URLSearchParams()); }}>Clear filters</Button></div>
    <p className="downloads-filter-note">Both dates include the full UTC day. All selected filters are combined.</p>
    {catalogError && <p className="downloads-filter-note" role="status">Module/package choices could not be loaded. Existing ID filters are retained; reload to retry the choices.</p>}
    {error && <p className="downloads-error" role="alert">{error}</p>}
  </form>;
}
