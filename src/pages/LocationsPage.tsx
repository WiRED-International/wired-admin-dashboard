import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  AdminLocation,
  LocationSortField,
  LocationType,
  SortDirection,
  createAdminLocation,
  deleteAdminLocation,
  fetchAdminLocations,
  fetchPaginatedAdminLocations,
  updateAdminLocation,
} from "../api/locationsAPI";
import { fetchAllCountries } from "../api/countriesAPI";
import { CountryInterface } from "../interfaces/CountryInterface";

export default function LocationsPage() {
  const [locations, setLocations] = useState<
    AdminLocation[]
  >([]);

  const [tableLocations, setTableLocations] = useState<
    AdminLocation[]
  >([]);

  const [currentPage, setCurrentPage] =
    useState(1);

  const [totalLocations, setTotalLocations] =
    useState(0);

  const [totalPages, setTotalPages] =
    useState(1);

  const pageLimit = 25;

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState<string | null>(
    null
  );

  const [successMessage, setSuccessMessage] =
    useState<string | null>(null);

  const [searchFilter, setSearchFilter] =
    useState("");
  
  const [countryFilter, setCountryFilter] =
    useState<number | null>(null);

  const [locationTypeFilter, setLocationTypeFilter] =
    useState<LocationType | null>(null);

  const [sortBy, setSortBy] =
    useState<LocationSortField>("name");

  const [sortDirection, setSortDirection] =
    useState<SortDirection>("asc");

  const [countries, setCountries] =
    useState<CountryInterface[]>([]);

  const [showCreateForm, setShowCreateForm] =
    useState(false);

  const [locationName, setLocationName] =
    useState("");

  const [selectedCountryId, setSelectedCountryId] =
    useState<number | null>(null);

  const [selectedLocationType, setSelectedLocationType] =
    useState<LocationType>("county");

  const [selectedParentLocationId, setSelectedParentLocationId] =
    useState<number | null>(null);

  const [creating, setCreating] =
    useState(false);

  const [createError, setCreateError] =
    useState<string | null>(null);

  const [editingLocationId, setEditingLocationId] =
    useState<number | null>(null);

  const [updating, setUpdating] =
    useState(false);

  const [updateError, setUpdateError] =
    useState<string | null>(null);  

  const [
    locationPendingDelete,
    setLocationPendingDelete,
  ] = useState<AdminLocation | null>(null);

  const loadTableLocations = useCallback(
    async () => {
      const tableData =
        await fetchPaginatedAdminLocations({
          page: currentPage,
          limit: pageLimit,
          query: searchFilter,
          countryId:
            countryFilter ?? undefined,
          locationType:
            locationTypeFilter ?? undefined,
          sortBy,
          sortDirection,
        });

      setTableLocations(tableData.locations);
      setCurrentPage(tableData.pagination.page);
      setTotalLocations(tableData.pagination.total);
      setTotalPages(
        tableData.pagination.totalPages
      );
    },
    [
      currentPage,
      searchFilter,
      countryFilter,
      locationTypeFilter,
      sortBy,
      sortDirection,
    ]
  );

  useEffect(() => {
    const loadLocations = async () => {
      try {
        setLoading(true);
        setError(null);

        const [
          locationData,
          countryData,
        ] = await Promise.all([
          fetchAdminLocations(),
          fetchAllCountries(),
        ]);

        setLocations(locationData);
        setCountries(countryData);

        await loadTableLocations();
      } catch (err) {
        console.error(
          "Failed to load locations:",
          err
        );

        setError(
          err instanceof Error
            ? err.message
            : "Failed to load locations."
        );
      } finally {
        setLoading(false);
      }
    };

    loadLocations();
  }, [loadTableLocations]);

  const availableParentLocations = useMemo(() => {
    if (selectedCountryId === null) {
      return [];
    }

    return locations.filter(
      (location) =>
        location.country_id === selectedCountryId
    );
  }, [
    locations,
    selectedCountryId,
  ]);

  const handleCreateLocation = async () => {
    const trimmedName = locationName.trim();

    if (!trimmedName) {
      setCreateError("Location name is required.");
      return;
    }

    if (selectedCountryId === null) {
      setCreateError("Country is required.");
      return;
    }

    try {
      setCreating(true);
      setCreateError(null);

      await createAdminLocation({
        name: trimmedName,
        country_id: selectedCountryId,
        location_type: selectedLocationType,
        parent_location_id: selectedParentLocationId,
      });

      setError(null);

      setSuccessMessage(
        `"${trimmedName}" was created successfully.`
      );

      window.setTimeout(() => {
        setSuccessMessage(null);
      }, 5000);

      const refreshedLocations =
        await fetchAdminLocations();

      setLocations(refreshedLocations);

      await loadTableLocations();

      setLocationName("");
      setSelectedCountryId(null);
      setSelectedLocationType("county");
      setSelectedParentLocationId(null);
      setShowCreateForm(false);
    } catch (err) {
      console.error(
        "Failed to create location:",
        err
      );

      setCreateError(
        err instanceof Error
          ? err.message
          : "Failed to create location."
      );
    } finally {
      setCreating(false);
    }
  };

  const handleUpdateLocation = async () => {
    if (editingLocationId === null) {
      return;
    }

    const trimmedName = locationName.trim();

    if (!trimmedName) {
      setUpdateError("Location name is required.");
      return;
    }

    if (selectedCountryId === null) {
      setUpdateError("Country is required.");
      return;
    }

    try {
      setUpdating(true);
      setUpdateError(null);

      await updateAdminLocation(
        editingLocationId,
        {
          name: trimmedName,
          country_id: selectedCountryId,
          location_type: selectedLocationType,
          parent_location_id: selectedParentLocationId,
        }
      );

      setError(null);

      setSuccessMessage(
        `"${trimmedName}" was updated successfully.`
      );

      window.setTimeout(() => {
        setSuccessMessage(null);
      }, 5000);

      const refreshedLocations =
        await fetchAdminLocations();

      setLocations(refreshedLocations);

      await loadTableLocations();

      setEditingLocationId(null);
      setLocationName("");
      setSelectedCountryId(null);
      setSelectedLocationType("county");
      setSelectedParentLocationId(null);
    } catch (err) {
      console.error(
        "Failed to update location:",
        err
      );

      setUpdateError(
        err instanceof Error
          ? err.message
          : "Failed to update location."
      );
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteLocation = async (
    location: AdminLocation
  ) => {
    try {
      setError(null);

      await deleteAdminLocation(location.id);

      setSuccessMessage(
        `"${location.name}" was deleted successfully.`
      );

      window.setTimeout(() => {
        setSuccessMessage(null);
      }, 5000);

      const refreshedLocations =
        await fetchAdminLocations();

      setLocations(refreshedLocations);

      await loadTableLocations();
    } catch (err) {
      console.error(
        "Failed to delete location:",
        err
      );

      const errorMessage =
        err instanceof Error
          ? err.message
          : "Failed to delete location.";

      setError(errorMessage);

      window.setTimeout(() => {
        setError(null);
      }, 5000);
    }
  };

  const getParentName = (
    parentLocationId: number | null
  ) => {
    if (parentLocationId === null) {
      return "—";
    }

    return (
      locations.find(
        (location) =>
          location.id === parentLocationId
      )?.name ?? "—"
    );
  };

  const formatLocationType = (
    locationType: string
  ) => {
    if (locationType === "sub_county") {
      return "Sub-County";
    }

    if (locationType === "county") {
      return "County";
    }

    if (locationType === "city") {
      return "City";
    }

    return locationType;
  };

  const handleSort = (
    field: LocationSortField
  ) => {
    if (sortBy === field) {
      setSortDirection((direction) =>
        direction === "asc" ? "desc" : "asc"
      );
    } else {
      setSortBy(field);
      setSortDirection("asc");
    }

    setCurrentPage(1);
  };

  return (
    <div style={styles.container}>
      <div style={styles.headerRow}>
        <div>
          <h1 style={styles.heading}>
            Locations
          </h1>

          <p style={styles.subheading}>
            Manage standardized locations used by
            classes.
          </p>
        </div>

        <button
          type="button"
          style={styles.createButton}
          onClick={() => setShowCreateForm(true)}
        >
          + Create Location
        </button>
      </div>

      {showCreateForm && (
        <div style={styles.formCard}>
          <div style={styles.formHeader}>
            <h2 style={styles.formHeading}>
              Create Location
            </h2>

            <button
              type="button"
              style={styles.cancelButton}
              onClick={() => {
                setLocationName("");
                setSelectedCountryId(null);
                setSelectedLocationType("county");
                setSelectedParentLocationId(null);
                setCreateError(null);
                setShowCreateForm(false);
              }}
            >
              Cancel
            </button>
          </div>

          <div style={styles.formGroup}>
            <label style={styles.filterLabel}>
              Location Name
            </label>

            <input
              type="text"
              value={locationName}
              onChange={(event) =>
                setLocationName(event.target.value)
              }
              placeholder="Enter location name..."
              style={styles.formInput}
            />
          </div>

          <div style={styles.formGroupSpaced}>
            <label style={styles.filterLabel}>
              Country
            </label>

            <select
              value={selectedCountryId ?? ""}
              onChange={(event) => {
                setSelectedCountryId(
                  event.target.value
                    ? Number(event.target.value)
                    : null
                );

                setSelectedParentLocationId(null);
              }}
              style={styles.formInput}
            >
              <option value="">
                Select a country...
              </option>

              {countries.map((country) => (
                <option
                  key={country.id}
                  value={country.id}
                >
                  {country.name}
                </option>
              ))}
            </select>
          </div>

          <div style={styles.formGroupSpaced}>
            <label style={styles.filterLabel}>
              Location Type
            </label>

            <select
              value={selectedLocationType}
              onChange={(event) => {
                setSelectedLocationType(
                  event.target.value as LocationType
                );

                setSelectedParentLocationId(null);
              }}
              style={styles.formInput}
            >
              <option value="county">
                County
              </option>

              <option value="sub_county">
                Sub-County
              </option>

              <option value="city">
                City
              </option>
            </select>
          </div>

          <div style={styles.formGroupSpaced}>
            <label style={styles.filterLabel}>
              Parent Location
            </label>

            <select
              value={selectedParentLocationId ?? ""}
              onChange={(event) =>
                setSelectedParentLocationId(
                  event.target.value
                    ? Number(event.target.value)
                    : null
                )
              }
              style={styles.formInput}
              disabled={selectedCountryId === null}
            >
              <option value="">
                Select a parent location...
              </option>

              {availableParentLocations.map((location) => (
                <option
                  key={location.id}
                  value={location.id}
                >
                  {location.name} (
                  {formatLocationType(
                    location.location_type
                  )}
                  )
                </option>
              ))}
            </select>
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
              onClick={handleCreateLocation}
              disabled={creating}
            >
              {creating
                ? "Creating..."
                : "Create Location"}
            </button>
          </div>
        </div>
      )}

      {editingLocationId !== null && (
        <div style={styles.formCard}>
          <div style={styles.formHeader}>
            <h2 style={styles.formHeading}>
              Edit Location
            </h2>

            <button
              type="button"
              style={styles.cancelButton}
              onClick={() => {
                setEditingLocationId(null);
                setLocationName("");
                setSelectedCountryId(null);
                setSelectedLocationType("county");
                setSelectedParentLocationId(null);
                setUpdateError(null);
              }}
            >
              Cancel
            </button>
          </div>

          <div style={styles.formGroup}>
            <label style={styles.filterLabel}>
              Location Name
            </label>

            <input
              type="text"
              value={locationName}
              onChange={(event) =>
                setLocationName(event.target.value)
              }
              style={styles.formInput}
            />
          </div>

          <div style={styles.formGroupSpaced}>
            <label style={styles.filterLabel}>
              Country
            </label>

            <select
              value={selectedCountryId ?? ""}
              onChange={(event) => {
                setSelectedCountryId(
                  event.target.value
                    ? Number(event.target.value)
                    : null
                );

                setSelectedParentLocationId(null);
              }}
              style={styles.formInput}
            >
              <option value="">
                Select a country...
              </option>

              {countries.map((country) => (
                <option
                  key={country.id}
                  value={country.id}
                >
                  {country.name}
                </option>
              ))}
            </select>
          </div>

          <div style={styles.formGroupSpaced}>
            <label style={styles.filterLabel}>
              Location Type
            </label>

            <select
              value={selectedLocationType}
              onChange={(event) => {
                setSelectedLocationType(
                  event.target.value as LocationType
                );

                setSelectedParentLocationId(null);
              }}
              style={styles.formInput}
            >
              <option value="county">
                County
              </option>

              <option value="sub_county">
                Sub-County
              </option>

              <option value="city">
                City
              </option>
            </select>
          </div>

          <div style={styles.formGroupSpaced}>
            <label style={styles.filterLabel}>
              Parent Location
            </label>

            <select
              value={selectedParentLocationId ?? ""}
              onChange={(event) =>
                setSelectedParentLocationId(
                  event.target.value
                    ? Number(event.target.value)
                    : null
                )
              }
              style={styles.formInput}
              disabled={selectedCountryId === null}
            >
              <option value="">
                Select a parent location...
              </option>

              {availableParentLocations
                .filter(
                  (location) =>
                    location.id !== editingLocationId
                )
                .map((location) => (
                  <option
                    key={location.id}
                    value={location.id}
                  >
                    {location.name} (
                    {formatLocationType(
                      location.location_type
                    )}
                    )
                  </option>
                ))}
            </select>
          </div>

          {updateError && (
            <div style={styles.createError}>
              {updateError}
            </div>
          )}
          <div style={styles.formActions}>
            <button
              type="button"
              style={styles.submitButton}
              onClick={handleUpdateLocation}
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
            Search Location
          </label>

          <input
            type="text"
            value={searchFilter}
            onChange={(event) => {
              setSearchFilter(event.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search locations..."
            style={styles.searchInput}
          />
        </div>
        <div style={styles.filterGroup}>
          <label style={styles.filterLabel}>
            Country
          </label>

          <select
            value={countryFilter ?? ""}
            onChange={(event) => {
              setCountryFilter(
                event.target.value
                  ? Number(event.target.value)
                  : null
              );
              setCurrentPage(1);
            }}
            style={styles.searchInput}
          >
            <option value="">
              All Countries
            </option>

            {countries.map((country) => (
              <option
                key={country.id}
                value={country.id}
              >
                {country.name}
              </option>
            ))}
          </select>
        </div>
        <div style={styles.filterGroup}>
          <label style={styles.filterLabel}>
            Location Type
          </label>

          <select
            value={locationTypeFilter ?? ""}
            onChange={(event) => {
              setLocationTypeFilter(
                event.target.value
                  ? (event.target.value as LocationType)
                  : null
              );
              setCurrentPage(1);
            }}
            style={styles.searchInput}
          >
            <option value="">
              All Types
            </option>

            <option value="county">
              County
            </option>

            <option value="sub_county">
              Sub-County
            </option>

            <option value="city">
              City
            </option>
          </select>
        </div>
      </div>

      <div style={styles.tableWrapper}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th
                style={styles.sortableTableHeader}
                onClick={() => handleSort("name")}
              >
                Location{" "}
                {sortBy === "name" &&
                  (sortDirection === "asc" ? "▲" : "▼")}
              </th>

              <th
                style={styles.sortableTableHeader}
                onClick={() => handleSort("location_type")}
              >
                Type{" "}
                {sortBy === "location_type" &&
                  (sortDirection === "asc" ? "▲" : "▼")}
              </th>

              <th
                style={styles.sortableTableHeader}
                onClick={() => handleSort("country")}
              >
                Country{" "}
                {sortBy === "country" &&
                  (sortDirection === "asc" ? "▲" : "▼")}
              </th>

              <th style={styles.tableHeader}>
                Parent Location
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
                  colSpan={5}
                  style={styles.messageCell}
                >
                  Loading locations...
                </td>
              </tr>
            ) : tableLocations.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  style={styles.messageCell}
                >
                  No locations found.
                </td>
              </tr>
            ) : (
              tableLocations.map((location) => (
                <tr key={location.id}>
                  <td style={styles.tableCell}>
                    {location.name}
                  </td>

                  <td style={styles.tableCell}>
                    {formatLocationType(
                      location.location_type
                    )}
                  </td>

                  <td style={styles.tableCell}>
                    {location.country.name}
                  </td>

                  <td style={styles.tableCell}>
                    {getParentName(
                      location.parent_location_id
                    )}
                  </td>
                  <td style={styles.tableCell}>
                    <div style={styles.actionButtons}>
                      <button
                        type="button"
                        style={styles.editButton}
                        onClick={() => {
                          setEditingLocationId(location.id);
                          setLocationName(location.name);
                          setSelectedCountryId(location.country_id);
                          setSelectedLocationType(
                            location.location_type
                          );
                          setSelectedParentLocationId(
                            location.parent_location_id
                          );

                          setUpdateError(null);
                          setCreateError(null);
                          setShowCreateForm(false);
                        }}
                      >
                        Edit
                      </button>

                      <button
                        type="button"
                        style={styles.deleteButton}
                        onClick={() =>
                          setLocationPendingDelete(location)
                        }
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {locationPendingDelete && (
        <div style={styles.modalOverlay}>
          <div style={styles.confirmDialog}>
            <h2 style={styles.confirmTitle}>
              Delete Location?
            </h2>

            <p style={styles.confirmText}>
              Are you sure you want to delete{" "}
              <strong>
                {locationPendingDelete.name}
              </strong>
              ? This action cannot be undone.
            </p>

            <div style={styles.confirmActions}>
              <button
                type="button"
                style={styles.cancelButton}
                onClick={() =>
                  setLocationPendingDelete(null)
                }
              >
                Cancel
              </button>

              <button
                type="button"
                style={styles.confirmDeleteButton}
                onClick={async () => {
                  const location =
                    locationPendingDelete;

                  setLocationPendingDelete(null);

                  await handleDeleteLocation(
                    location
                  );
                }}
              >
                Delete Location
              </button>
            </div>
          </div>
        </div>
      )}
      <div style={styles.paginationRow}>
        <div style={styles.paginationInfo}>
          {totalLocations === 0
            ? "0 locations"
            : `Page ${currentPage} of ${totalPages} · ${totalLocations} locations`}
        </div>

        <div style={styles.paginationButtons}>
          <button
            type="button"
            style={styles.paginationButton}
            disabled={currentPage <= 1 || loading}
            onClick={() =>
              setCurrentPage((page) =>
                Math.max(1, page - 1)
              )
            }
          >
            Previous
          </button>

          <button
            type="button"
            style={styles.paginationButton}
            disabled={
              currentPage >= totalPages || loading
            }
            onClick={() =>
              setCurrentPage((page) =>
                Math.min(totalPages, page + 1)
              )
            }
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

  error: {
    padding: "12px",
    borderRadius: "6px",
    background: "#FEE2E2",
    color: "#B91C1C",
    fontSize: "14px",
  },

  success: {
    padding: "12px",
    borderRadius: "6px",
    background: "#DCFCE7",
    color: "#166534",
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

  formGroupSpaced: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
    maxWidth: "400px",
    marginTop: "18px",
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

  createError: {
    marginTop: "14px",
    padding: "10px 12px",
    maxWidth: "400px",
    borderRadius: "6px",
    backgroundColor: "#FEE2E2",
    color: "#B91C1C",
    fontSize: "14px",
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

  sortableTableHeader: {
    padding: "12px 16px",
    textAlign: "left",
    fontSize: "13px",
    fontWeight: 700,
    color: "#475569",
    backgroundColor: "#F8FAFC",
    borderBottom: "1px solid #E2E8F0",
    cursor: "pointer",
    userSelect: "none",
  },

  actionButtons: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },

  deleteButton: {
    padding: "6px 12px",
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
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: "rgba(15, 23, 42, 0.45)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "20px",
    zIndex: 1000,
  },

  confirmDialog: {
    width: "100%",
    maxWidth: "440px",
    padding: "24px",
    borderRadius: "10px",
    backgroundColor: "#FFFFFF",
    boxShadow:
      "0 20px 40px rgba(15, 23, 42, 0.20)",
  },

  confirmTitle: {
    margin: 0,
    fontSize: "20px",
    fontWeight: 700,
    color: "#0F172A",
  },

  confirmText: {
    marginTop: "12px",
    marginBottom: 0,
    fontSize: "14px",
    lineHeight: 1.6,
    color: "#475569",
  },

  confirmActions: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "10px",
    marginTop: "24px",
  },

  confirmDeleteButton: {
    padding: "8px 14px",
    borderRadius: "6px",
    border: "none",
    backgroundColor: "#B91C1C",
    color: "#FFFFFF",
    cursor: "pointer",
    fontSize: "13px",
    fontWeight: 600,
  },
};