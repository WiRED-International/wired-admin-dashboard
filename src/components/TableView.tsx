import { ModuleDownloadInterface } from '../interfaces/ModuleDownloadInterface';
import { useState } from "react";
import { globalStyles } from '../globalStyles';
import sortIcon from '/icons/sort-solid.svg';
import { buildDownloadsQueryString, formatDate } from '../utils/helperFunctions';
import { FilterFormInterface } from '../interfaces/FilterFormInterface';

interface TableViewProps {
    setQueryString: (queryString: string) => void;
    downloads: ModuleDownloadInterface[];
    formData: FilterFormInterface;
    setFormData: (formData: FilterFormInterface) => void;
}

interface ColumnConfig {
    label: string;
    sortField: SortField;
    render: (row: ModuleDownloadInterface) => React.ReactNode;
}

const columns: ColumnConfig[] = [
    { label: 'Module Name', sortField: 'module', render: (row) => row.module?.name },
    { label: 'Package Name', sortField: 'package', render: (row) => row.package?.name },
    { label: 'Download Date', sortField: 'date', render: (row) => formatDate(row.download_date) },
    { label: 'Country', sortField: 'country', render: (row) => row.country?.name },
];

type SortField = 'module' | 'package' | 'date' | 'country';

type SortOptions =
    | 'date_asc'
    | 'date_desc'
    | 'module_asc'
    | 'module_desc'
    | 'package_asc'
    | 'package_desc';


const TableView = ({ setQueryString, downloads, formData, setFormData }: TableViewProps) => {

    const SORT_ASC = 'asc';
    const SORT_DESC = 'desc';

    const [sortField, setSortField] = useState<SortField>('date');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>(SORT_DESC);

    const handleSort = (field: SortField) => {
        const newDirection =
            field === sortField ? (sortDirection === SORT_ASC ? SORT_DESC : SORT_ASC) : SORT_ASC;

        setSortField(field);
        setSortDirection(newDirection);



        // Build new form data with updated sort
        const updatedFormData = {
            ...formData,
            sort_by: field,
            sort_dir: newDirection,
        };

        buildDownloadsQueryString({ formData: updatedFormData, setQueryString });
    };





    return (
        <div style={{
            ...globalStyles.pageContainer,
            paddingTop: '80px', // space for absolute buttons
            width: '100%',
        }}>
            {/* You can position absolute buttons here */}


            <h1 style={{
                color: globalStyles.colors.headerColor,
                padding: '10px',
                marginBottom: '20px'
            }}>
                Downloads List
            </h1>

            <div style={{
                backgroundColor: globalStyles.colors.whiteTheme,
                borderRadius: '8px',
                padding: '20px',
                width: '90%',
                maxWidth: '1000px',
                boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
                overflowX: 'auto',
            }}>
                <div>
                    <table style={styles.table}>
                        <thead style={styles.thead}>
                            <tr style={styles.tr}>
                                {columns.map((column) => (
                                    <th
                                        key={column.label}
                                        style={styles.th}
                                        onClick={() => handleSort(column.sortField)}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <img src={sortIcon} style={styles.sortIcon} />
                                            <span>{column.label}</span>
                                        </div>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {downloads.map((download) => (
                                <tr key={download.id} style={{ textAlign: 'center' }}>
                                    {columns.map((column) => (
                                        <td key={column.label} style={styles.td}>
                                            {column.render(download)}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

const styles = {
    table: {
        width: '100%' as const,
        tableLayout: 'fixed' as const,  // Add this
        borderCollapse: 'collapse' as const,
    },

    thead: {
        backgroundColor: globalStyles.colors.lightGray,
    },
    tr: {


    },
    th: {
        width: '25%' as const,
        cursor: 'pointer' as const,
        padding: '12px',
        borderBottom: '2px solid #ccc',
        fontWeight: 'bold',
        color: '#333'

    },
    td: {
        width: '25%' as const,
        padding: '10px',
        borderBottom: '1px solid #ddd',
        color: '#555',
        textAlign: 'center' as const,
    },
    sortIcon: {
        display: 'inline',
        width: '16px',
        height: '16px',
        objectFit: 'contain' as const,
    }
}


export default TableView;
