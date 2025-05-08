
import { FilterFormInterface } from "../interfaces/FilterFormInterface";
import auth from "./auth";

interface BuildQueryStringInterface {
  formData: FilterFormInterface;
  setQueryString: (queryString: string) => void;
}
//function for creating query string for downloads search filters and sorting parameters
export const buildDownloadsQueryString = ({ formData, setQueryString }: BuildQueryStringInterface): void => {
  //validate form data
  //create query string
  const params = new URLSearchParams();
  if (formData.searchBy && formData.searchQuery) {
    params.append(formData.searchBy, formData.searchQuery);
  }


  if (formData.sort_by && formData.sort_dir) {

    params.append('sort_by', formData.sort_by);
    params.append('sort_dir', formData.sort_dir);
  }
  //if module_id is provided in parms
  if (formData.module_id) params.append('module_id', formData.module_id.toString());
  if (formData.startDate) params.append('start_date', formData.startDate.toString());
  if (formData.endDate) params.append('end_date', formData.endDate.toString());
  if (formData.searchBy) {
    //this if/else ensures that only one of the two searchBy options is used
    if (formData.searchBy === 'module') {
      params.append('module_name', formData.searchQuery);
    } else if (formData.searchBy === 'package') {
      params.append('package_name', formData.searchQuery);
    }
  }
  if (formData.latitude && formData.longitude) {
    params.append('latitude', formData.latitude.toString());
    params.append('longitude', formData.longitude.toString());
    if (formData.distance) {
      params.append('distance', formData.distance.toString());
    }
  }

  if (formData.country_code) {
    params.append('country_code', formData.country_code);
  }
  setQueryString(params.toString());
};

export const handleDownloadCSV = async (queryString: string) => {
  try {
    const token = auth.getToken();

    const response = await fetch(`/api/downloads?${queryString}&output=csv`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (!response.ok) throw new Error('Failed to fetch CSV');

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = 'wired_download_data.csv';
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  } catch (err) {
    console.error(err);
    alert('There was a problem downloading the CSV.');
  }
};

export const formatDate = (timestamp: number) => {
  const date = new Date(timestamp * 1000);
  const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-indexed, so add 1
  const day = String(date.getDate()).padStart(2, '0');
  const year = date.getFullYear();
  return `${month}/${day}/${year}`;
};


