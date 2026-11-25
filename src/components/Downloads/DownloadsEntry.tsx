import { Navigate } from "react-router-dom";
import Auth from "@/utils/auth";

// Resolve after authentication changes, rather than freezing the role at router creation.
export default function DownloadsEntry() {
  return <Navigate to={Auth.isSuperAdmin() ? "/downloads/map" : "/userview"} replace />;
}
