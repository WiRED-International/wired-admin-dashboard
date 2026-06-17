import { Link, useLocation } from "react-router-dom";
import { globalStyles } from "../globalStyles";
import auth from "../utils/auth";
import { useAuth } from "../context/AuthContext";
import {
  Users,
  Download,
  FileText,
  LogOut,
  Menu,
  ChevronLeft,
} from "lucide-react";

type SidebarProps = {
  collapsed: boolean;
  onToggle: () => void;
};

export default function Sidebar({
  collapsed,
  onToggle,
}: SidebarProps) {
  const location = useLocation();
  const { setIsAuthenticated } = useAuth();

  const handleLogout = () => {
    auth.logout();
    setIsAuthenticated(false);
  };

  const navItems = [
    {
      name: "Downloads",
      path: "/",
      icon: <Download size={20} />,
    },

    {
      name: "Users",
      path: "/userview",
      icon: <Users size={20} />,
    },

    {
      name: "Exams",
      path: "/exams",
      icon: <FileText size={20} />,
    },
  ];

  return (
    <div
      style={{
        ...styles.sidebar,
        width: collapsed ? "64px" : "220px",
        padding: collapsed ? "20px 8px" : "20px 10px",
        overflow: "hidden",
      }}
    >
      <div style={styles.logoContainer}>

        <div
          style={styles.headerRow}
        >

          {!collapsed && (

            <div>

              <h2
                style={styles.logoText}
              >
                WiRED International
              </h2>

              <span
                style={styles.subTitle}
              >
                Admin Dashboard
              </span>

            </div>

          )}

          <button
            onClick={onToggle}
            style={styles.toggleButton}
          >
            {collapsed
              ? <Menu size={18} />
              : <ChevronLeft size={18} />
            }
          </button>

        </div>

      </div>

      <nav style={styles.nav}>
        {navItems.map((item) => (
          <Link
            key={item.name}
            to={item.path}
            style={{
              ...styles.navItem,

                justifyContent: collapsed
                  ? "center"
                  : "flex-start",

              ...(location.pathname === item.path
                ? styles.activeNav
                : {}),
            }}
          >
            <>
              <span style={styles.iconWrapper}>
                {item.icon}
              </span>

              {!collapsed && item.name}
            </>
          </Link>
        ))}
      </nav>

      <button style={styles.logoutBtn} onClick={handleLogout}>
        <>
          <LogOut size={18} />

          {!collapsed && "Logout"}
        </>
      </button>
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  sidebar: {
    transition: "width 0.25s ease, padding 0.25s ease",
    height: "100vh",
    flexShrink: 0,
    boxSizing: "border-box",
    backgroundColor: "#fff",
    borderRight: "1px solid #e0e0e0",
    padding: "20px 10px",
    display: "flex",
    flexDirection: "column",
    overflowY: "auto",
  },
  logoContainer: {
    padding: "10px",
  },
  logoText: {
    margin: 0,
    fontSize: "18px",
    fontWeight: 700,
    color: globalStyles.colors.darkText,
  },
  subTitle: {
    fontSize: "13px",
    color: globalStyles.colors.darkText,
    opacity: 0.7,
  },
    nav: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    marginTop: "30px",
    flex: 1,
  },
  navItem: {
    height: "48px",
    borderRadius: "10px",
    textDecoration: "none",
    color: globalStyles.colors.darkText,
    fontWeight: 500,
    transition: "all 0.15s ease",
    display: "flex",
    alignItems: "center",
    gap: "12px",
    paddingInline: "14px",
    whiteSpace: "nowrap",
  },
  activeNav: {
    backgroundColor: "#DBEAFE",

    color: "#1D4ED8",

    fontWeight: 600,
  },
  logoutBtn: {
    marginTop: "auto",
    padding: "10px 16px",
    borderRadius: "6px",
    border: "none",
    cursor: "pointer",
    backgroundColor: globalStyles.colors.error,
    color: "#fff",
    fontWeight: "bold",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
  },
  iconWrapper: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    minWidth: "20px",
  },
  headerRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },

  toggleButton: {
    border: "none",
    background: "transparent",
    cursor: "pointer",
    fontSize: "18px",
    padding: "4px",
    color: "#64748B",
  },
};