import React, { useState, useEffect } from "react";
import { UserDataInterface } from "../../interfaces/UserDataInterface";
import cssStyles from "./UsersTable.module.css";
import UserTableActions from "./UserTableActions";
import { globalStyles } from "../../globalStyles";
import SortButtons from "../SortButton/SortButtons";
import { searchUsersBroad } from "../../api/usersAPI";

type UsersTableProps = {
    users: UserDataInterface[];
    sortBy: string | null;
    sortOrder: 'ASC' | 'DESC';
    setSortBy: (sortBy: string | null) => void;
    setSortOrder: (sortOrder: 'ASC' | 'DESC') => void;
    setCurrentPage: (currentPage: string) => void;
};

const columns = [
    { key: 'actions', label: 'Actions' },
    { key: "last_name", label: "Last Name" },
    { key: "first_name", label: "First Name" },
    { key: "email", label: "Email" },
    { key: "CME_Credits", label: "CME Credits" },
    { key: "remainingCredits", label: "Remaining Credits" },
    { key: "specializations", label: "Specializations" },
    { key: "role", label: "Role" },
    { key: "country", label: "Country" },
    { key: "city", label: "City" },
    { key: "organization", label: "Organization" },
];

const nonSortableColumns = ['actions', 'specializations', 'CME_Credits', 'remainingCredits'];


const UsersTable: React.FC<UsersTableProps> = ({ users, sortBy, sortOrder, setSortBy, setSortOrder, setCurrentPage }: UsersTableProps) => {


    const sortButtonOnClick = (columnKey: string) => {
        if (!columnKey || nonSortableColumns.includes(columnKey)) return;

        if (sortBy === columnKey) {
            setSortOrder(sortOrder === 'ASC' ? 'DESC' : 'ASC');
            setCurrentPage("1");
        } else {
            setSortBy(columnKey);
            setSortOrder('ASC');
            setCurrentPage("1");
        }
    
    };

    // useEffect(() => {
    //     const fetchSortedUsers = async () => {
    //         try {
    //             const fetchedUsers = await searchUsersBroad('', 1, 10, sortBy, sortOrder);
    //             console.log('Fetched sorted users: ', fetchedUsers);
    //             // Assuming fetchedUsers.users is the array of users
    //             if (fetchedUsers.users) {
    //                 users = fetchedUsers.users;
    //             }
    //         } catch (error) {
    //             console.error("Error fetching sorted users:", error);
    //         }
    //     };

    //     fetchSortedUsers();
    // }, [sortBy, sortOrder]);

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
                {users.map((user, index) => {
                    const isEven = index % 2 === 0;
                    return (

                        <tr key={index} style={{
                            backgroundColor: isEven ? evenGray : oddGray,

                        }}>
                            {columns.map((column) => {
                                const isFirstName = column.key === "first_name";
                                return (
                                    // my apoligies for the confusing code below
                                    <td
                                        key={column.key}
                                        style={{ ...styles.tableCell, backgroundColor: isFirstName ? isEven ? evenGreen : oddGreen : '' }}

                                    >

                                        {column.key === "actions" ? (
                                            <UserTableActions user={user} />
                                        ) : column.key === "specializations" ? (
                                            (user as any)[column.key].length > 0
                                                ? (user as any)[column.key].map((spec: { name: string }) => spec.name).join(", ")
                                                : "None"
                                        ) : Array.isArray((user as any)[column.key])
                                            ? (user as any)[column.key].join(", ")
                                            : typeof (user as any)[column.key] === "object" && (user as any)[column.key] !== null
                                                ? (user as any)[column.key].name || JSON.stringify((user as any)[column.key])
                                                : (user as any)[column.key]}
                                    </td>
                                )
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
