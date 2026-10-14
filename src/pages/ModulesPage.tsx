import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  fetchModules,
  archiveModule,
  restoreModule,
  fetchPrograms,
  ModuleRecord,
  ModuleProgram,
  fetchLetters,
  fetchCategories,
  LetterOption,
  CategoryOption,
} from "../api/moduleApi";

export default function ModulesPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const successMessage =
    (location.state as { successMessage?: string } | null)?.successMessage;
  const [modules, setModules] = useState<ModuleRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [programs, setPrograms] = useState<ModuleProgram[]>([]);
  const [selectedProgramId, setSelectedProgramId] = useState("");
  const [selectedType, setSelectedType] = useState("");
  const [archiveFilter, setArchiveFilter] = useState<
    "active" | "archived" | "all"
  >("active");
  const [letters, setLetters] = useState<LetterOption[]>([]);
  const [categories, setCategories] = useState<CategoryOption[]>([]);

  const [selectedLetterId, setSelectedLetterId] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [selectedSubcategoryId, setSelectedSubcategoryId] = useState("");
  type SortField = "module_id" | "name" | "type" | "program" | "content_updated_at";

  const [sortField, setSortField] = useState<SortField>("name");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">(
    "asc"
  );
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(50);

  const [updatingModuleId, setUpdatingModuleId] = useState<number | null>(null);

  const handleArchiveToggle = async (module: ModuleRecord) => {
    const action = module.is_archived ? "restore" : "archive";

    const confirmed = window.confirm(
      `Are you sure you want to ${action} "${module.name}"?`
    );

    if (!confirmed) return;

    try {
      setUpdatingModuleId(module.id);
      setError(null);

      if (module.is_archived) {
        await restoreModule(module.id);
      } else {
        await archiveModule(module.id);
      }

      setModules((currentModules) =>
        currentModules.map((item) =>
          item.id === module.id
            ? { ...item, is_archived: !module.is_archived }
            : item
        )
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : `Failed to ${action} module.`
      );
    } finally {
      setUpdatingModuleId(null);
    }
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((current) =>
        current === "asc" ? "desc" : "asc"
      );
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  useEffect(() => {
    if (!successMessage) return;

    window.scrollTo({ top: 0, behavior: "instant" });

    // Clear the navigation message so it does not reappear later.
    window.history.replaceState(
      { ...window.history.state, usr: null },
      ""
    );
  }, [successMessage]);

  useEffect(() => {
    const loadModules = async () => {
      try {
        setLoading(true);
        setError(null);

        const [
          modulesData,
          programsData,
          lettersData,
          categoriesData,
        ] = await Promise.all([
          fetchModules(),
          fetchPrograms(),
          fetchLetters(),
          fetchCategories(),
        ]);

        setModules(modulesData);
        setPrograms(programsData);
        setLetters(lettersData);
        setCategories(categoriesData);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Failed to load modules."
        );
      } finally {
        setLoading(false);
      }
    };

    loadModules();
  }, []);

  const availableSubcategories = categories
    .filter(
      (category) =>
        !selectedCategoryId ||
        String(category.id) === selectedCategoryId
    )
    .flatMap((category) => category.subCategories ?? []);

  const filteredModules = modules.filter((module) => {
    const query = searchQuery.trim().toLowerCase();

    const matchesSearch =
      !query ||
      (module.name || "").toLowerCase().includes(query) ||
      (module.module_id || "").toLowerCase().includes(query);

    const matchesProgram =
      !selectedProgramId ||
      module.programs?.some(
        (program) => String(program.id) === selectedProgramId
      );

    const matchesType =
      !selectedType || module.type === selectedType;

    const matchesArchiveStatus =
      archiveFilter === "all" ||
      (archiveFilter === "active" && !module.is_archived) ||
      (archiveFilter === "archived" && module.is_archived);

    const matchesLetter =
      !selectedLetterId ||
      module.letters?.some(
        (letter) => String(letter.id) === selectedLetterId
      );

    const matchesCategory =
      !selectedCategoryId ||
      module.subCategories?.some(
        (subcategory) =>
          String(subcategory.category_id) === selectedCategoryId
      );

    const matchesSubcategory =
      !selectedSubcategoryId ||
      module.subCategories?.some(
        (subcategory) =>
          String(subcategory.id) === selectedSubcategoryId
      );

    return (
      matchesSearch &&
      matchesProgram &&
      matchesType &&
      matchesArchiveStatus &&
      matchesLetter &&
      matchesCategory &&
      matchesSubcategory
    );
  });

  const sortedModules = [...filteredModules].sort((a, b) => {
    const getSortValue = (module: ModuleRecord): string => {
      switch (sortField) {
        case "module_id":
          return module.module_id || "";

        case "type":
          return module.type || "";

        case "program":
          return module.programs
            ?.map((program) => program.name)
            .sort()
            .join(", ") || "";

        case "content_updated_at":
          return module.content_updated_at || "";

        case "name":
        default:
          return module.name || "";
      }
    };

    const comparison = getSortValue(a).localeCompare(
      getSortValue(b),
      undefined,
      {
        numeric: true,
        sensitivity: "base",
      }
    );

    return sortDirection === "asc"
      ? comparison
      : -comparison;
  });

  const totalPages =
    rowsPerPage === 0
      ? 1
      : Math.max(
          1,
          Math.ceil(sortedModules.length / rowsPerPage)
        );

  const safeCurrentPage = Math.min(currentPage, totalPages);

  const paginatedModules =
    rowsPerPage === 0
      ? sortedModules
      : sortedModules.slice(
          (safeCurrentPage - 1) * rowsPerPage,
          safeCurrentPage * rowsPerPage
        );

  const handleClearFilters = () => {
    setSearchQuery("");
    setSelectedProgramId("");
    setSelectedType("");
    setSelectedLetterId("");
    setSelectedCategoryId("");
    setSelectedSubcategoryId("");
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [
    searchQuery,
    selectedProgramId,
    selectedType,
    selectedLetterId,
    selectedCategoryId,
    selectedSubcategoryId,
    sortField,
    sortDirection,
    rowsPerPage,
  ]);

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.heading}>
            Modules
          </h1>

          <p style={styles.subheading}>
            Manage HealthMAP modules, training assignments,
            library organization, CME settings, and module packages.
          </p>
        </div>

        <div
          style={{
            display: "flex",
            gap: "10px",
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          <button
            type="button"
            style={{
              ...styles.addButton,
              backgroundColor: "#FFFFFF",
              color: "#2563EB",
              border: "1px solid #2563EB",
            }}
            onClick={() => navigate("/admin/categories")}
          >
            Manage Categories
          </button>

          <button
            type="button"
            style={styles.addButton}
            onClick={() => navigate("/admin/modules/new")}
          >
            + Add Module
          </button>
        </div>
      </div>

      {successMessage && (
        <div
          role="status"
          style={{
            padding: "14px 18px",
            borderRadius: "8px",
            backgroundColor: "#DCFCE7",
            border: "1px solid #86EFAC",
            color: "#166534",
            fontSize: "14px",
            fontWeight: 600,
          }}
        >
          ✓ {successMessage}
        </div>
      )}

      {error && (
        <div style={styles.errorBox}>
          {error}
        </div>
      )}

      <div style={styles.searchControls}>
        <input
          type="text"
          placeholder="Search by module name or ID..."
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          style={styles.searchInput}
        />

        <select
          value={selectedProgramId}
          onChange={(event) => setSelectedProgramId(event.target.value)}
          style={styles.filterSelect}
        >
          <option value="">All Programs</option>

          {programs.map((program) => (
            <option key={program.id} value={String(program.id)}>
              {program.name}
            </option>
          ))}
        </select>

        <select
          value={selectedType}
          onChange={(event) => setSelectedType(event.target.value)}
          style={styles.filterSelect}
        >
          <option value="">All Types</option>
          <option value="module">Module</option>
          <option value="animation">Animation</option>
        </select>

        <select
          value={archiveFilter}
          onChange={(event) =>
            setArchiveFilter(
              event.target.value as "active" | "archived" | "all"
            )
          }
          style={styles.filterSelect}
        >
          <option value="active">Active Modules</option>
          <option value="archived">Archived Modules</option>
          <option value="all">All Modules</option>
        </select>

        <select
          value={selectedLetterId}
          onChange={(event) => setSelectedLetterId(event.target.value)}
          style={styles.filterSelect}
        >
          <option value="">All Letters</option>

          {letters.map((letter) => (
            <option key={letter.id} value={String(letter.id)}>
              {letter.letters}
            </option>
          ))}
        </select>

        <select
          value={selectedCategoryId}
          onChange={(event) => {
            setSelectedCategoryId(event.target.value);
            setSelectedSubcategoryId("");
          }}
          style={styles.filterSelect}
        >
          <option value="">All Categories</option>

          {categories.map((category) => (
            <option key={category.id} value={String(category.id)}>
              {category.name}
            </option>
          ))}
        </select>

        <select
          value={selectedSubcategoryId}
          onChange={(event) =>
            setSelectedSubcategoryId(event.target.value)
          }
          style={styles.filterSelect}
        >
          <option value="">All Subcategories</option>

          {availableSubcategories.map((subcategory) => (
            <option
              key={subcategory.id}
              value={String(subcategory.id)}
            >
              {subcategory.name}
            </option>
          ))}
        </select>

        <button
          type="button"
          onClick={handleClearFilters}
          disabled={
            !searchQuery &&
            !selectedProgramId &&
            !selectedType &&
            !selectedLetterId &&
            !selectedCategoryId &&
            !selectedSubcategoryId
          }
          style={styles.clearFiltersButton}
        >
          Clear Filters
        </button>

        <span style={styles.resultCount}>
          {filteredModules.length} of {modules.length} modules
        </span>
      </div>

      <div style={styles.tableWrapper}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th
                style={styles.sortableTh}
                onClick={() => handleSort("module_id")}
              >
                Module ID {sortField === "module_id"
                  ? sortDirection === "asc" ? "▲" : "▼"
                  : "↕"}
              </th>

              <th
                style={styles.sortableTh}
                onClick={() => handleSort("name")}
              >
                Name {sortField === "name"
                  ? sortDirection === "asc" ? "▲" : "▼"
                  : "↕"}
              </th>

              <th
                style={styles.sortableTh}
                onClick={() => handleSort("type")}
              >
                Type {sortField === "type"
                  ? sortDirection === "asc" ? "▲" : "▼"
                  : "↕"}
              </th>

              <th style={styles.th}>
                Letters
              </th>

              <th style={styles.th}>
                Categories
              </th>

              <th style={styles.th}>
                Subcategories
              </th>

              <th
                style={styles.sortableTh}
                onClick={() => handleSort("program")}
              >
                Program {sortField === "program"
                  ? sortDirection === "asc" ? "▲" : "▼"
                  : "↕"}
              </th>

              <th
                style={styles.sortableTh}
                onClick={() => handleSort("content_updated_at")}
              >
                Content Updated {sortField === "content_updated_at"
                  ? sortDirection === "asc" ? "▲" : "▼"
                  : "↕"}
              </th>

              <th style={styles.th}>
                Actions
              </th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td
                  colSpan={9}
                  style={styles.emptyCell}
                >
                  Loading modules...
                </td>
              </tr>
            ) : filteredModules.length === 0 ? (
              <tr>
                <td
                  colSpan={9}
                  style={styles.emptyCell}
                >
                  No modules found.
                </td>
              </tr>
            ) : (
              paginatedModules.map((module) => (
                <tr key={module.id}>
                  <td style={styles.td}>
                    {module.module_id || "—"}
                  </td>

                  <td style={styles.td}>
                    {module.name}
                  </td>

                  <td style={styles.td}>
                    {module.type === "animation"
                      ? "Animation"
                      : "Module"}
                  </td>

                  <td style={styles.td}>
                    {module.letters?.length
                      ? module.letters
                          .map((letter) => letter.letters)
                          .join(", ")
                      : "—"}
                  </td>

                  <td style={styles.td}>
                    {module.subCategories?.length
                      ? Array.from(
                          new Set(
                            module.subCategories
                              .map((subcategory) => subcategory.category?.name)
                              .filter((name): name is string => Boolean(name))
                          )
                        ).join(", ") || "—"
                      : "—"}
                  </td>

                  <td style={styles.td}>
                    {module.subCategories?.length
                      ? module.subCategories
                          .map(
                            (subcategory) =>
                              subcategory.name ||
                              `#${subcategory.id}`
                          )
                          .join(", ")
                      : "—"}
                  </td>

                  <td style={styles.td}>
                    {module.programs?.length
                      ? module.programs
                          .map((program) => program.name)
                          .join(", ")
                      : "—"}
                  </td>

                  <td style={styles.td}>
                    {module.content_updated_at
                      ? new Date(
                          `${module.content_updated_at}T00:00:00`
                        ).toLocaleDateString("en-US")
                      : "—"}
                  </td>

                  <td style={styles.td}>
                    <div
                      style={{
                        display: "flex",
                        gap: "8px",
                        alignItems: "center",
                      }}
                    >
                      <button
                        type="button"
                        style={styles.editButton}
                        onClick={() =>
                          navigate(`/admin/modules/${module.id}/edit`)
                        }
                      >
                        Edit
                      </button>

                      <button
                        type="button"
                        style={styles.editButton}
                        disabled={updatingModuleId === module.id}
                        onClick={() => handleArchiveToggle(module)}
                      >
                        {updatingModuleId === module.id
                          ? "Updating..."
                          : module.is_archived
                            ? "Restore"
                            : "Archive"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <div style={styles.paginationControls}>
        <div style={styles.paginationInfo}>
          <span>Rows per page:</span>

          <select
            value={rowsPerPage}
            onChange={(event) =>
              setRowsPerPage(Number(event.target.value))
            }
            style={styles.filterSelect}
          >
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
            <option value={0}>All</option>
          </select>

          <span>
            {sortedModules.length === 0
              ? "0"
              : rowsPerPage === 0
                ? `1–${sortedModules.length}`
                : `${(safeCurrentPage - 1) * rowsPerPage + 1}–${Math.min(
                    safeCurrentPage * rowsPerPage,
                    sortedModules.length
                  )}`}{" "}
            of {sortedModules.length}
          </span>
        </div>

        <div style={styles.paginationButtons}>
          <button
            type="button"
            disabled={safeCurrentPage <= 1}
            onClick={() =>
              setCurrentPage((page) => Math.max(1, page - 1))
            }
            style={styles.pageButton}
          >
            Previous
          </button>

          <span>
            Page {safeCurrentPage} of {totalPages}
          </span>

          <button
            type="button"
            disabled={safeCurrentPage >= totalPages}
            onClick={() =>
              setCurrentPage((page) =>
                Math.min(totalPages, page + 1)
              )
            }
            style={styles.pageButton}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}

const styles: {
  [key: string]: React.CSSProperties;
} = {
  container: {
    display: "flex",
    flexDirection: "column",
    gap: "25px",
    paddingLeft: "20px",
    paddingRight: "20px",
    paddingTop: "15px",
    paddingBottom: "20px",
  },

  heading: {
    margin: 0,
    fontSize: "28px",
    fontWeight: 700,
  },

  subheading: {
    marginTop: "6px",
    marginBottom: 0,
    color: "#666",
    fontSize: "14px",
  },

  errorBox: {
    padding: "12px 14px",
    borderRadius: "8px",
    backgroundColor: "#FEE2E2",
    color: "#991B1B",
    fontSize: "14px",
  },

  tableWrapper: {
    width: "100%",
    overflowX: "auto",
    border: "1px solid #E5E7EB",
    borderRadius: "10px",
    backgroundColor: "#FFFFFF",
  },

  table: {
    width: "100%",
    borderCollapse: "collapse",
    minWidth: "1050px",
  },

  th: {
    padding: "12px 14px",
    textAlign: "left",
    borderBottom: "1px solid #E5E7EB",
    backgroundColor: "#F8FAFC",
    fontSize: "13px",
    fontWeight: 600,
    color: "#374151",
    whiteSpace: "nowrap",
  },

  td: {
    padding: "12px 14px",
    borderBottom: "1px solid #E5E7EB",
    fontSize: "14px",
    color: "#374151",
    verticalAlign: "top",
  },

  emptyCell: {
    padding: "30px",
    textAlign: "center",
    color: "#6B7280",
  },

  editButton: {
    border: "1px solid #D1D5DB",
    borderRadius: "6px",
    backgroundColor: "#FFFFFF",
    padding: "6px 12px",
    cursor: "pointer",
    fontWeight: 500,
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    flexWrap: "wrap",
    gap: "16px",
  },

  addButton: {
    border: "none",
    borderRadius: "6px",
    backgroundColor: "#2563EB",
    color: "#FFFFFF",
    padding: "10px 18px",
    cursor: "pointer",
    fontWeight: 600,
    fontSize: "14px",
    whiteSpace: "nowrap",
  },

  searchControls: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: "12px",
  },

  searchInput: {
    width: "100%",
    maxWidth: "400px",
    padding: "10px 12px",
    border: "1px solid #D1D5DB",
    borderRadius: "6px",
    fontSize: "14px",
    outline: "none",
  },

  resultCount: {
    fontSize: "13px",
    color: "#6B7280",
    whiteSpace: "nowrap",
  },

  filterSelect: {
    padding: "10px 12px",
    border: "1px solid #D1D5DB",
    borderRadius: "6px",
    backgroundColor: "#FFFFFF",
    fontSize: "14px",
    minWidth: "160px",
    cursor: "pointer",
  },

  clearFiltersButton: {
    padding: "10px 14px",
    border: "1px solid #D1D5DB",
    borderRadius: "6px",
    backgroundColor: "#F9FAFB",
    color: "#374151",
    fontSize: "14px",
    fontWeight: 500,
    cursor: "pointer",
    whiteSpace: "nowrap",
  },

  sortableTh: {
    padding: "12px 14px",
    textAlign: "left",
    borderBottom: "1px solid #E5E7EB",
    backgroundColor: "#F8FAFC",
    fontSize: "13px",
    fontWeight: 600,
    color: "#374151",
    whiteSpace: "nowrap",
    cursor: "pointer",
    userSelect: "none",
  },

  paginationControls: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "16px",
    padding: "8px 0",
  },

  paginationInfo: {
    display: "flex",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "12px",
    fontSize: "14px",
    color: "#374151",
  },

  paginationButtons: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    fontSize: "14px",
    color: "#374151",
  },

  pageButton: {
    padding: "8px 14px",
    border: "1px solid #D1D5DB",
    borderRadius: "6px",
    backgroundColor: "#FFFFFF",
    cursor: "pointer",
    fontSize: "14px",
  },
};