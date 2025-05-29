import React from "react";
import { UserDataInterface } from "../../interfaces/UserDataInterface";
import cssStyles from "./UsersTable.module.css";
import UserTableActions from "./UserTableActions";

type UsersTableProps = {
    users: UserDataInterface[];
};

const columns = [
    { key: 'actions', label: 'Actions' },
    { key: "firstName", label: "First Name" },
    { key: "lastName", label: "Last Name" },
    { key: "email", label: "Email" },
    { key: "CME_Credits", label: "CME Credits" },
    { key: "remainingCredits", label: "Remaining Credits" },
    { key: "specializations", label: "Specializations" },
    { key: "role", label: "Role" },
    { key: "country", label: "Country" },
    { key: "city", label: "City" },
    { key: "organization", label: "Organization" },
];


const UsersTable: React.FC<UsersTableProps> = ({ users }: UsersTableProps) => {
    return (
        <table style={styles.table}>
            <thead>
                <tr>
                    {columns.map((column) => (
                        <th
                            key={column.key}
                            style={styles.tableHead}
                            className={cssStyles.user_table_head}
                        >
                            {column.label}
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
                                const isFirstName = column.key === "firstName";
                                return (
                                    <td
                                        key={column.key}
                                        style={{ ...styles.tableCell, backgroundColor: isFirstName ? isEven ? evenGreen : oddGreen : '' }}

                                    >
                                        {column.key === "actions" ? (
                                            <UserTableActions />
                                        ) : column.key === "specializations" ? (
                                            (user as any)[column.key].length > 0
                                                ? (user as any)[column.key].join(", ")
                                                : "None"
                                        ) : Array.isArray((user as any)[column.key])
                                            ? (user as any)[column.key].join(", ")
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
const evenGreen = '#96C98B'
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
        overflowX: "scroll",
        minWidth: "150px",
        maxWidth: "275px",
    },
}
