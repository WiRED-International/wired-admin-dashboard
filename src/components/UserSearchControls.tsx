import React, { useEffect, ChangeEvent } from 'react';

import { UserDataInterface } from "../interfaces/UserDataInterface";
import { searchUsersBroad } from '../api/usersAPI';
import { fetchUsers } from '../api/usersAPI';

interface UserSearchControlsProps {
    users: UserDataInterface[];
    currentPage: string;
    rowsPerPage: string;
    totalPages: number;
    setCurrentPage: (page: string) => void;
    setRowsPerPage: (rows: string) => void;
    setTotalPages: (total: number) => void;
    setUsers: (users: UserDataInterface[]) => void;
}

const UserSearchControls: React.FC<UserSearchControlsProps> = ({ users, currentPage, rowsPerPage, totalPages, setCurrentPage, setRowsPerPage, setTotalPages, setUsers }) => {

    //calculate what the final page number is based on the users and rows per page



    useEffect(() => {
        const total = Math.ceil(users.length / Number(rowsPerPage));
        setTotalPages(total);
    }, [users, rowsPerPage]);

    const handlePageChange = (e: ChangeEvent<HTMLInputElement>) => {
        const val = e.currentTarget.value;
        if (val === "") {
            setCurrentPage("");
            return;
        }
        const num = Number(val);
        if (Number.isNaN(num)) return;
        if (num < 1) {
            setCurrentPage("1");
        } else if (num > totalPages) {
            setCurrentPage(totalPages.toString());
        } else {
            setCurrentPage(val);
        }
    };

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setCurrentPage("1"); // Reset to first page on search
        const searchInput = (e.target as HTMLFormElement).elements.namedItem('search') as HTMLInputElement;
        const searchQuery = searchInput.value.trim();
        if (searchQuery) {
            searchUsersBroad(searchQuery)
                .then((results) => {
                    // Assuming you want to update the users state with the search results
                    setUsers(results); // Uncomment this if you have setUsers in props
                    console.log('Search results:', results);
                })
                .catch((error) => {
                    console.error('Error searching users:', error);
                });
        }
        else{
            // If search query is empty, reset to original users

            fetchUsers()
                .then((fetchedUsers) => {
                    setUsers(fetchedUsers);
                })
                .catch((error) => {
                    console.error('Error fetching users:', error);
                });
            setUsers(users); // Reset to original users if search is empty
        }

    };

    return (
        <div style={styles.searchContainer}>
            <div style={styles.pageControls}>
                <button
                    style={styles.pageButton} type="button"
                    onClick={() => setCurrentPage("1")}
                    disabled={currentPage === "1"}
                >{`<<`}
                </button>
                <button
                    style={styles.pageButton} type="button"
                    onClick={() => setCurrentPage((parseInt(currentPage, 10) - 1).toString())}
                    disabled={currentPage === "1"}
                >{`<`}</button>
                <input
                    type="number"
                    value={currentPage}
                    onChange={handlePageChange}
                    style={styles.pageInput}
                    min={1}
                    max={totalPages}
                />
                <button
                    style={styles.pageButton} type="button"
                    onClick={() => setCurrentPage((parseInt(currentPage, 10) + 1).toString())}
                    disabled={currentPage === totalPages.toString()}
                >{`>`}</button>
                <button
                    style={styles.pageButton} type="button"
                    onClick={() => setCurrentPage(totalPages.toString())}
                    disabled={currentPage === totalPages.toString()}
                >{`>>`}</button>
            </div>
            <div style={styles.pageControls}>
                <h3 style={styles.label}>Rows per page:</h3>
                <select
                    style={styles.pageInput}
                    value={rowsPerPage}
                    onChange={e => setRowsPerPage(e.target.value)}
                >
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                    <option value={200}>200</option>
                </select>
            </div>
            <div style={styles.pageControls}>
                <form
                    onSubmit={handleSearchSubmit}
                    style={{ display: 'flex', alignItems: 'center' }}
                >
                    <h3 style={styles.label}>Search:</h3>
                    <input 
                        type="text" 
                        placeholder="Search by name or email" 
                        style={{ ...styles.pageInput, ...styles.searchInput }} 
                        name="search"
                    />
                    <button type="submit" style={styles.searchButton}>Search</button>
                </form>
            </div>
        </div>
    );
}

export default UserSearchControls;

const styles: { [key: string]: React.CSSProperties } = {
    searchContainer: {
        display: "flex",
        flexDirection: "row",
    },
    pageControls: {
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        borderRight: "3px solid #9D9D9D",
        paddingBlock: "10px",
        paddingRight: "40px",
        paddingLeft: "10px",
        textWrap: "nowrap",
    },
    pageButton: {
        border: "none",
        backgroundColor: 'transparent',
        fontSize: "24px",
        marginInline: "10px",
    },
    pageInput: {
        width: "50px",
        height: "30px",
        fontFamily: 'inter',
    },
    searchInput: {
        width: "200px",
        height: "30px",
        fontFamily: 'inter',
        marginInline: "10px",
    },
    label: {
        fontFamily: 'inter',
        marginInline: "10px",
        marginBlock: "0px",
    },
    searchButton: {
        height: "30px",
        fontFamily: 'inter',
        marginInline: "10px",
        cursor: "pointer",
    }
};
