import React, { useState, ChangeEvent } from 'react';

import { UserDataInterface } from "../interfaces/UserDataInterface";
import { searchUsersBroad } from '../api/usersAPI';

interface UserSearchControlsProps {
    currentPage: string;
    rowsPerPage: string;
    totalPages: number;
    setCurrentPage: (page: string) => void;
    setRowsPerPage: (rows: string) => void;
    setTotalPages: (total: number) => void;
    setUsers: (users: UserDataInterface[]) => void;
    searchQuery: string;
    setSearchQuery: (query: string) => void;
}

const UserSearchControls: React.FC<UserSearchControlsProps> = ({ currentPage, rowsPerPage, totalPages, setCurrentPage, setRowsPerPage, setTotalPages, setUsers, searchQuery, setSearchQuery }) => {

    const handleSearchChange = (e: ChangeEvent<HTMLInputElement>) => {
        setSearchQuery(e.target.value);
    };


    //calculate what the final page number is based on the users and rows per page



    // useEffect(() => {
    //     const total = Math.ceil(users.length / Number(rowsPerPage));
    //     setTotalPages(total);
    // }, [users, rowsPerPage]);

    const handlePageChange = (e: ChangeEvent<HTMLInputElement>) => {
        const val = e.currentTarget.value;
        if (val === "") {
            setCurrentPage("");
            return;
        }
        const num = Number(val);
        if (Number.isNaN(num)) return;
        if (num < 1) {
            console.log('here')
            setCurrentPage("1");
        } else if (num > totalPages) {
            setCurrentPage(totalPages.toString());
        } else {
            setCurrentPage(val);
        }
        //refetch users based on the new page
        // searchUsersBroad(searchQuery, num, Number(rowsPerPage))
        //     .then((results) => {
        //         setUsers(results.users || []);
        //         setTotalPages(results.pageCount || 0);
        //     })
        //     .catch((error) => {
        //         console.error('Error searching users:', error);
        //     });
    };

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setCurrentPage("1"); // Reset to first page on search
        const searchInput = (e.target as HTMLFormElement).elements.namedItem('search') as HTMLInputElement;
        const searchQuery = searchInput.value.trim();
        {
            searchUsersBroad(searchQuery, 1, Number(rowsPerPage))
                .then((results) => {
                    setUsers(results.users || []); 
                    setTotalPages(results.pageCount || 0);
                })
                .catch((error) => {
                    console.error('Error searching users:', error);
                });
        }
    };

    const handleRowsPerPageChange = (e: ChangeEvent<HTMLSelectElement>) => {
        const newRowsPerPage = e.target.value;
        setRowsPerPage(newRowsPerPage);
        setCurrentPage("1"); // Reset to first page on rows per page change
        searchUsersBroad(searchQuery, 1, Number(newRowsPerPage))
            .then((results) => {
                setUsers(results.users || []);
                setTotalPages(results.pageCount || 0);
            })
            .catch((error) => {
                console.error('Error searching users:', error);
            });
    };

    return (
        <div style={styles.searchContainer}>
            <div style={styles.pageControls}>
                <button
                    style={styles.pageButton} type="button"
                    onClick={() => handlePageChange({ currentTarget: { value: "1" } } as ChangeEvent<HTMLInputElement>)}
                    disabled={currentPage === "1"}
                >{`<<`}
                </button>
                <button
                    style={styles.pageButton} type="button"
                    onClick={() => handlePageChange({ currentTarget: { value: (parseInt(currentPage, 10) - 1).toString() } } as ChangeEvent<HTMLInputElement>)}
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
                    onClick={() => handlePageChange({ currentTarget: { value: (parseInt(currentPage, 10) + 1).toString() } } as ChangeEvent<HTMLInputElement>)}
                    disabled={currentPage === totalPages.toString()}
                >{`>`}</button>
                <button
                    style={styles.pageButton} type="button"
                    onClick={() => handlePageChange({ currentTarget: { value: totalPages.toString() } } as ChangeEvent<HTMLInputElement>)}
                    disabled={currentPage === totalPages.toString()}
                >{`>>`}</button>
                { totalPages > 0 && (
                    <span style={{ marginLeft: '10px' }}>
                        Page {currentPage} of {totalPages}
                    </span>
                )}
            </div>
            <div style={styles.pageControls}>
                <h3 style={styles.label}>Rows per page:</h3>
                <select
                    style={styles.pageInput}
                    value={rowsPerPage}
                    onChange={handleRowsPerPageChange}
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
                        value={searchQuery}
                        onChange={handleSearchChange}
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
