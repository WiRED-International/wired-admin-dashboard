
import { useState, useEffect } from 'react';
import DashboardHeader from '../components/DashboardHeader';
import { fetchDownloads } from '../api/downloadsApi';
import { fetchModuleAndPackageInfo } from '../api/modulesAPI';
import { ModuleDownloadInterface } from '../interfaces/ModuleDownloadInterface';
import LoadingSpinner from '../components/LoadingSpinner/LoadingSpinner';
import { globalStyles } from '../globalStyles';
import FilterPopover from '../components/FilterPopover';
import { buildDownloadsQueryString, handleDownloadCSV } from '../utils/helperFunctions';
import GoogleMapsComponent from '../components/GoogleMap';
import TableView from '../components/TableView';
import { IdsAndNamesInterface } from '../interfaces/IdsAndNamesInterface';
import { FilterFormInterface } from '../interfaces/FilterFormInterface';
import { fetchGoogleAPIKey } from '../api/googleAPIKey';

enum ViewMode {
  Map = 'map',
  Table = 'table',
}

const AdminDashboard = () => {

  const [downloads, setDownloads] = useState<ModuleDownloadInterface[]>([]);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [hasQueriedDownloads, setHasQueriedDownloads] = useState<boolean>(false);
  const [hasQueriedModuleAndPackageInfo, setHasQueriedModuleAndPackageInfo] = useState<boolean>(false);
  const [filterPopoverOpen, setFilterPopoverOpen] = useState<boolean>(false);
  const [queryString, setQueryString] = useState<string>('');
  const [moduleAndPackageInfo, setModuleAndPackageInfo] = useState<IdsAndNamesInterface>({} as IdsAndNamesInterface);
  const [formData, setFormData] = useState<FilterFormInterface>({
    searchQuery: '',
    searchBy: '',
    sort_by: '',
    sort_dir: '',
    startDate: null,
    endDate: null,
    latitude: '',
    longitude: '',
    distance: '',
  });
  const [googleAPIKey, setGoogleAPIKey] = useState<string>('');
  const [viewMode, setViewMode] = useState<ViewMode>(ViewMode.Map);

  const handleViewAllDownloads = async () => {
    setLoading(true);
    setErrorMessage('');
    try {
      const data = await fetchDownloads(queryString);
      setDownloads(data);
    } catch (err) {
      if (err instanceof Error) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage('An unknown error occurred. Please try again later.');
      }
    } finally {
      setLoading(false);
      setHasQueriedDownloads(true);
    }
  }

  const handlePopoverClose = () => {
    setFilterPopoverOpen(false);
  }

  useEffect(() => {
    setLoading(true);
    //getting list of of names and ids for modules and packages for filter dropdowns if not already queried
    //it would be nice to implement caching for this or some means of not querying this every time the page is loaded
    if (!hasQueriedModuleAndPackageInfo) {
      fetchModuleAndPackageInfo()
        .then((data) => {
          setModuleAndPackageInfo(data);
          setHasQueriedModuleAndPackageInfo(true);
          setLoading(false);
        })
        .catch((err) => {
          console.error(err);
          setLoading(false);
        });
    }
    const savedFormData = localStorage.getItem('formData');
    if (savedFormData) {
      const parsedFormData = JSON.parse(savedFormData);
      buildDownloadsQueryString({ formData: parsedFormData, setQueryString });
    }
    fetchGoogleAPIKey()
      .then((data) => {
        setGoogleAPIKey(data);
      })
      .catch((err) => {
        console.error(err);
      });
  }, [])

  useEffect(() => {
    handleViewAllDownloads();
  }, [queryString]);

  return (
    <div style={globalStyles.pageContainer}>
      <DashboardHeader />

      {filterPopoverOpen &&
        <FilterPopover
          setQueryString={setQueryString}
          onClose={handlePopoverClose}
          moduleAndPackageInfo={moduleAndPackageInfo}
          formData={formData}
          setFormData={setFormData}
          queryString={queryString}
        />}

      <div style={styles.buttonContainer}>
        {/* <button style={styles.button} onClick={handleViewAllDownloads}>View All Downloads</button> */}
        <button
          style={{ ...styles.button, ...styles.filterButton }}
          onClick={() => setFilterPopoverOpen(!filterPopoverOpen)}
        >
          Filter/Search/Save Results
        </button>
        <button
          style={{ ...styles.button, ...styles.filterButton, backgroundColor: globalStyles.colors.darkButtonTheme }}
          onClick={() => setViewMode(viewMode === ViewMode.Map ? ViewMode.Table: ViewMode.Map)}
        >
          {viewMode === 'map' ? 'Table View' : 'Map View'}
        </button>
        {viewMode === 'table' && <button
          style={{ ...styles.button, ...styles.filterButton, backgroundColor: 'blue' }}
          onClick={() => {
            handleDownloadCSV(queryString); 
          }}
        >
          Download CSV
        </button>}
      </div>

      {/* {errorMessage && <div style={styles.error}>{errorMessage}</div>} */}
      {loading && <LoadingSpinner />}
      {hasQueriedDownloads && downloads.length === 0 && <div style={{ ...styles.error, position: 'absolute' }}>{errorMessage ? errorMessage : 'No downloads match the provided search criteria.'}</div>}

      {googleAPIKey && viewMode === 'map' && <GoogleMapsComponent downloads={downloads} handleViewAllDownloads={handleViewAllDownloads} googleAPIKey={googleAPIKey} />}

      {viewMode === 'table' && <TableView setQueryString={setQueryString} downloads={downloads} formData={formData} setFormData={setFormData} />}
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    fontFamily: 'Arial, sans-serif',
    backgroundColor: globalStyles.colors.pageBackgroundMain,
    height: '100vh',
    display: 'flex',
    flexDirection: 'column',
    color: globalStyles.colors.darkText,
    alignItems: 'center',
    overflow: 'hidden',
  },
  buttonContainer: {
    display: 'flex',
    justifyContent: 'center',
    gap: '10px', // Space between the buttons
    marginTop: '20px',
    position: 'absolute',
    top: '130px',
    width: '100%',
    zIndex: 1,
  },
  button: {
    backgroundColor: globalStyles.colors.darkButtonTheme,
    color: globalStyles.colors.whiteTheme,
    fontSize: '16px',
    padding: '12px 24px',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'background 0.3s ease',
    marginTop: '20px',
    maxWidth: '200px',  // Ensures it doesn't get too wide
    // width: '100%', // Allows it to shrink on smaller screens
    textAlign: 'center',
    minHeight: '60px',
    flex: 1
  },
  filterButton: {
    maxWidth: '170px',  // Ensures it doesn't get too wide
    width: '100%', // Allows it to shrink on smaller screens
    backgroundColor: globalStyles.colors.headerColor, // Different color for Filter/Sort button
    borderRadius: '8px',
  },
  error: {
    backgroundColor: globalStyles.colors.error,
    color: globalStyles.colors.whiteTheme,
    padding: '10px',
    borderRadius: '5px',
    marginTop: '15px',
    textAlign: 'center',
    fontSize: '14px',
    maxWidth: '80%',
  },
};

export default AdminDashboard;
