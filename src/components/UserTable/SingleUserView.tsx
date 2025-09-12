import { useState, useEffect } from "react";
import { globalStyles } from "../../globalStyles";
//interfaces
import { UserDataInterface } from "../../interfaces/UserDataInterface"
import { SpecializationsInterface } from "../../interfaces/SpecializationInterface";
import { OrganizationInterface } from "../../interfaces/OrganizationsInterface";
import { CityInterface } from "../../interfaces/CityInterface";
//api
import { fetchUserById } from "../../api/usersAPI";
import { updateUserById } from "../../api/usersAPI";
//context
import { useUserOptions } from "../../context/UserOptionsContext";
//components
import LoadingSpinner from "../LoadingSpinner/LoadingSpinner";
import UserSpecializations from "./UserSpecializations";
import UserRoles from "./UserRoles";
import UserNameAndEmail from "./UserNameAndEmail";
import UserCountry from "./UserCountry";
import UserCity from "./UserCity";
import UserOrganization from "./UserOrganization";



interface SingleUserViewProps {
  user: UserDataInterface;
  setIsSingleUserViewOpen: (isOpen: boolean) => void;
  viewMode: 'view' | 'edit';
  setViewMode: (mode: 'view' | 'edit') => void;
}



const SingleUserView = ({ user, setIsSingleUserViewOpen, viewMode, setViewMode }: SingleUserViewProps) => {


  const [loading, setLoading] = useState<boolean>(true);
  const [singleUserData, setSingleUserData] = useState<UserDataInterface | null>(null);
  const [selectedCountryId, setSelectedCountryId] = useState<number | null>(null);
  const [selectedOrganizationId, setSelectedOrganizationId] = useState<number | null>(null);
  const [selectedCityId, setSelectedCityId] = useState<number | null>(null);

  //get user options from context
  const { roles, countries, cities, organizations, specializations } = useUserOptions();


  const [filteredOrganizations, setFilteredOrganizations] = useState<OrganizationInterface[]>([]);
  const [filteredCities, setFilteredCities] = useState<CityInterface[]>([]);

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

  const handleCountryChange = (countryName: string) => {
    setSelectedCountryId(null);
    setFormState((prevFormState) => ({
      ...prevFormState,
      country: countryName,
    }));
  }
  const handleCountrySelect = (countryId: number, countryName: string) => {
    setSelectedCountryId(countryId);
    if (countryId !== selectedCountryId) {
      setFormState((prevFormState) => ({
        ...prevFormState,
        country: countryName,
        city: '',
        organization: '',

      }));
      setSelectedCityId(null);
      setSelectedOrganizationId(null);
      setFilteredCities([]);
      setFilteredOrganizations([]);
    }

  }

  const handleSaveChanges = () => {
    if (!singleUserData) return;

    const specializationIds = formState.specializations.map(spec => spec.id);

    const updatedData = {
      first_name: formState.first_name,
      last_name: formState.last_name,
      email: formState.email,
      role_id: roles.find(r => r.name === formState.role)?.id || singleUserData.role.id,
      country_id: selectedCountryId,
      city_id: selectedCityId,
      organization_id: selectedOrganizationId,
      specialization_ids: specializationIds,
    };

    updateUserById(singleUserData.id, updatedData)
      .then((res) => {
        setSingleUserData(res.user);
        setViewMode('view');
      })
      .catch((err) => {
        console.error("Error updating user:", err);
        alert("Failed to update user. Please try again.");
      });
  }

  useEffect(() => {
    const fetchData = async () => {
      try {

        setLoading(true);

        const fetchedUser = await fetchUserById(user.id);

        setFormState({
          first_name: fetchedUser.first_name,
          last_name: fetchedUser.last_name,
          email: fetchedUser.email,
          specializations: fetchedUser.specializations,
          role: fetchedUser.role.name,
          country: fetchedUser.country?.name ?? '',
          city: fetchedUser.city?.name ?? '',
          organization: fetchedUser.organization?.name ?? '',
        });

        setSingleUserData(fetchedUser);

        setSelectedCountryId(fetchedUser.country.id);
        setSelectedCityId(fetchedUser.city.id);
        setSelectedOrganizationId(fetchedUser.organization.id);

      } catch (error) {
        console.error("Error fetching user details:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user.id, roles, countries]);

  //filter cities and organizations based on selected country filtering on the frontend
  useEffect(() => {
    // Filter cities based on selected country
    const newFilteredCities =
      selectedCountryId !== null
        ? cities.filter((city) => city.country_id === selectedCountryId)
        : cities;
    setFilteredCities(newFilteredCities);

    // Filter organizations based on selected country and optionally selected city
    const newFilteredOrganizations = organizations.filter((org) => {
      if (selectedCountryId !== null && selectedCityId !== null) {
        return (
          org.country_id === selectedCountryId && org.city_id === selectedCityId
        );
      } else if (selectedCountryId !== null) {
        return org.country_id === selectedCountryId;
      } else {
        return true; // no filtering
      }
    });
    setFilteredOrganizations(newFilteredOrganizations);
  }, [selectedCountryId, selectedCityId, cities, organizations]);


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
          <UserNameAndEmail
            formState={formState}
            setFormState={setFormState}
            viewMode={viewMode}
            styles={styles}
          />

          <UserSpecializations
            singleUserData={singleUserData}
            viewMode={viewMode}
            formState={formState}
            setFormState={setFormState}
            specializations={specializations}
            styles={styles}
          />
          <UserRoles
            singleUserData={singleUserData}
            viewMode={viewMode}
            formState={formState}
            setFormState={setFormState}
            roles={roles}
            styles={styles}
          />
          <UserCountry
            formState={formState}
            viewMode={viewMode}
            styles={styles}
            countries={countries}
            handleCountryChange={handleCountryChange}
            handleCountrySelect={handleCountrySelect}
            setFormState={setFormState}
          />
          <UserCity
            formState={formState}
            setFormState={setFormState}
            viewMode={viewMode}
            styles={styles}
            filteredCities={filteredCities}
            setSelectedCityId={setSelectedCityId}
          />
          <UserOrganization
            singleUserData={singleUserData}
            formState={formState}
            setFormState={setFormState}
            viewMode={viewMode}
            styles={styles}
            filteredOrganizations={filteredOrganizations}
            setSelectedOrganizationId={setSelectedOrganizationId}
          />
        </form>
        <div style={styles.quizScores}></div>
      </div>
      <div>
        <button
          style={{
            ...styles.button,
            backgroundColor: globalStyles.colors.error,
          }}
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
          <button
            style={styles.button}
            onClick={handleSaveChanges}
          >Save Changes</button>
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
