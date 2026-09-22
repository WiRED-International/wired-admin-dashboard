import { useEffect, useState } from "react";
import ClassesTable from "../components/Classes/ClassesTable";
import {
  fetchClasses,
  fetchClassPrograms,
  fetchClassLocations,
} from "../api/classAPI";
import { fetchAllOrganizations } from "../api/organizationsAPI";
import { ClassItem } from "../interfaces/Class";
import { useNavigate } from "react-router-dom";
import Select from "../components/ui/Select";

export default function ClassesPage() {
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchFilter, setSearchFilter] = useState("");
  const [programFilter, setProgramFilter] = useState("all");
  const [organizationFilter, setOrganizationFilter] = useState("all");
  const [locationFilter, setLocationFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const navigate = useNavigate();

  const [programs, setPrograms] = useState<
    { id: number; name: string }[]
  >([]);

  const [organizations, setOrganizations] = useState<
    { id: number; name: string }[]
  >([]);

  const [locations, setLocations] = useState<
    { id: number; name: string }[]
  >([]);

  const [debouncedSearch, setDebouncedSearch] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(25);
  const [totalClasses, setTotalClasses] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedSearch(searchFilter);
    }, 400);

    return () => clearTimeout(timeout);
  }, [searchFilter]);

  useEffect(() => {
    const loadClasses = async () => {
      try {
        setLoading(true);
        setError(null);

        const data = await fetchClasses({
          search: debouncedSearch,
          programId:
            programFilter === "all"
              ? undefined
              : Number(programFilter),
          organizationId:
            organizationFilter === "all"
              ? undefined
              : Number(organizationFilter),
          locationId:
            locationFilter === "all"
              ? undefined
              : Number(locationFilter),
          status:
            statusFilter === "all"
              ? undefined
              : statusFilter,
          page: currentPage,
          limit: pageSize,
        });

        setClasses(data.classes);
        setTotalClasses(data.pagination.total);
        setTotalPages(data.pagination.totalPages);
      } catch (err) {
        console.error("Failed to load classes:", err);

        setError(
          err instanceof Error
            ? err.message
            : "Failed to load classes."
        );
      } finally {
        setLoading(false);
      }
    };

    loadClasses();
  }, [
    debouncedSearch,
    programFilter,
    organizationFilter,
    locationFilter,
    statusFilter,
    currentPage,
    pageSize,
  ]);

  useEffect(() => {
    const loadFilterOptions = async () => {
      try {
        const [
          programData,
          organizationData,
          locationData,
        ] = await Promise.all([
          fetchClassPrograms(),
          fetchAllOrganizations(),
          fetchClassLocations(),
        ]);

        setPrograms(programData.programs);
        setOrganizations(organizationData);
        setLocations(locationData);
      } catch (err) {
        console.error("Failed to load class filter options:", err);
      }
    };

    loadFilterOptions();
  }, []);

  const firstClassNumber =
    totalClasses === 0
      ? 0
      : (currentPage - 1) * pageSize + 1;

  const lastClassNumber = Math.min(
    currentPage * pageSize,
    totalClasses
  );

  return (
    <div style={styles.container}>
      <div style={styles.headerRow}>
        <div>
          <h1 style={styles.heading}>Classes</h1>
          <p style={styles.subheading}>
            Manage training classes and student enrollment.
          </p>
        </div>

        <button
          style={styles.createButton}
          onClick={() => navigate("/classes/new")}
        >
          + Create Class
        </button>
      </div>

      {error && (
        <div style={styles.error}>
          {error}
        </div>
      )}
      <div style={styles.filters}>
        <div style={styles.filterGroup}>
          <label style={styles.filterLabel}>
            Search Class Name
          </label>

          <input
            type="text"
            value={searchFilter}
            onChange={(e) => {
              setSearchFilter(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search classes..."
            style={styles.searchInput}
          />
        </div>

        <div style={styles.filterGroup}>
          <label style={styles.filterLabel}>
            Program
          </label>

          <Select
            value={programFilter}
            onChange={(e) => {
              setProgramFilter(e.target.value);
              setCurrentPage(1);
            }}
            options={[
              { label: "All Programs", value: "all" },
              ...programs.map((program) => ({
                label: program.name,
                value: String(program.id),
              })),
            ]}
            style={{ width: "200px" }}
          />
        </div>

        <div style={styles.filterGroup}>
          <label style={styles.filterLabel}>
            Organization
          </label>

          <Select
            value={organizationFilter}
            onChange={(e) => {
              setOrganizationFilter(e.target.value);
              setCurrentPage(1);
            }}
            options={[
              { label: "All Organizations", value: "all" },
              ...organizations.map((organization) => ({
                label: organization.name,
                value: String(organization.id),
              })),
            ]}
            style={{ width: "220px" }}
          />
        </div>

        <div style={styles.filterGroup}>
          <label style={styles.filterLabel}>
            Location
          </label>

          <Select
            value={locationFilter}
            onChange={(e) => {
              setLocationFilter(e.target.value);
              setCurrentPage(1);
            }}
            options={[
              { label: "All Locations", value: "all" },
              ...locations.map((location) => ({
                label: location.name,
                value: String(location.id),
              })),
            ]}
            style={{ width: "200px" }}
          />
        </div>

        <div style={styles.filterGroup}>
          <label style={styles.filterLabel}>
            Status
          </label>

          <Select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            options={[
              { label: "All Classes", value: "all" },
              { label: "Draft", value: "draft" },
              { label: "Active", value: "active" },
              { label: "Completed", value: "completed" },
              { label: "Archived", value: "archived" },
            ]}
            style={{ width: "180px" }}
          />
        </div>
      </div>
      <ClassesTable
        classes={classes}
        loading={loading}
      />
      {!loading && totalClasses > 0 && (
        <div style={styles.pagination}>
          <div style={styles.paginationSummary}>
            Showing {firstClassNumber}–{lastClassNumber} of{" "}
            {totalClasses} classes
          </div>

          <div style={styles.paginationControls}>
            <button
              type="button"
              onClick={() =>
                setCurrentPage((page) => Math.max(1, page - 1))
              }
              disabled={currentPage <= 1}
              style={{
                ...styles.paginationButton,
                ...(currentPage <= 1
                  ? styles.paginationButtonDisabled
                  : {}),
              }}
            >
              Previous
            </button>

            <span style={styles.pageIndicator}>
              Page {currentPage} of {totalPages}
            </span>

            <button
              type="button"
              onClick={() =>
                setCurrentPage((page) =>
                  Math.min(totalPages, page + 1)
                )
              }
              disabled={currentPage >= totalPages}
              style={{
                ...styles.paginationButton,
                ...(currentPage >= totalPages
                  ? styles.paginationButtonDisabled
                  : {}),
              }}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
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

  error: {
    padding: "12px",
    borderRadius: "6px",
    background: "#FEE2E2",
    color: "#B91C1C",
    fontSize: "14px",
  },

  headerRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "20px",
  },

  createButton: {
    padding: "10px 16px",
    borderRadius: "6px",
    border: "none",
    backgroundColor: "#2B78F6",
    color: "#fff",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: 600,
  },

  filters: {
    display: "flex",
    alignItems: "flex-end",
    gap: "16px",
    flexWrap: "wrap",
  },

  filterLabel: {
    fontSize: "14px",
    fontWeight: 600,
    color: "#475569",
  },

  select: {
    height: "38px",
    padding: "0 8px",
    borderRadius: "8px",
    border: "1px solid #CBD5E1",
    backgroundColor: "#FFFFFF",
    fontSize: "14px",
    color: "#334155",
    outline: "none",
  },

  filterGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },

  searchInput: {
    width: "240px",
    height: "38px",
    padding: "0 10px",
    borderRadius: "8px",
    border: "1px solid #CBD5E1",
    backgroundColor: "#FFFFFF",
    fontSize: "14px",
    color: "#334155",
    outline: "none",
    boxSizing: "border-box",
  },

  pagination: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "16px",
    flexWrap: "wrap",
  },

  paginationSummary: {
    fontSize: "14px",
    color: "#64748B",
  },

  paginationControls: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },

  paginationButton: {
    height: "36px",
    padding: "0 14px",
    borderRadius: "6px",
    border: "1px solid #CBD5E1",
    backgroundColor: "#FFFFFF",
    color: "#334155",
    fontSize: "14px",
    fontWeight: 600,
    cursor: "pointer",
  },

  paginationButtonDisabled: {
    opacity: 0.5,
    cursor: "not-allowed",
  },

  pageIndicator: {
    fontSize: "14px",
    fontWeight: 600,
    color: "#475569",
  },
};