import { UserDataInterface } from "../../interfaces/UserDataInterface"
import { globalStyles } from "../../globalStyles";
import { useState } from "react";
import SpecializationsInterface from "../../interfaces/SpecializationInterface";
import { useEffect } from "react";
import { fetchUserById } from "../../api/usersAPI";
import LoadingSpinner from "../LoadingSpinner/LoadingSpinner";
import { fetchAllSpecializations } from "../../api/specializationsAPI";
import { fetchAllRoles } from "../../api/rolesAPI";
import { RoleInterface } from "../../interfaces/rolesInterface";
import { fetchAllOrganizations } from "../../api/organizationsAPI";
import { OrganizationInterface } from "../../interfaces/OrganizationsInterface";
import SearchableDropdownReusable from "../SearchDropdown-Reusable";
import { CountryInterface } from "../../interfaces/CountryInterface";
import { fetchAllCountries } from "../../api/countriesAPI";
import { useUserOptions } from "../../context/UserOptionsContext";


interface SingleUserViewProps {
    user: UserDataInterface;
    setIsSingleUserViewOpen: (isOpen: boolean) => void;
    viewMode: 'view' | 'edit';
    setViewMode: (mode: 'view' | 'edit') => void;
}



const SingleUserView = ({ user, setIsSingleUserViewOpen, viewMode, setViewMode}: SingleUserViewProps) => {


    const [loading, setLoading] = useState<boolean>(true);
    const [singleUserData, setSingleUserData] = useState<UserDataInterface | null>(null);
    const [roles, setRoles] = useState<RoleInterface[]>([]);
    const [countries, setCountries] = useState<CountryInterface[]>([]);
    const { roles: userRoles, countries: userCountries } = useUserOptions();

    const [formState, setFormState] = useState({
        first_name: '',
        last_name: '',
        email: '',
        specializations: [] as SpecializationsInterface[],
        role: '',
        country: '',
        city: '',
        organization: '',
    });

    const [specializations, setSpecializations] = useState<SpecializationsInterface[]>([]);
    const [organizations, setOrganizations] = useState<OrganizationInterface[]>([]);


    useEffect(() => {
        const fetchData = async () => {
            try {
                console.log(`roles in single user view:`, userRoles);
                setLoading(true);

                const fetchedUser = await fetchUserById(user.id);
                const fetchedSpecializations = await fetchAllSpecializations();
                // const fetchedRoles = await fetchAllRoles();
                const fetchedOrganizations = await fetchAllOrganizations();
                const fetchedCountries = await fetchAllCountries();
                setRoles(userRoles);
                setOrganizations(fetchedOrganizations);
                setCountries(fetchedCountries);
                console.log("Fetched organizations:", fetchedOrganizations);

                setFormState({
                    first_name: fetchedUser.first_name,
                    last_name: fetchedUser.last_name,
                    email: fetchedUser.email,
                    specializations: fetchedUser.specializations,
                    role: fetchedUser.role.name,
                    country: fetchedUser.country.name,
                    city: fetchedUser.city.name,
                    organization: fetchedUser.organization.name,
                });

                setSpecializations(fetchedSpecializations);

                setSingleUserData(fetchedUser);
            } catch (error) {
                console.error("Error fetching user details:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [user.id]);


    if (loading) {
        return <LoadingSpinner />;
    }

    return (
      <div style={styles.container}>
        <div style={styles.header}>
          <h2 style={styles.headerText}>
            {viewMode === "view" ? "User Profile" : "Edit User"}
          </h2>
        </div>
        <div style={styles.content}>
          <form style={styles.form}>
            <div style={styles.formRow}>
              <label style={styles.label}>First Name:</label>
              {viewMode === "view" ? (
                <span>{formState.first_name}</span>
              ) : (
                <input
                type="text"
                style={globalStyles.input}
                value={formState.first_name}
                onChange={(e) =>
                  setFormState({ ...formState, first_name: e.target.value })
                }
              />
            )}
          </div>

            <div style={styles.formRow}>
              <label style={styles.label}>Last Name:</label>
              {viewMode === "view" ? (
                <span>{formState.last_name}</span>
              ) : (
                <input
                  type="text"
                  style={globalStyles.input}
                  value={formState.last_name}
                  onChange={(e) =>
                    setFormState({ ...formState, last_name: e.target.value })
                  }
                />
              )}
            </div>
            <div style={styles.formRow}>
              <label style={styles.label}>Email:</label>
              {viewMode === "view" ? (
                <span>{formState.email}</span>
              ) : (
                <input
                  type="email"
                  style={globalStyles.input}
                  value={formState.email}
                  onChange={(e) =>
                    setFormState({ ...formState, email: e.target.value })
                  }
                />
              )}
            </div>
            <div style={styles.formRow}>
              <label style={styles.label}>Email:</label>
              {viewMode === "view" ? (
                <span>{formState.email}</span>
              ) : (
                <input
                  type="email"
                  style={globalStyles.input}
                  value={formState.email}
                  onChange={(e) =>
                    setFormState({ ...formState, email: e.target.value })
                  }
                />
              )}
            </div>
            <div style={styles.formRow}>
              {/* <div>
                            {formState?.specializations?.map((spec, index) => (
                                <p key={`spec_${index}`} style={{ marginRight: '10px' }}>
                                    {spec.name}
                                </p>
                            ))}
                        </div> */}
              {singleUserData?.specializations && viewMode === "edit" && (
                <select
                  multiple
                  value={specializations.map((spec) => spec.name.toString())}
                  onChange={(e) => {
                    const selectedIds = Array.from(
                      e.target.selectedOptions,
                      (option) => parseInt(option.value)
                    );

                    // Filter all dummySpecializations that are selected
                    const selectedSpecializations = specializations.filter(
                      (spec) => selectedIds.includes(spec.id)
                    );

                    setFormState({
                      ...formState,
                      specializations: selectedSpecializations,
                    });
                  }}
                >
                  {specializations.map((spec) => (
                    <option key={`spec_option_${spec.id}`} value={spec.id}>
                      {spec.name}
                    </option>
                  ))}
                </select>
              )}
            </div>
            <p>
              Specializations:{" "}
              {(singleUserData?.specializations ?? []).length > 0
                ? singleUserData?.specializations
                    ?.map((spec) => spec.name)
                    .join(", ")
                : "None"}
            </p>
            {viewMode === "view" && (
              <div style={styles.formRow}>
                <label style={styles.label}>Role:</label>
                {viewMode === "view" ? (
                  <span>{formState.role}</span>
                ) : (
                  <input
                    type="text"
                    
                    value={formState.role}
                    onChange={(e) =>
                      setFormState({ ...formState, role: e.target.value })
                    }
                  />
                )}
              </div>
            )}
            {viewMode === "edit" && (
              <>
                <div style={styles.formRow}>
                  <label style={styles.label}>Role:</label>
                  <select
                    style={globalStyles.input}
                    value={formState.role}
                    onChange={(e) =>
                    setFormState({
                      ...formState,
                      role: e.target.value,
                    })
                  }
                >
                  <option value="">Select a role</option>
                  {roles.map((role) => (
                    <option key={`role_${role.id}`} value={role.id}>
                      {role.name}
                    </option>
                  ))}
                </select>
                </div>
              </>
            )}
            <div style={styles.formRow}>
              <label style={styles.label}>Country:</label>
              {viewMode === "view" ? (
                <span>{formState.country}</span>
              ) : (
                // <input
                //   type="text"
                //   value={formState.country}
                //   onChange={(e) =>
                //     setFormState({ ...formState, country: e.target.value })
                //   }
                // />
                <SearchableDropdownReusable
                  options={countries}
                  placeholder="Select a country"
                  value={formState.country}
                  onChange={(value) =>
                    setFormState({ ...formState, country: value })
                  }
                />
              )}
            </div>
            <div style={styles.formRow}>
              <label style={styles.label}>City:</label>
              {viewMode === "view" ? (
                <span>{formState.city}</span>
              ) : (
                <input
                  type="text"
                  style={globalStyles.input}
                  value={formState.city}
                  onChange={(e) =>
                    setFormState({ ...formState, city: e.target.value })
                  }
                />
              )}
            </div>
            <div style={styles.formRow}>
              <label style={styles.label}>Organization:</label>
              {viewMode === "view" ? (
                <span>{singleUserData?.organization?.name}</span>
              ) : (
                <select
                  style={globalStyles.input}
                  value={formState.organization}
                  onChange={(e) =>
                    setFormState({
                      ...formState,
                      organization: e.target.value,
                    })
                  }
                >
                  <option value="">Select an organization</option>
                  {organizations.map((org) => (
                    <option key={`org_${org.id}`} value={org.id}>
                      {org.name}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </form>
          <div style={styles.quizScores}></div>
        </div>
        <div>
          <button
            style={{ ...styles.button, backgroundColor: globalStyles.colors.error }}
            onClick={() => setIsSingleUserViewOpen(false)}
          >
            Close
          </button>
          {viewMode === "view" && (
            <button onClick={() => setViewMode("edit")} style={styles.button}>
              Edit
            </button>
          )}
          {viewMode === "edit" && (
            <button style={styles.button}>Save Changes</button>
          )}
        </div>
      </div>
    );
}
export default SingleUserView;

const styles: { [key: string]: React.CSSProperties } = {
    container: {
        position: 'absolute',
        backgroundColor: globalStyles.colors.singleUserViewBackground,
        width: '95%',
        height: '90%',
        display: 'flex',
        flexDirection: 'column' as const,
        left: '50%',
        top: '50%',
        transform: 'translate(-50%, -50%)'
    },
    header: {
        backgroundColor: globalStyles.colors.singleUserViewHeader,
        paddingInline: '30px',
        textAlign: 'left' as const,
        width: '100%',
        height: '89px',
        top: '0',
        position: 'relative' as const,
        display: 'flex',
        alignItems: 'center' as const,
    },
    headerText: {
        fontSize: '40px',
        margin: 0,
    },
    content: {
        padding: '20px',
        display: 'flex',
        flexDirection: 'row' as const,
        overflowY: 'auto',
        width: '100%',
        backgroundColor: globalStyles.colors.singleUserViewBackground,
    },
    form: {
        display: 'flex',
        flexDirection: 'column' as const,
        gap: '10px',
        padding: '20px',
    },
    button: {
        backgroundColor: globalStyles.colors.headerColor,
        color: globalStyles.colors.whiteTheme,
        padding: '10px 20px',
        border: 'none',
        cursor: 'pointer',
        margin: '10px',
        alignSelf: 'center' as const,
    },
    quizScores: {
        padding: '20px',
        // backgroundColor: 'green',
        border: '1px solid #ccc',
        borderRadius: '5px',
        marginTop: '20px',
        flex: 1,

    },
    formRow: {
        display: 'flex',
        flexDirection: 'row' as const,
        alignItems: 'center' as const,
        gap: '10px',
        marginBottom: '10px',
    },
    label: {
        fontSize: '16px',
        maxWidth: '300px',
        width: '150px',
    }
}
