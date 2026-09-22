import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  AdminOrganization,
  OrganizationSortDirection,
  OrganizationSortField,
  createOrganization,
  deleteOrganization,
  fetchPaginatedAdminOrganizations,
  updateOrganization,
} from "../api/organizationsAPI";
import { fetchAllCountries } from "../api/countriesAPI";
import { CountryInterface } from "../interfaces/CountryInterface";
import {
  AdminPermission,
  createOrganizationAdminPermission,
  deleteOrganizationAdminPermission,
  fetchAdminPermissionsByOrganization,
} from "../api/adminPermissionsAPI";
import {
  AdminUser,
  fetchAdminUsers,
} from "../api/usersAPI";

export default function OrganizationsPage() {
  const [organizations, setOrganizations] = useState<
    AdminOrganization[]
  >([]);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalOrganizations, setTotalOrganizations] =
    useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const pageLimit = 25;

  const [sortBy, setSortBy] =
    useState<OrganizationSortField>("name");

  const [sortDirection, setSortDirection] =
    useState<OrganizationSortDirection>("asc");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] =
    useState<string | null>(null);
  const [
    organizationPendingDelete,
    setOrganizationPendingDelete,
  ] = useState<AdminOrganization | null>(null);
  const [searchFilter, setSearchFilter] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [organizationName, setOrganizationName] = useState("");
  const [countries, setCountries] = useState<CountryInterface[]>([]);
  const [selectedCountryIds, setSelectedCountryIds] = useState<number[]>([]);
  const [countrySearch, setCountrySearch] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [editingOrganizationId, setEditingOrganizationId] = useState<number | null>(null);
  const [adminPermissions, setAdminPermissions] = useState<AdminPermission[]>([]);
  const [loadingAdminPermissions, setLoadingAdminPermissions] = useState(false);
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [selectedAdminId, setSelectedAdminId] = useState<number | null>(null);
  const [assigningAdmin, setAssigningAdmin] = useState(false);
  const [adminAssignmentError, setAdminAssignmentError] = useState<string | null>(null);
  const [removingAdminPermissionId, setRemovingAdminPermissionId] =
    useState<number | null>(null);

  const loadOrganizations = useCallback(
    async () => {
      try {
        setLoading(true);
        setError(null);

        const organizationData =
          await fetchPaginatedAdminOrganizations({
            page: currentPage,
            limit: pageLimit,
            query: searchFilter,
            sortBy,
            sortDirection,
          });

        setOrganizations(
          organizationData.organizations
        );

        setCurrentPage(
          organizationData.pagination.page
        );

        setTotalOrganizations(
          organizationData.pagination.total
        );

        setTotalPages(
          organizationData.pagination.totalPages
        );
      } catch (err) {
        console.error(
          "Failed to load organizations:",
          err
        );

        setError(
          err instanceof Error
            ? err.message
            : "Failed to load organizations."
        );
      } finally {
        setLoading(false);
      }
    },
    [
      currentPage,
      searchFilter,
      sortBy,
      sortDirection,
    ]
  );

  useEffect(() => {
    const loadPageData = async () => {
      try {
        const [
          countryData,
          adminUserData,
        ] = await Promise.all([
          fetchAllCountries(),
          fetchAdminUsers(),
        ]);

        setCountries(countryData);
        setAdminUsers(adminUserData);
      } catch (err) {
        console.error(
          "Failed to load organization page data:",
          err
        );

        setError(
          err instanceof Error
            ? err.message
            : "Failed to load organization page data."
        );
      }
    };

    loadPageData();
  }, []);

  useEffect(() => {
    loadOrganizations();
  }, [loadOrganizations]);

  // const filteredOrganizations = useMemo(() => {
  //   const search = searchFilter.trim().toLowerCase();

  //   if (!search) {
  //     return organizations;
  //   }

  //   return organizations.filter((organization) =>
  //     organization.name.toLowerCase().includes(search)
  //   );
  // }, [organizations, searchFilter]);

  const availableAdminUsers = useMemo(() => {
    const assignedAdminIds = new Set(
      adminPermissions.map((permission) => permission.admin_id)
    );

    return adminUsers.filter(
      (admin) => !assignedAdminIds.has(admin.id)
    );
  }, [adminUsers, adminPermissions]);

  const filteredCountries = useMemo(() => {
    const search = countrySearch.trim().toLowerCase();

    if (!search) {
      return countries;
    }

    return countries.filter((country) =>
      country.name.toLowerCase().includes(search)
    );
  }, [countries, countrySearch]);

  const handleCreateOrganization = async () => {
    const trimmedName = organizationName.trim();

    if (!trimmedName) {
      setCreateError("Organization name is required.");
      return;
    }

    try {
      setCreating(true);
      setCreateError(null);

      await createOrganization({
        name: trimmedName,
        country_ids: selectedCountryIds,
      });

      setSuccessMessage(
        `"${trimmedName}" was created successfully.`
      );

      window.setTimeout(() => {
        setSuccessMessage(null);
      }, 5000);

      await loadOrganizations();

      setOrganizationName("");
      setSelectedCountryIds([]);
      setCountrySearch("");
      setShowCreateForm(false);
    } catch (err) {
      console.error("Failed to create organization:", err);

      setCreateError(
        err instanceof Error
          ? err.message
          : "Failed to create organization."
      );
    } finally {
      setCreating(false);
    }
  };

  const handleAssignAdmin = async () => {
    if (
      editingOrganizationId === null ||
      selectedAdminId === null
    ) {
      return;
    }

    try {
      setAssigningAdmin(true);
      setAdminAssignmentError(null);

      await createOrganizationAdminPermission({
        adminId: selectedAdminId,
        organizationId: editingOrganizationId,
      });

      const permissions =
        await fetchAdminPermissionsByOrganization(
          editingOrganizationId
        );

      setAdminPermissions(permissions);
      setSelectedAdminId(null);
    } catch (err) {
      console.error(
        "Failed to assign admin to organization:",
        err
      );

      setAdminAssignmentError(
        err instanceof Error
          ? err.message
          : "Failed to assign admin to organization."
      );
    } finally {
      setAssigningAdmin(false);
    }
  };

  const handleRemoveAdmin = async (
    permissionId: number
  ) => {
    try {
      setRemovingAdminPermissionId(permissionId);
      setAdminAssignmentError(null);

      await deleteOrganizationAdminPermission(
        permissionId
      );

      setAdminPermissions((current) =>
        current.filter(
          (permission) => permission.id !== permissionId
        )
      );
    } catch (err) {
      console.error(
        "Failed to remove admin from organization:",
        err
      );

      setAdminAssignmentError(
        err instanceof Error
          ? err.message
          : "Failed to remove admin from organization."
      );
    } finally {
      setRemovingAdminPermissionId(null);
    }
  };

  const handleUpdateOrganization = async () => {
    if (editingOrganizationId === null) {
      return;
    }

    const trimmedName = organizationName.trim();

    if (!trimmedName) {
      setUpdateError("Organization name is required.");
      return;
    }

    try {
      setUpdating(true);
      setUpdateError(null);

      await updateOrganization(
        editingOrganizationId,
        {
          name: trimmedName,
          country_ids: selectedCountryIds,
        }
      );

      setSuccessMessage(
        `"${trimmedName}" was updated successfully.`
      );

      window.setTimeout(() => {
        setSuccessMessage(null);
      }, 5000);

      await loadOrganizations();

      setEditingOrganizationId(null);
      setOrganizationName("");
      setSelectedCountryIds([]);
      setCountrySearch("");
    } catch (err) {
      console.error("Failed to update organization:", err);

      setUpdateError(
        err instanceof Error
          ? err.message
          : "Failed to update organization."
      );
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteOrganization = async () => {
    if (!organizationPendingDelete) {
      return;
    }

    try {
      setError(null);

      const organizationName =
        organizationPendingDelete.name;

      await deleteOrganization(
        organizationPendingDelete.id
      );

      setOrganizationPendingDelete(null);

      setSuccessMessage(
        `"${organizationName}" was deleted successfully.`
      );

      window.setTimeout(() => {
        setSuccessMessage(null);
      }, 5000);

      await loadOrganizations();
    } catch (err) {
      console.error(
        "Failed to delete organization:",
        err
      );

      setOrganizationPendingDelete(null);

      setError(
        err instanceof Error
          ? err.message
          : "Failed to delete organization."
      );

      window.setTimeout(() => {
        setError(null);
      }, 5000);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.headerRow}>
        <div>
          <h1 style={styles.heading}>Organizations</h1>

          <p style={styles.subheading}>
            Manage organizations and administrative access.
          </p>
        </div>

        <button
          type="button"
          style={styles.createButton}
          onClick={() => setShowCreateForm(true)}
        >
          + Create Organization
        </button>
      </div>

      {showCreateForm && (
        <div style={styles.formCard}>
          <div style={styles.formHeader}>
            <h2 style={styles.formHeading}>
              Create Organization
            </h2>

            <button
              type="button"
              style={styles.cancelButton}
              onClick={() => {
                setOrganizationName("");
                setSelectedCountryIds([]);
                setCountrySearch("");
                setShowCreateForm(false);
              }}
            >
              Cancel
            </button>
          </div>

          <div style={styles.formGroup}>
            <label style={styles.filterLabel}>
              Organization Name
            </label>

            <input
              type="text"
              value={organizationName}
              onChange={(event) =>
                setOrganizationName(event.target.value)
              }
              placeholder="Enter organization name..."
              style={styles.formInput}
            />
          </div>
          <div style={styles.countrySection}>
            <label style={styles.filterLabel}>
              Countries
            </label>

            <input
              type="text"
              value={countrySearch}
              onChange={(event) =>
                setCountrySearch(event.target.value)
              }
              placeholder="Search countries..."
              style={styles.formInput}
            />

            <div style={styles.countryList}>
              {filteredCountries.map((country) => (
                <label
                  key={country.id}
                  style={styles.countryOption}
                >
                  <input
                    type="checkbox"
                    checked={selectedCountryIds.includes(country.id)}
                    onChange={() => {
                      setSelectedCountryIds((current) =>
                        current.includes(country.id)
                          ? current.filter((id) => id !== country.id)
                          : [...current, country.id]
                      );
                    }}
                  />

                  <span>{country.name}</span>
                </label>
              ))}
            </div>
          </div>
          {createError && (
            <div style={styles.createError}>
              {createError}
            </div>
          )}
          <div style={styles.formActions}>
            <button
              type="button"
              style={styles.submitButton}
              onClick={handleCreateOrganization}
              disabled={creating}
            >
              {creating ? "Creating..." : "Create Organization"}
            </button>
          </div>
        </div>
      )}

      {editingOrganizationId !== null && (
        <div style={styles.formCard}>
          <div style={styles.formHeader}>
            <h2 style={styles.formHeading}>
              Edit Organization
            </h2>

            <button
              type="button"
              style={styles.cancelButton}
              onClick={() => {
                setEditingOrganizationId(null);
                setOrganizationName("");
                setSelectedCountryIds([]);
                setCountrySearch("");
                setUpdateError(null);
              }}
            >
              Cancel
            </button>
          </div>

          <div style={styles.formGroup}>
            <label style={styles.filterLabel}>
              Organization Name
            </label>

            <input
              type="text"
              value={organizationName}
              onChange={(event) =>
                setOrganizationName(event.target.value)
              }
              style={styles.formInput}
            />
          </div>
          <div style={styles.countrySection}>
            <label style={styles.filterLabel}>
              Countries
            </label>

            <input
              type="text"
              value={countrySearch}
              onChange={(event) =>
                setCountrySearch(event.target.value)
              }
              placeholder="Search countries..."
              style={styles.formInput}
            />

            <div style={styles.countryList}>
              {filteredCountries.map((country) => (
                <label
                  key={country.id}
                  style={styles.countryOption}
                >
                  <input
                    type="checkbox"
                    checked={selectedCountryIds.includes(country.id)}
                    onChange={() => {
                      setSelectedCountryIds((current) =>
                        current.includes(country.id)
                          ? current.filter((id) => id !== country.id)
                          : [...current, country.id]
                      );
                    }}
                  />

                  <span>{country.name}</span>
                </label>
              ))}
            </div>
          </div>

          {updateError && (
            <div style={styles.createError}>
              {updateError}
            </div>
          )}

          <div style={styles.adminSection}>
            <label style={styles.filterLabel}>
              Assigned Admins
            </label>

            {loadingAdminPermissions ? (
              <div style={styles.adminMessage}>
                Loading assigned admins...
              </div>
            ) : adminPermissions.length === 0 ? (
              <div style={styles.adminMessage}>
                No admins assigned.
              </div>
            ) : (
              <div style={styles.adminList}>
                {adminPermissions.map((permission) => (
                  <div
                    key={permission.id}
                    style={styles.adminRow}
                  >
                    <span>
                      {permission.admin.first_name}{" "}
                      {permission.admin.last_name}
                    </span>

                    <button
                      type="button"
                      style={styles.removeAdminButton}
                      onClick={() =>
                        handleRemoveAdmin(permission.id)
                      }
                      disabled={
                        removingAdminPermissionId === permission.id
                      }
                    >
                      {removingAdminPermissionId === permission.id
                        ? "Removing..."
                        : "Remove"}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={styles.adminSection}>
            <label style={styles.filterLabel}>
              Assign Admin
            </label>

            <select
              value={selectedAdminId ?? ""}
              onChange={(event) =>
                setSelectedAdminId(
                  event.target.value
                    ? Number(event.target.value)
                    : null
                )
              }
              style={styles.formInput}
            >
              <option value="">
                Select an admin...
              </option>

              {availableAdminUsers.map((admin) => (
                <option
                  key={admin.id}
                  value={admin.id}
                >
                  {admin.first_name} {admin.last_name} ({admin.email})
                </option>
              ))}
            </select>
            <button
              type="button"
              style={styles.assignButton}
              onClick={handleAssignAdmin}
              disabled={
                selectedAdminId === null ||
                assigningAdmin
              }
            >
              {assigningAdmin ? "Assigning..." : "Assign Admin"}
            </button>

            {adminAssignmentError && (
              <div style={styles.createError}>
                {adminAssignmentError}
              </div>
            )}
          </div>

          <div style={styles.formActions}>
            <button
              type="button"
              style={styles.submitButton}
              onClick={handleUpdateOrganization}
              disabled={updating}
            >
              {updating ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>
      )}

      {error && (
        <div style={styles.error}>
          {error}
        </div>
      )}

      {successMessage && (
        <div style={styles.success}>
          {successMessage}
        </div>
      )}

      <div style={styles.filters}>
        <div style={styles.filterGroup}>
          <label style={styles.filterLabel}>
            Search Organization
          </label>

          <input
            type="text"
            value={searchFilter}
            onChange={(event) => {
              setSearchFilter(event.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search organizations..."
            style={styles.searchInput}
          />
        </div>
      </div>

      <div style={styles.tableWrapper}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.tableHeader}>
                <button
                  type="button"
                  style={styles.sortButton}
                  onClick={() => {
                    setCurrentPage(1);

                    if (sortBy === "name") {
                      setSortDirection((current) =>
                        current === "asc" ? "desc" : "asc"
                      );
                    } else {
                      setSortBy("name");
                      setSortDirection("asc");
                    }
                  }}
                >
                  Organization
                  {sortBy === "name" && (
                    <span style={styles.sortIndicator}>
                      {sortDirection === "asc" ? "▲" : "▼"}
                    </span>
                  )}
                </button>
              </th>

              <th style={styles.tableHeader}>
                <button
                  type="button"
                  style={styles.sortButton}
                  onClick={() => {
                    setCurrentPage(1);

                    if (sortBy === "userCount") {
                      setSortDirection((current) =>
                        current === "asc" ? "desc" : "asc"
                      );
                    } else {
                      setSortBy("userCount");
                      setSortDirection("desc");
                    }
                  }}
                >
                  Users
                  {sortBy === "userCount" && (
                    <span style={styles.sortIndicator}>
                      {sortDirection === "asc" ? "▲" : "▼"}
                    </span>
                  )}
                </button>
              </th>

              <th style={styles.tableHeader}>
                Countries
              </th>

              <th style={styles.tableHeader}>
                Actions
              </th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td
                  colSpan={4}
                  style={styles.messageCell}
                >
                  Loading organizations...
                </td>
              </tr>
            ) : organizations.length === 0 ? (
              <tr>
                <td
                  colSpan={4}
                  style={styles.messageCell}
                >
                  No organizations found.
                </td>
              </tr>
            ) : (
              organizations.map((organization) => (
                <tr key={organization.id}>
                  <td style={styles.tableCell}>
                    {organization.name}
                  </td>

                  <td style={styles.tableCell}>
                    {organization.userCount}
                  </td>

                  <td style={styles.tableCell}>
                    {organization.countries.length === 0
                      ? "—"
                      : organization.countries.length <= 3
                      ? organization.countries
                          .map((country) => country.name)
                          .join(", ")
                      : `${organization.countries
                          .slice(0, 3)
                          .map((country) => country.name)
                          .join(", ")} +${organization.countries.length - 3} more`}
                  </td>

                  <td
                    style={{
                      ...styles.tableCell,
                      ...styles.actionCell,
                    }}
                  >
                    <button
                      type="button"
                      style={styles.editButton}
                      onClick={async () => {
                        setEditingOrganizationId(organization.id);
                        setOrganizationName(organization.name);
                        setSelectedCountryIds(
                          organization.countries.map((country) => country.id)
                        );
                        setCountrySearch("");
                        setCreateError(null);
                        setUpdateError(null);
                        setShowCreateForm(false);

                        try {
                          setLoadingAdminPermissions(true);

                          const permissions =
                            await fetchAdminPermissionsByOrganization(
                              organization.id
                            );

                          setAdminPermissions(permissions);
                        } catch (err) {
                          console.error(
                            "Failed to load organization admin permissions:",
                            err
                          );

                          setAdminPermissions([]);
                        } finally {
                          setLoadingAdminPermissions(false);
                        }
                      }}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      style={styles.deleteButton}
                      onClick={() => {
                        setOrganizationPendingDelete(
                          organization
                        );
                      }}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <div style={styles.paginationRow}>
        <div style={styles.paginationInfo}>
          {totalOrganizations === 0
            ? "0 organizations"
            : `Page ${currentPage} of ${totalPages} · ${totalOrganizations} organizations`}
        </div>

        <div style={styles.paginationButtons}>
          <button
            type="button"
            style={styles.paginationButton}
            onClick={() =>
              setCurrentPage((current) =>
                Math.max(1, current - 1)
              )
            }
            disabled={
              currentPage <= 1 || loading
            }
          >
            Previous
          </button>

          <button
            type="button"
            style={styles.paginationButton}
            onClick={() =>
              setCurrentPage((current) =>
                Math.min(
                  totalPages,
                  current + 1
                )
              )
            }
            disabled={
              currentPage >= totalPages ||
              loading ||
              totalPages === 0
            }
          >
            Next
          </button>
        </div>
      </div>
      {organizationPendingDelete && (
        <div style={styles.modalOverlay}>
          <div style={styles.deleteModal}>
            <h3 style={styles.deleteModalTitle}>
              Delete Organization
            </h3>

            <p style={styles.deleteModalText}>
              Are you sure you want to delete{" "}
              <strong>
                {organizationPendingDelete.name}
              </strong>
              ?
            </p>

            <p style={styles.deleteModalWarning}>
              The organization can only be deleted if it
              has no users, classes, assigned admins, or
              exam associations.
            </p>

            <div style={styles.deleteModalActions}>
              <button
                type="button"
                style={styles.cancelButton}
                onClick={() =>
                  setOrganizationPendingDelete(null)
                }
              >
                Cancel
              </button>

              <button
                type="button"
                style={styles.confirmDeleteButton}
                onClick={handleDeleteOrganization}
              >
                Delete Organization
              </button>
            </div>
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

  headerRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "20px",
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

  error: {
    padding: "12px",
    borderRadius: "6px",
    background: "#FEE2E2",
    color: "#B91C1C",
    fontSize: "14px",
  },

  filters: {
    display: "flex",
    alignItems: "flex-end",
    gap: "16px",
    flexWrap: "wrap",
  },

  filterGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },

  filterLabel: {
    fontSize: "14px",
    fontWeight: 600,
    color: "#475569",
  },

  searchInput: {
    width: "280px",
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

  tableWrapper: {
    width: "100%",
    overflowX: "auto",
    border: "1px solid #E2E8F0",
    borderRadius: "8px",
    backgroundColor: "#FFFFFF",
  },

  table: {
    width: "100%",
    borderCollapse: "collapse",
  },

  tableHeader: {
    padding: "12px 16px",
    textAlign: "left",
    fontSize: "13px",
    fontWeight: 700,
    color: "#475569",
    backgroundColor: "#F8FAFC",
    borderBottom: "1px solid #E2E8F0",
  },

  tableCell: {
    padding: "14px 16px",
    fontSize: "14px",
    color: "#334155",
    borderBottom: "1px solid #E2E8F0",
  },

  messageCell: {
    padding: "30px 16px",
    textAlign: "center",
    fontSize: "14px",
    color: "#64748B",
  },

  actionCell: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },

  editButton: {
    padding: "6px 12px",
    borderRadius: "6px",
    border: "1px solid #CBD5E1",
    backgroundColor: "#FFFFFF",
    color: "#334155",
    cursor: "pointer",
    fontSize: "13px",
    fontWeight: 600,
  },

  formCard: {
    padding: "20px",
    border: "1px solid #E2E8F0",
    borderRadius: "8px",
    backgroundColor: "#FFFFFF",
  },

  formHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "16px",
    marginBottom: "20px",
  },

  formHeading: {
    margin: 0,
    fontSize: "20px",
    fontWeight: 700,
  },

  formGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
    maxWidth: "400px",
  },

  formInput: {
    width: "100%",
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

  cancelButton: {
    padding: "7px 12px",
    borderRadius: "6px",
    border: "1px solid #CBD5E1",
    backgroundColor: "#FFFFFF",
    color: "#334155",
    cursor: "pointer",
    fontSize: "13px",
    fontWeight: 600,
  },

  countrySection: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    maxWidth: "400px",
    marginTop: "18px",
  },

  countryList: {
    maxHeight: "220px",
    overflowY: "auto",
    border: "1px solid #CBD5E1",
    borderRadius: "8px",
    backgroundColor: "#FFFFFF",
    padding: "6px",
  },

  countryOption: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "7px 8px",
    cursor: "pointer",
    fontSize: "14px",
    color: "#334155",
  },

  formActions: {
    display: "flex",
    marginTop: "20px",
  },

  submitButton: {
    padding: "10px 16px",
    borderRadius: "6px",
    border: "none",
    backgroundColor: "#2B78F6",
    color: "#FFFFFF",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: 600,
  },

  createError: {
    marginTop: "14px",
    padding: "10px 12px",
    maxWidth: "400px",
    borderRadius: "6px",
    backgroundColor: "#FEE2E2",
    color: "#B91C1C",
    fontSize: "14px",
  },

  adminSection: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    maxWidth: "400px",
    marginTop: "18px",
  },

  adminList: {
    border: "1px solid #CBD5E1",
    borderRadius: "8px",
    backgroundColor: "#FFFFFF",
    overflow: "hidden",
  },

  adminRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "12px",
    padding: "10px 12px",
    fontSize: "14px",
    color: "#334155",
    borderBottom: "1px solid #E2E8F0",
  },

  removeAdminButton: {
    padding: "5px 10px",
    borderRadius: "6px",
    border: "1px solid #FCA5A5",
    backgroundColor: "#FFFFFF",
    color: "#B91C1C",
    cursor: "pointer",
    fontSize: "12px",
    fontWeight: 600,
  },

  adminMessage: {
    padding: "10px 12px",
    border: "1px solid #E2E8F0",
    borderRadius: "8px",
    fontSize: "14px",
    color: "#64748B",
  },

  assignButton: {
    alignSelf: "flex-start",
    padding: "8px 14px",
    borderRadius: "6px",
    border: "none",
    backgroundColor: "#2B78F6",
    color: "#FFFFFF",
    cursor: "pointer",
    fontSize: "13px",
    fontWeight: 600,
  },

  paginationRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "16px",
    flexWrap: "wrap",
  },

  paginationInfo: {
    fontSize: "14px",
    color: "#64748B",
  },

  paginationButtons: {
    display: "flex",
    gap: "8px",
  },

  paginationButton: {
    padding: "7px 12px",
    borderRadius: "6px",
    border: "1px solid #CBD5E1",
    backgroundColor: "#FFFFFF",
    color: "#334155",
    cursor: "pointer",
    fontSize: "13px",
    fontWeight: 600,
  },

  sortButton: {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    padding: 0,
    border: "none",
    background: "transparent",
    color: "#475569",
    fontSize: "13px",
    fontWeight: 700,
    cursor: "pointer",
  },

  sortIndicator: {
    fontSize: "10px",
  },

  success: {
    padding: "12px",
    borderRadius: "6px",
    background: "#DCFCE7",
    color: "#166534",
    fontSize: "14px",
  },

  deleteButton: {
    padding: "6px 10px",
    borderRadius: "6px",
    border: "1px solid #FCA5A5",
    backgroundColor: "#FFFFFF",
    color: "#B91C1C",
    cursor: "pointer",
    fontSize: "13px",
    fontWeight: 600,
  },

  modalOverlay: {
    position: "fixed",
    inset: 0,
    backgroundColor: "rgba(15, 23, 42, 0.45)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
  },

  deleteModal: {
    width: "100%",
    maxWidth: "440px",
    backgroundColor: "#FFFFFF",
    borderRadius: "10px",
    padding: "24px",
    boxShadow:
      "0 20px 40px rgba(15, 23, 42, 0.20)",
  },

  deleteModalTitle: {
    margin: "0 0 12px",
    fontSize: "20px",
    color: "#0F172A",
  },

  deleteModalText: {
    margin: "0 0 12px",
    fontSize: "14px",
    color: "#334155",
    lineHeight: 1.5,
  },

  deleteModalWarning: {
    margin: "0 0 20px",
    fontSize: "13px",
    color: "#64748B",
    lineHeight: 1.5,
  },

  deleteModalActions: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "8px",
  },

  confirmDeleteButton: {
    padding: "8px 12px",
    borderRadius: "6px",
    border: "1px solid #B91C1C",
    backgroundColor: "#B91C1C",
    color: "#FFFFFF",
    cursor: "pointer",
    fontSize: "13px",
    fontWeight: 600,
  },
};