import { useEffect, useRef, useState } from "react";
import {
  activateAnnouncement,
  createAnnouncement,
  deactivateAnnouncements,
  deleteAnnouncement,
  fetchAnnouncementsPage,
  updateAnnouncement,
  type Announcement,
} from "../api/alertsApi";
import {
  fetchModules,
  type ModuleRecord,
} from "../api/moduleApi";

function AnnouncementPreview({ text }: { text: string }) {
  const parts = text.replace(/\n+/g, "\n").split(/(\[[^\]]+\]\([^)]+\))/g);

  return (
    <div
      style={{
        whiteSpace: "normal",
        lineHeight: 1.7,
      }}
    >
      {parts.map((part, index) => {
        const match = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);

        if (match) {
          return (
            <span
              key={index}
              style={{
                color: "#2563EB",
                textDecoration: "underline",
                cursor: "default",
              }}
            >
              {match[1]}
            </span>
          );
        }

        return (
          <span key={index}>
            {part.split("\n").map((line, lineIndex) => (
              <span key={lineIndex}>
                {lineIndex > 0 && <br />}
                {line}
              </span>
            ))}
          </span>
        );
      })}
    </div>
  );
}

export default function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [modules, setModules] = useState<ModuleRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [alertText, setAlertText] = useState("");
  const [important, setImportant] = useState(false);
  const [selectedModuleId, setSelectedModuleId] = useState("");
  const [moduleSearch, setModuleSearch] = useState("");
  const [showModuleResults, setShowModuleResults] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [totalAnnouncements, setTotalAnnouncements] = useState(0);

  const moduleSelectorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        moduleSelectorRef.current &&
        !moduleSelectorRef.current.contains(event.target as Node)
      ) {
        setShowModuleResults(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const loadData = async () => {
    const announcementData = await fetchAnnouncementsPage(
      currentPage,
      rowsPerPage
    );

    setAnnouncements(announcementData.announcements);
    setTotalAnnouncements(announcementData.pagination.total);

    if (currentPage > announcementData.pagination.totalPages) {
      setCurrentPage(Math.max(1, announcementData.pagination.totalPages));
    }
  };

  useEffect(() => {
    let mounted = true;

    fetchModules()
      .then((moduleData) => {
        if (mounted) setModules(moduleData);
      })
      .catch((err) => {
        if (mounted) {
          setError(
            err instanceof Error ? err.message : "Unable to load modules."
          );
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let mounted = true;
    setLoading(true);

    fetchAnnouncementsPage(currentPage, rowsPerPage)
      .then((announcementData) => {
        if (!mounted) return;
        setAnnouncements(announcementData.announcements);
        setTotalAnnouncements(announcementData.pagination.total);
      })
      .catch((err) => {
        if (mounted) setError(err instanceof Error ? err.message : "Unable to load data.");
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [currentPage, rowsPerPage]);

  const resetEditor = () => {
    setEditingId(null);
    setAlertText("");
    setImportant(false);
    setSelectedModuleId("");
    setModuleSearch("");
  };

  const startEditing = (announcement: Announcement) => {
    setEditingId(announcement.id);
    setAlertText(announcement.alert);
    setImportant(announcement.important);
    setSelectedModuleId("");
    setError("");
    setMessage("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const insertModuleLink = () => {
    const module = modules.find(
      (item) => String(item.id) === selectedModuleId
    );
    if (!module) return;

    const link = `[View ${module.name}](app://module/${module.id})`;
    setAlertText((current) =>
      current ? `${current}\n\n${link}` : link
    );
    setSelectedModuleId("");
  };

  const save = async () => {
    if (!alertText.trim()) {
      setError("Announcement text is required.");
      return;
    }

    setSaving(true);
    setError("");
    setMessage("");

    try {
      const payload = { alert: alertText.trim(), important };

      if (editingId !== null) {
        await updateAnnouncement(editingId, payload);
        setMessage("Announcement updated.");
      } else {
        await createAnnouncement(payload);
        setMessage("Draft announcement created.");
      }

      await loadData();
      resetEditor();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save announcement.");
    } finally {
      setSaving(false);
    }
  };

  const changeActive = async (id: number | null) => {
    if (saving) return;
    const confirmed = window.confirm(
      id === null
        ? "Remove the current announcement from HealthMAP?"
        : "Display this announcement in HealthMAP?"
    );
    if (!confirmed) return;

    setSaving(true);
    setError("");
    setMessage("");

    try {
      if (id === null) {
        await deactivateAnnouncements();
        setMessage("All announcements deactivated.");
      } else {
        await activateAnnouncement(id);
        setMessage("Announcement activated.");
      }
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update status.");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: number) => {
    if (saving) return;
    if (!window.confirm("Permanently delete this announcement?")) return;

    setSaving(true);
    setError("");
    setMessage("");

    try {
      await deleteAnnouncement(id);
      await loadData();
      if (editingId === id) resetEditor();
      setMessage("Announcement deleted.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to delete announcement.");
    } finally {
      setSaving(false);
    }
  };

  const totalPages = Math.max(
    1,
    Math.ceil(totalAnnouncements / rowsPerPage)
  );

  const safeCurrentPage = Math.min(currentPage, totalPages);

  // The backend already returns only the requested page.
  const paginatedAnnouncements = announcements;

  return (
    <div style={styles.page}>
      <h1 style={styles.heading}>News &amp; Updates</h1>
      <p style={styles.description}>
        Manage announcements displayed on the HealthMAP home page.
        Only one announcement can be active at a time.
      </p>

      {error && <div style={styles.error}>{error}</div>}
      {message && <div style={styles.success}>{message}</div>}

      <section style={styles.card}>
        <h2 style={styles.sectionTitle}>
          {editingId === null ? "Create Announcement" : `Edit Announcement #${editingId}`}
        </h2>

        <label style={styles.label} htmlFor="announcement-text">
          Announcement text
        </label>
        <textarea
          id="announcement-text"
          value={alertText}
          onChange={(event) => setAlertText(event.target.value)}
          rows={6}
          style={styles.textarea}
          placeholder="Enter the announcement displayed in HealthMAP..."
        />

        <div style={styles.moduleRow}>
          <div
            ref={moduleSelectorRef}
            style={{ position: "relative", flex: 1, minWidth: 240 }}
          >
            <input
              type="text"
              aria-label="Search and select module"
              placeholder="Search and select a module by name or ID..."
              value={moduleSearch}
              onFocus={() => setShowModuleResults(true)}
              onChange={(event) => {
                setModuleSearch(event.target.value);
                setSelectedModuleId("");
                setShowModuleResults(true);
              }}
              style={styles.searchInput}
            />

            {showModuleResults && (
              <div style={styles.searchResults}>
                {modules
                  .filter((module) => !module.is_archived)
                  .filter((module) => {
                    const query = moduleSearch.trim().toLowerCase();

                    return (
                      module.name.toLowerCase().includes(query) ||
                      String(module.id).includes(query) ||
                      String(module.module_id ?? "").toLowerCase().includes(query)
                    );
                  })
                  .sort((a, b) => a.name.localeCompare(b.name))
                  .slice(0, 30)
                  .map((module) => (
                    <button
                      key={module.id}
                      type="button"
                      style={styles.searchResultItem}
                      onClick={() => {
                        setSelectedModuleId(String(module.id));
                        setModuleSearch(module.name);
                        setShowModuleResults(false);
                      }}
                    >
                      {module.name} (ID: {module.module_id || module.id})
                    </button>
                  ))}
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => {
              insertModuleLink();
              setShowModuleResults(false);
              setModuleSearch("");
            }}
            disabled={!selectedModuleId || saving}
            style={styles.secondaryButton}
          >
            Insert Module Link
          </button>
        </div>

        <label style={styles.checkboxLabel}>
          <input
            type="checkbox"
            checked={important}
            onChange={(event) => setImportant(event.target.checked)}
          />
          Important announcement (red text in HealthMAP)
        </label>

        <div style={styles.previewContainer}>
          <div style={styles.previewHeading}>
            HealthMAP Announcement Preview
          </div>

          <div
            style={{
              ...styles.previewContent,
              color: important ? "#B91C1C" : "#334155",
            }}
          >
            {alertText.trim() ? (
              <AnnouncementPreview text={alertText} />
            ) : (
              <span style={{ color: "#94A3B8" }}>
                Your announcement preview will appear here.
              </span>
            )}
          </div>
        </div>

        <div style={styles.actions}>
          <button
            type="button"
            onClick={save}
            disabled={saving || loading}
            style={styles.primaryButton}
          >
            {saving ? "Saving..." : editingId === null ? "Save Draft" : "Save Changes"}
          </button>
          {editingId !== null && (
            <button type="button" onClick={resetEditor} style={styles.secondaryButton}>
              Cancel Editing
            </button>
          )}
        </div>
      </section>

      <section style={styles.card}>
        <div style={styles.historyHeader}>
          <h2 style={styles.sectionTitle}>Announcement History</h2>
          <button
            type="button"
            onClick={() => changeActive(null)}
            disabled={saving || totalAnnouncements === 0}
            style={styles.secondaryButton}
          >
            Deactivate All
          </button>
        </div>

        {loading ? (
          <p>Loading announcements...</p>
        ) : announcements.length === 0 ? (
          <p>No announcements have been created.</p>
        ) : (
          <div>
            <div style={styles.tableWrapper}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Date</th>
                  <th style={styles.th}>Announcement</th>
                  <th style={styles.th}>Status</th>
                  <th style={styles.th}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedAnnouncements.map((announcement) => (
                  <tr key={announcement.id}>
                    <td style={styles.td}>
                      {new Date(announcement.createdAt).toLocaleDateString()}
                    </td>
                    <td style={{ ...styles.td, minWidth: 250 }}>
                      <AnnouncementPreview text={announcement.alert} />
                      {announcement.important && (
                        <span style={styles.important}>Important</span>
                      )}
                    </td>
                    <td style={styles.td}>
                      <span style={announcement.is_active ? styles.active : styles.inactive}>
                        {announcement.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td style={styles.td}>
                      <div style={styles.rowActions}>
                        <button
                          type="button"
                          onClick={() => startEditing(announcement)}
                          disabled={saving}
                          style={styles.secondaryButton}
                        >
                          Edit
                        </button>
                        {!announcement.is_active && (
                          <button
                            type="button"
                            onClick={() => changeActive(announcement.id)}
                            disabled={saving}
                            style={styles.primaryButton}
                          >
                            Activate
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => remove(announcement.id)}
                          disabled={saving}
                          style={styles.dangerButton}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={styles.paginationControls}>
            <div style={styles.paginationInfo}>
              <span>Rows per page:</span>

              <select
                value={rowsPerPage}
                onChange={(event) => {
                  setRowsPerPage(Number(event.target.value));
                  setCurrentPage(1);
                }}
                style={styles.paginationSelect}
              >
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>

              <span>
                {totalAnnouncements === 0 ? 0 : (safeCurrentPage - 1) * rowsPerPage + 1}–
                {Math.min(safeCurrentPage * rowsPerPage, totalAnnouncements)}{" "}
                of {totalAnnouncements}
              </span>
            </div>

            <div style={styles.paginationInfo}>
              <button
                type="button"
                disabled={safeCurrentPage <= 1}
                onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                style={styles.secondaryButton}
              >
                Previous
              </button>

              <span>Page {safeCurrentPage} of {totalPages}</span>

              <button
                type="button"
                disabled={safeCurrentPage >= totalPages}
                onClick={() =>
                  setCurrentPage((page) => Math.min(totalPages, page + 1))
                }
                style={styles.secondaryButton}
              >
                Next
              </button>
            </div>
          </div>
        </div>
        )}
      </section>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    display: "flex",
    flexDirection: "column",
    gap: "25px",
    padding: "15px 20px 20px",
    fontFamily: "Arial, Helvetica, sans-serif",
    color: "#374151",
  },

  heading: {
    margin: 0,
    fontSize: "28px",
    fontWeight: 700,
    color: "#111827",
  },

  description: {
    margin: "-19px 0 0",
    color: "#666666",
    fontSize: "14px",
    lineHeight: 1.5,
  },

  card: {
    background: "#FFFFFF",
    border: "1px solid #E2E8F0",
    borderRadius: 12,
    padding: 24,
  },

  sectionTitle: { fontSize: 19, margin: "0 0 16px" },

  label: { display: "block", fontWeight: 600, marginBottom: 8 },

  textarea: {
    boxSizing: "border-box",
    width: "100%",
    padding: 12,
    borderRadius: 8,
    border: "1px solid #CBD5E1",
    fontFamily: "inherit",
    fontSize: 14,
    resize: "vertical",
  },

  moduleRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 12,
    marginBottom: 16,
  },

  select: {
    flex: 1,
    minWidth: 240,
    padding: 10,
    border: "1px solid #CBD5E1",
    borderRadius: 8,
    background: "#FFFFFF",
  },

  checkboxLabel: { display: "flex", alignItems: "center", gap: 8, marginBottom: 18 },

  actions: { display: "flex", flexWrap: "wrap", gap: 10 },

  primaryButton: {
    background: "#2563EB",
    color: "#FFFFFF",
    border: "none",
    borderRadius: 7,
    padding: "9px 14px",
    cursor: "pointer",
    fontWeight: 600,
  },

  secondaryButton: {
    background: "#FFFFFF",
    border: "1px solid #CBD5E1",
    borderRadius: 7,
    padding: "9px 14px",
    cursor: "pointer",
  },

  dangerButton: {
    background: "#FFFFFF",
    border: "1px solid #FCA5A5",
    color: "#B91C1C",
    borderRadius: 7,
    padding: "9px 14px",
    cursor: "pointer",
  },

  historyHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    flexWrap: "wrap",
  },

  tableWrapper: { overflowX: "auto" },

  table: { width: "100%", borderCollapse: "collapse" },

  th: {
    padding: 12,
    background: "#F8FAFC",
    borderBottom: "1px solid #E2E8F0",
    textAlign: "left",
    fontSize: 13,
  },

  td: { padding: 12, borderBottom: "1px solid #E2E8F0", verticalAlign: "top", fontSize: 14 },

  rowActions: { display: "flex", gap: 8, flexWrap: "wrap" },

  active: { color: "#15803D", fontWeight: 700 },

  inactive: { color: "#64748B" },

  important: { display: "block", color: "#B91C1C", fontSize: 12, marginTop: 6 },

  error: { background: "#FEE2E2", color: "#991B1B", padding: 12, borderRadius: 8 },

  success: { background: "#DCFCE7", color: "#166534", padding: 12, borderRadius: 8 },

  searchInput: {
    width: "100%",
    boxSizing: "border-box",
    padding: "11px 12px",
    border: "1px solid #CBD5E1",
    borderRadius: 8,
    background: "#FFFFFF",
    fontSize: 14,
    fontFamily: "inherit",
  },

  searchResults: {
    position: "absolute",
    top: "100%",
    left: 0,
    right: 0,
    zIndex: 20,
    maxHeight: 260,
    overflowY: "auto",
    background: "#FFFFFF",
    border: "1px solid #CBD5E1",
    borderRadius: 8,
    marginTop: 4,
    boxShadow: "0 8px 20px rgba(0,0,0,0.1)",
  },

  searchResultItem: {
    display: "block",
    width: "100%",
    padding: "11px 12px",
    textAlign: "left",
    border: "none",
    borderBottom: "1px solid #F1F5F9",
    background: "#FFFFFF",
    cursor: "pointer",
    fontSize: 14,
  },

  previewContainer: {
    marginBottom: 20,
    border: "1px solid #DBEAFE",
    borderRadius: 10,
    overflow: "hidden",
  },

  previewHeading: {
    padding: "10px 14px",
    backgroundColor: "#EFF6FF",
    color: "#1D4ED8",
    fontSize: 13,
    fontWeight: 700,
  },

  previewContent: {
    padding: "16px",
    backgroundColor: "#FFFFFF",
    fontSize: 14,
    minHeight: 48,
  },

  paginationControls: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 16,
    paddingTop: 16,
  },

  paginationInfo: {
    display: "flex",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 12,
    fontSize: 14,
    color: "#374151",
  },

  paginationSelect: {
    padding: "8px 12px",
    border: "1px solid #D1D5DB",
    borderRadius: 6,
    background: "#FFFFFF",
    fontSize: 14,
  },
};
