import { UserDataInterface } from "../../interfaces/UserDataInterface";
import cssStyles from "./UsersTable.module.css";
import UserTableActions from "./UserTableActions";
import { globalStyles } from "../../globalStyles";
import SortButtons from "../SortButton/SortButtons";
import { getCellStyle } from "../../utils/helperFunctions";
import { ResizableTH } from "../../utils/resizableTH";
import React from "react";

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
    { key: "CME_Credits", label: "CME Credits" },
    { key: "basicCompletionPercent", label: "Basic Training (%)" },
    //specializations has been removed for now due it causing issues with sorting and pagination
    // { key: "specializations", label: "Specializations" },
    { key: "role", label: "Role" },
    { key: "country", label: "Country" },
    // { key: "city", label: "City" },
    { key: "organization", label: "Organization" },
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
    const [colWidths, setColWidths] = React.useState<Record<string, number>>(() => {
      try {
        const saved = localStorage.getItem("usersTableColWidths");
        return saved ? JSON.parse(saved) : {};
      } catch {
        return {};
      }
    });

    // 💾 Save widths whenever they change
    React.useEffect(() => {
      localStorage.setItem("usersTableColWidths", JSON.stringify(colWidths));
    }, [colWidths]);

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
    <table style={styles.table}>
      <thead>
        <tr className={cssStyles.top_user_table_head}>
          {columns.map((column) => (
            <ResizableTH
              key={column.key}
              columnKey={column.key}
              baseStyle={{
                ...styles.tableHead,
                padding: "6px 8px",
                textAlign: column.key === "CME_Credits" ? "right" : "center",
                whiteSpace: "nowrap",
                minWidth: "80px",
                width: colWidths[column.key] ? `${colWidths[column.key]}px` : undefined,
              }}
              setColWidths={setColWidths}
              colWidths={colWidths}
              onHeaderClick={() => sortButtonOnClick(column.key)}
            >
              <>
                {column.label}
                {!nonSortableColumns.includes(column.key) && (
                  <SortButtons
                    columnKey={column.key}
                    sortBy={sortBy}
                    sortOrder={sortOrder}
                  />
                )}
              </>
            </ResizableTH>
          ))}
        </tr>
      </thead>

      <tbody>
        {users.map((user, index) => {
          const isEven = index % 2 === 0;
          return (
            <tr
              key={index}
              style={{ backgroundColor: isEven ? evenGray : oddGray }}
            >
              {columns.map((column) => {
                const isSortedColumn = column.key === sortBy;
                const backgroundColor = isSortedColumn
                  ? (isEven ? evenGreen : oddGreen)
                  : "";

                return (
                  <td
                    key={column.key}
                    style={{
                      ...getCellStyle(column.key, backgroundColor),
                      ...(colWidths[column.key] && {
                        width: `${colWidths[column.key]}px`,
                      }),
                    }}
                  >
                    {renderCellValue(column.key, user, index)}
                  </td>
                );
              })}
            </tr>
          );
        })}
      </tbody>
    </table>
  );
};

export default UsersTable;

const styles: Record<string, React.CSSProperties> = {
  table: {
    width: "100%",
    borderCollapse: "collapse",
    fontFamily: "inter",
    marginTop: "20px",
    border: "1px solid #A9A9A9",
    boxShadow: "0 2px 4px rgba(0, 0, 0, 0.05)",
  },
  tableHead: {
    textAlign: "left",
    whiteSpace: "nowrap",
    border: "1px solid #A9A9A9",
    padding: "12px 10px",
    background: "linear-gradient(to bottom, #E6E6E6, #CCCCCC)",
    fontWeight: 600,
    color: "#333333",
    position: "relative",
    verticalAlign: "middle",
  },
  tableCell: {
    border: "1px solid #A9A9A9",
    padding: "10px 12px",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    minWidth: "120px",
    verticalAlign: "middle",
  },
};
