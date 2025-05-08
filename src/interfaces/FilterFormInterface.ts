export interface FilterFormInterface {
    searchBy: string;
    searchQuery: string;
    sort_by?: string;
    sort_dir?: string;
    startDate: number | null;
    endDate: number | null;
    latitude?: number | '' ;
    longitude?: number | '';
    distance?: number | '';
    //in case we want to use the ids instead of the names
    module_id?: number;
    package_id?: number;
    country_code?: string;
  }

  export interface SaveSearchInterface {
    searchBy: string;
    searchQuery: string;
    sort: string;
    startDate: number | null;
    endDate: number | null;
    latitude?: number | '' ;
    longitude?: number | '';
    distance?: number | '';
    //in case we want to use the ids instead of the names
    module_id?: number;
    package_id?: number;
    country_code?: string;
  }