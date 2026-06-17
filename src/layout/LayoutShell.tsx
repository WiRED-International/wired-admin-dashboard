import { useState } from "react";
import Sidebar from "./Sidebar";

export default function LayoutShell({ children }: { children: React.ReactNode }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div style={styles.shell}>

      <div style={styles.sidebarWrapper}>
        <Sidebar
          collapsed={sidebarCollapsed}
          onToggle={() =>
            setSidebarCollapsed(
              (prev) => !prev
            )
          }
        />
      </div>

      <main style={styles.content}>
        {children}
      </main>

    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  shell: {
    display: "flex",
    position: "fixed",
    top: 0,
    left: 0,
    height: "100vh",
    width: "100%",
    overflow: "hidden",
    backgroundColor: "#f7f8fa",
  },

  content: {
    flex: 1,
    minWidth: 0,
    overflowY: "auto",
    backgroundColor: "#f7f8fa",
    
  },
  
  sidebarWrapper: {
    position: "relative",
    display: "flex",
  },

  collapseButton: {
    position: "absolute",
    top: "10px",
    right: "-30px",
    width: "42px",
    height: "42px",
    borderRadius: "50%",
    border: "1px solid #d0d0d0",
    backgroundColor: "#f8f8f8",
    cursor: "pointer",
    zIndex: 100,
    fontSize: "22px",
    fontWeight: "bold",
    boxShadow: "0 3px 10px rgba(0,0,0,0.22)",
  },
};