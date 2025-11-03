import { useState, useEffect } from "react";
import { globalStyles } from "../../globalStyles";
//interfaces
import { UserDataInterface } from "../../interfaces/UserDataInterface"
import { SpecializationsInterface } from "../../interfaces/SpecializationInterface";
import { OrganizationInterface } from "../../interfaces/OrganizationsInterface";
import { CityInterface } from "../../interfaces/CityInterface";
import { QuizScoreInterface } from "../../interfaces/UserDataInterface";
//api
import { fetchUserById } from "../../api/usersAPI";
import { updateUserById } from "../../api/usersAPI";
import { fetchAllQuizScores } from "../../api/quizScoresAPI";
import { updateQuizScore } from "../../api/quizScoresAPI";
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
import Confirm_custom from "../ConfirmCustom";
import QuizScores from "./QuizScores";


  const VIEW_MODE_EDIT = "edit";
  const VIEW_MODE_VIEW = "view";
interface SingleUserViewProps {
  user: UserDataInterface;
  setIsSingleUserViewOpen: (isOpen: boolean) => void;
  viewMode: typeof VIEW_MODE_VIEW | typeof VIEW_MODE_EDIT;
  setViewMode: (mode: typeof VIEW_MODE_VIEW | typeof VIEW_MODE_EDIT) => void;
}



