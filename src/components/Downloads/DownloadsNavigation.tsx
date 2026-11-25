import { NavLink, useSearchParams } from "react-router-dom";
import { Map, Table2 } from "lucide-react";
import { downloadFilterParams, readDownloadFilters } from "@/utils/downloadReporting";

export default function DownloadsNavigation() {
  const [params] = useSearchParams();
  const shared = downloadFilterParams(readDownloadFilters(params));
  if (params.has("period")) shared.set("period", params.get("period")!);
  const search = shared.toString();
  return <nav className="downloads-navigation" aria-label="Downloads views">
    <NavLink to={{ pathname: "/downloads/map", search }}><Map size={17} aria-hidden="true" />Map View</NavLink>
    <NavLink to={{ pathname: "/downloads/table", search }}><Table2 size={17} aria-hidden="true" />Table View</NavLink>
  </nav>;
}
