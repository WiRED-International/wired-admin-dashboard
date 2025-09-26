import { UserDataInterface } from "../../interfaces/UserDataInterface";
import cssStyles from "./UsersTable.module.css";
import UserTableActions from "./UserTableActions";
import { globalStyles } from "../../globalStyles";
import SortButtons from "../SortButton/SortButtons";
import { calculateCmeCredits } from "../../utils/cmeCredits";
import React, { useMemo } from "react";

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
    { key: "last_name", label: "Last Name" },
    { key: "first_name", label: "First Name" },
    { key: "email", label: "Email" },
    { key: "CME_Credits", label: "CME Credits" },
    { key: "remainingCredits", label: "Remaining Credits" },
    //specializations has been removed for now due it causing issues with sorting and pagination
    // { key: "specializations", label: "Specializations" },
    { key: "role", label: "Role" },
    { key: "country", label: "Country" },
    { key: "city", label: "City" },
    { key: "organization", label: "Organization" },
];

const nonSortableColumns = ['actions', 'specializations', 'CME_Credits', 'remainingCredits'];

type UserWithCredits = UserDataInterface & { cmeCredits: number };


const UsersTable: React.FC<UsersTableProps> = ({ users, sortBy, sortOrder, setSortBy, setSortOrder, setCurrentPage, fetchAllUsers }: UsersTableProps) => {


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

    const usersWithCredits: UserWithCredits[] = useMemo(() => {
    return users.map((user) => ({
        ...user,
        cmeCredits: calculateCmeCredits(user.quizScores || []),
    }));
    }, [users]);

    const renderCellValue = (columnKey: string, user: UserDataInterface & { cmeCredits: number }) => {
        const value = (user as any)[columnKey];

        if (columnKey === "actions") {
            return <UserTableActions 
                user={user} 
                fetchAllUsers={fetchAllUsers} 
            />;
        }

        if (columnKey === "CME_Credits") {
            return user.cmeCredits; // ✅ now safe
        }
      //if specializations were to be added back in
      
    //   if (columnKey === "specializations") {
    //     if (Array.isArray(value) && value.length > 0) {
    //       return value.map((spec: { name: string }) => spec.name).join(", ");
    //     }
    //     return "None";
    //   }

        if (Array.isArray(value)) {
            return value.join(", ");
        }
        //this is to handle objects like role, country, city, organization
        if (value && typeof value === "object") {
            return value.name || JSON.stringify(value);
        }

        return value ?? "";
    };
      
      


    return (
        <table style={styles.table}>
            <thead >
                <tr className={cssStyles.top_user_table_head}>
                    {columns.map((column) => (
                        <th
                            key={column.key}
                            style={styles.tableHead}
                            className={cssStyles.user_table_head}
                            onClick={() => sortButtonOnClick(column.key)}
                        >
                            <div className={cssStyles.user_table_head_text}>
                                {column.label}
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
                {usersWithCredits.map((user, index) => {
                    const isEven = index % 2 === 0;
                    return (

                        <tr key={index} style={{
                            backgroundColor: isEven ? evenGray : oddGray,

                        }}>
                            {columns.map((column) => {
                                const isFirstName = column.key === "first_name";
                                let backgroundColor = "";
                                if (isFirstName) {
                                  backgroundColor = isEven
                                    ? evenGreen
                                    : oddGreen;
                                }
                                return (
                                  <td
                                    key={column.key}
                                    style={{
                                      ...styles.tableCell,
                                      backgroundColor,
                                    }}
                                  >
                                    {renderCellValue(column.key, user)}
                                  </td>
                                );
                            })}
                        </tr>
                    )
                })}
            </tbody>
        </table>
    );
};

export default UsersTable;

const tableborder = "1px solid #A9A9A9";
const evenGray = '#FFFEFE'
const oddGray = '#F5F5F5'
const evenGreen = globalStyles.colors.singleUserViewHeader
const oddGreen = '#E3FFDE'

const styles: { [key: string]: React.CSSProperties } = {
    table: {
        width: "100%",
        borderCollapse: "collapse",
        fontFamily: 'inter',
        marginTop: "20px",
        border: tableborder,
    },
    tableHead: {
        textAlign: "left",
        textWrap: "nowrap",
        border: tableborder,
        padding: "10px",
        // couldnt get shadow to show below the bottom edge even with css
    },

    tableCell: {
        border: tableborder,
        padding: "10px",
        textWrap: "nowrap",
        overflowX: "auto",
        minWidth: "150px",
        maxWidth: "275px",
    },

}