const SingleUserView = ({ user, setIsSingleUserViewOpen, viewMode, setViewMode }: SingleUserViewProps) => {


  const [loading, setLoading] = useState<boolean>(true);
  const [singleUserData, setSingleUserData] = useState<UserDataInterface | null>(null);
  const [selectedCountryId, setSelectedCountryId] = useState<number | null>(null);
  const [selectedOrganizationId, setSelectedOrganizationId] = useState<number | null>(null);
  const [selectedCityId, setSelectedCityId] = useState<number | null>(null);
  const [quizScores, setQuizScores] = useState<QuizScoreInterface[]>([]);
  const [quizYears, setQuizYears] = useState<number[]>([]);
  const [closeConfirmOpen, setCloseConfirmOpen] = useState(false);
  const [saveConfirmOpen, setSaveConfirmOpen] = useState(false);
  const [selectedYear, setSelectedYear] = useState<number | null>(quizYears && quizYears.length > 0 ? quizYears[0] : null);
  const [filteredQuizScores, setFilteredQuizScores] = useState<QuizScoreInterface[]>([]);
  

  //get user options from context
  const { roles, countries, cities, organizations, specializations } = useUserOptions();


  const [filteredOrganizations, setFilteredOrganizations] = useState<OrganizationInterface[]>([]);
  const [filteredCities, setFilteredCities] = useState<CityInterface[]>([]);

  const [activeTab, setActiveTab] = useState<"all" | "basic" | "cme">("all");

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

  const handleSaveChanges = async () => {
    setLoading(true);
    setSaveConfirmOpen(false);
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

    try {
      for (const score of quizScores) {
        await updateQuizScore(score.id, { score: score.score });
      }
      //update scores using promise.all
      await Promise.all(
        quizScores.map(score => 
          updateQuizScore(score.id, { score: score.score })
        )
      );
      const res = await updateUserById(singleUserData.id, updatedData);
      //I'm refetching the quiz scores here because I was having issues with state not updating properly after editing scores
      const fetchedQuizScores = await fetchAllQuizScores(user.id);
      setQuizScores(fetchedQuizScores || []);
      //update user data in state with response from server
      setSingleUserData(res.user);
      setViewMode(VIEW_MODE_VIEW);
    } catch (err) {
      console.error("Error updating user:", err);
      alert("Failed to update user. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmClose = () => {
    setCloseConfirmOpen(false);
    setIsSingleUserViewOpen(false);
  };
  const handleClose = () => {
    if (viewMode === VIEW_MODE_EDIT) {
      setCloseConfirmOpen(true);
    } else {
      setIsSingleUserViewOpen(false);
    }
  }

  useEffect(() => {
    const fetchData = async () => {
      try {

        setLoading(true);

        const fetchedUser = await fetchUserById(user.id);
        //fetch quiz scores for this user
        const fetchedQuizScores = await fetchAllQuizScores(user.id);
        setQuizScores(fetchedQuizScores || []);
        //set fetched user data to state

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

  //extract unique years from quiz scores
  useEffect(() => {
    const yearsSet = new Set<number>();
    quizScores.forEach(score => {
      const year = new Date(score.date_taken).getFullYear();
      yearsSet.add(year);
    });
    const yearsArray = Array.from(yearsSet).sort((a, b) => b - a); // Sort years descending
    setQuizYears(yearsArray);
  }, [quizScores]);


  useEffect(() => {
    if (selectedYear !== null) {
      setFilteredQuizScores(
        quizScores.filter(score => new Date(score.date_taken).getFullYear() === selectedYear)
      );
    } else {
      setFilteredQuizScores(quizScores);
    }
  }, [quizScores, selectedYear]);



  if (loading) {
    return <LoadingSpinner />;
  }

  // 🧩 Filter quiz scores based on active tab
  let displayedScores = [...filteredQuizScores];

  if (activeTab === "basic") {
    displayedScores = displayedScores.filter(
      (score) =>
        Array.isArray(score.module?.categories) &&
        score.module.categories.some((cat) =>
          cat.toLowerCase().includes("basic")
        )
    );
  }

  if (activeTab === "cme") {
    displayedScores = displayedScores.filter(
      (score) =>
        score.module?.credit_type?.toLowerCase() === "cme" &&
        !(
          Array.isArray(score.module?.categories) &&
          score.module.categories.some((cat) =>
            cat.toLowerCase().includes("basic")
          )
        )
    );
  }

  return (
    <div style={styles.container}>
      <Confirm_custom
        message="Are you sure you want to close without saving? All unsaved changes will be lost."
        onConfirm={handleConfirmClose}
        onCancel={() => setCloseConfirmOpen(false)}
        isOpen={closeConfirmOpen}
      />
      <Confirm_custom
        message="Are you sure you want save your changes?"
        onConfirm={handleSaveChanges}
        onCancel={() => setSaveConfirmOpen(false)}
        isOpen={saveConfirmOpen}
      />
      <div style={styles.header}>
        <h2 style={styles.headerText}>
          {viewMode === VIEW_MODE_VIEW ? "User Profile" : "Edit User"}
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
        <QuizScores 
          quizScores={displayedScores} 
          viewMode={viewMode} 
          quizYears={quizYears} 
          setQuizScores={setQuizScores}
          selectedYear={selectedYear}
          setSelectedYear={setSelectedYear}
          filteredQuizScores={displayedScores}
          setFilteredQuizScores={setFilteredQuizScores}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
        />
      </div>
      <div>
        <button
          style={{
            ...styles.button,
            backgroundColor: globalStyles.colors.error,
          }}
          onClick={handleClose}
        >
          Close
        </button>
        {viewMode === VIEW_MODE_VIEW && (
          <button onClick={() => setViewMode(VIEW_MODE_EDIT)} style={styles.button}>
            Edit
          </button>
        )}
        {viewMode === VIEW_MODE_EDIT && (
          <button
            style={styles.button}
            onClick={() => setSaveConfirmOpen(true)}
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
    transform: 'translate(-50%, -50%)',
    overflow: 'auto' as const
  },
  header: {
    backgroundColor: globalStyles.colors.singleUserViewHeader,
    paddingInline: '30px',
    textAlign: 'left' as const,
    minWidth: '100%',
    height: '89px',
    top: '0',
    position: 'relative' as const,
    display: 'flex',
    alignItems: 'center' as const,
    boxSizing: 'border-box' as const,
  },
  headerText: {
    fontSize: '40px',
    margin: 0,
  },
  content: {
    padding: '20px',
    display: 'flex',
    flexDirection: 'row' as const,

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
  },
  tabBar: {
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  marginBottom: "20px",
  marginTop: "10px",
  borderBottom: "2px solid #ddd",
  width: "100%",
  gap: "10px",
  position: "sticky",
  top: 0,
  backgroundColor: globalStyles.colors.singleUserViewBackground,
  zIndex: 10,
  padding: "10px 0",
  },

  tab: {
    padding: "10px 25px",
    cursor: "pointer",
    fontSize: "16px",
    fontWeight: 500,
    borderBottom: "3px solid transparent",
    color: "#666",
    transition: "all 0.2s ease-in-out",
  },

  activeTab: {
    color: "#0070C0",
    borderBottom: "3px solid #0070C0",
    fontWeight: 600,
    transform: "scale(1.05)",
  },
}
