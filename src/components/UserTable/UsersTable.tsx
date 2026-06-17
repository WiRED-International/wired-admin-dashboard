import { UserDataInterface } from "../../interfaces/UserDataInterface";
import TableContainer from "../ui/TableContainer";
import cssStyles from "./UsersTable.module.css";
import UserTableActions from "./UserTableActions";
import { globalStyles } from "../../globalStyles";
import SortButtons from "../SortButton/SortButtons";
import { getCellStyle } from "../../utils/helperFunctions";
import React from "react";
import Table from "../ui/table/Table";

type UsersTableProps = {
    users: UserDataInterface[];
    sortBy: string | null;
    sortOrder: 'ASC' | 'DESC';
    setSortBy: (sortBy: string | null) => void;
    setSortOrder: (sortOrder: 'ASC' | 'DESC') => void;
    setCurrentPage: (currentPage: number) => void;
    fetchAllUsers: () => void;
    isDeleteConfirmOpen: boolean;
    setIsDeleteConfirmOpen: (isOpen: boolean) => void;
};

const columns = [
    { key: 'actions', label: 'Actions' },
    { key: "row_number", label: "#"},
    { key: "last_name", label: "Last Name" },
    { key: "first_name", label: "First Name" },
    { key: "email", label: "Email" },
    { key: "CME_Credits", label: "CME" },
    { key: "basicCompletionPercent", label: "Basic Training" },
    { key: "organization", label: "Organization" },
    //specializations has been removed for now due it causing issues with sorting and pagination
    // { key: "specializations", label: "Specializations" },
    { key: "country", label: "Country" },
    { key: "role", label: "Role" },
    // { key: "city", label: "City" },
    
];

const nonSortableColumns = ['actions', 'row_number', 'specializations', 'basicCompletionPercent', ];

const evenGray = "#FFFEFE";
const oddGray = "#F5F5F5";
const evenGreen = globalStyles.colors.singleUserViewHeader;
const oddGreen = "#E3FFDE";

const UsersTable: React.FC<UsersTableProps> = ({
  users,
  sortBy,
  sortOrder,
  setSortBy,
  setSortOrder,
  setCurrentPage,
  fetchAllUsers,
}: UsersTableProps) => {
    const sortButtonOnClick = (columnKey: string) => {
        if (!columnKey || nonSortableColumns.includes(columnKey)) return;

        if (sortBy === columnKey) {
            setSortOrder(sortOrder === 'ASC' ? 'DESC' : 'ASC');
            setCurrentPage(1);
        } else {
            setSortBy(columnKey);
            setSortOrder('ASC');
            setCurrentPage(1);
        }
    };

    const renderCellValue: (
      columnKey: string, 
      user: UserDataInterface,
      index?: number
    ) => React.ReactNode = (columnKey, user, index) => {
        const value = (user as unknown as Record<string, unknown>)[columnKey];

        if (columnKey === "row_number") {
          return (index ?? 0) + 1;
        }

        if (columnKey === "actions") {
            return <UserTableActions user={user} fetchAllUsers={fetchAllUsers} />;
        }

        if (columnKey === "CME_Credits") {
            return user.CME_Credits ?? 0;
        }

        if (columnKey === "basicCompletionPercent") {
            const percent = user.basicCompletionPercent ?? 0;
            return `${percent.toFixed(2)}%`;
        }

      //if specializations were to be added back in
      
    //   if (columnKey === "specializations") {
    //     if (Array.isArray(value) && value.length > 0) {
    //       return value.map((spec: { name: string }) => spec.name).join(", ");
    //     }
    //     return "None";
    //   }

        if (value && typeof value === "object") {
        // return safely as string
        const maybeName = (value as { name?: string }).name;
        return maybeName ? maybeName : JSON.stringify(value);
        }

        // Always return string or number as a fallback
        if (value === null || value === undefined) return "";

        if (typeof value === "boolean") return value ? "Yes" : "No";

        if (typeof value === "string" || typeof value === "number") return value;

        return String(value);
    };
      
    return (
      
      <TableContainer>
        <Table>
          <thead className={cssStyles.stickyHeader}>
            <tr className={cssStyles.top_user_table_head}>
              {columns.map((column) => (
                <th
                  key={column.key}
                  style={{
                    ...styles.tableHead,

                    padding: "6px 8px",

                    textAlign: "center",

                    whiteSpace: "nowrap",

                    width:
                      column.key === "actions"
                        ? "160px"
                        : column.key === "row_number"
                        ? "50px"
                        : column.key === "last_name"
                        ? "120px"
                        : column.key === "first_name"
                        ? "120px"
                        : column.key === "email"
                        ? "220px"
                        : column.key === "CME_Credits"
                        ? "110px"
                        : column.key === "basic_training"
                        ? "140px"
                        : column.key === "role"
                        ? "90px"
                        : column.key === "country"
                        ? "100px"
                        : column.key === "organization"
                        ? "160px"
                        : "110px",
                  }}

                  onClick={() => sortButtonOnClick(column.key)}
                >
                  <div
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "4px",
                    }}
                  >
                    <span>{column.label}</span>

                    {!nonSortableColumns.includes(column.key) && (
                      <SortButtons
                        columnKey={column.key}
                        sortBy={sortBy}
                        sortOrder={sortOrder}
                      />
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {users.map((user, index) => {
              const isEven = index % 2 === 0;
              return (
                <tr
                  key={index}
                  className={cssStyles.tableRow}
                  style={{ backgroundColor: isEven ? evenGray : oddGray }}
                >
                  {columns.map((column) => {
                    const isSortedColumn = column.key === sortBy;
                    const backgroundColor = isSortedColumn
                      ? (isEven ? evenGreen : oddGreen)
                      : "";

                    const cellValue = renderCellValue(column.key, user, index);

                    return (
                      <td
                        key={column.key}
                        title={
                          typeof cellValue === "string" || typeof cellValue === "number"
                            ? String(cellValue)
                            : undefined
                        }
                        style={{
                          ...getCellStyle(column.key, backgroundColor),
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          maxWidth: "220px",
                        }}
                      >
                        {cellValue}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </Table>
      </TableContainer>
    );
  };

export default UsersTable;

const styles: Record<string, React.CSSProperties> = {
  tableHead: {
    textAlign: "left",
    whiteSpace: "nowrap",
    border: "1px solid #E2E8F0",
    padding: "8px 6px",
    background: "#F8FAFC",
    fontWeight: 700,
    fontSize: "14px",
    color: "#334155",
    verticalAlign: "middle",
  },
  
  tableCell: {
    border: "1px solid #E2E8F0",
    padding: "4px 8px",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    minWidth: "120px",
    verticalAlign: "middle",
    fontSize: "14px",
    color: "#334155",
    backgroundColor: "#FFFFFF",
  },
};
