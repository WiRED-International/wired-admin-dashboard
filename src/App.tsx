import { Outlet, useLocation } from "react-router-dom";
import LayoutShell from "./layout/LayoutShell";
import Footer from "./components/Footer";

export default function App() {
  const location = useLocation();

  // pages that should NOT show the sidebar layout
  const noLayoutRoutes = [
    "/login",
    "/forgot-password",
    "/reset-password",
  ];

  const hideLayout = noLayoutRoutes.some(route =>
    location.pathname.startsWith(route)
  );

  return hideLayout ? (
    <>
      <Outlet />
      <Footer />
    </>
  ) : (
    <LayoutShell>
      <Outlet />
    </LayoutShell>
  );
}
