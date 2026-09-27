import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import Select from "../components/ui/Select";
import React, { ChangeEvent, useState } from 'react';
import Toolbar from "../components/ui/Toolbar";
import SearchableOrganizationPicker from "./Common/SearchableOrganizationPicker";

type OrganizationOption = {
    id: number;
    name: string;
};

interface UserSearchControlsProps {
    currentPage: number;
    rowsPerPage: number;
    totalPages: number;
    setCurrentPage: (page: number) => void;
    setRowsPerPage: (rows: number) => void;
    searchQuery: string;
    setSearchQuery: (query: string) => void;
    organizationId: number | null;
    setOrganizationId: (id: number | null) => void;
    organizations: OrganizationOption[];
}

const UserSearchControls: React.FC<UserSearchControlsProps> = ({
  currentPage,
  rowsPerPage,
  totalPages,
  setCurrentPage,
  setRowsPerPage,
  searchQuery,
  setSearchQuery,
  organizationId,
  setOrganizationId,
  organizations,
}) => {

    const [searchInput, setSearchInput] = useState(searchQuery);

    const handleSearchChange = (e: ChangeEvent<HTMLInputElement>) => {
        setSearchInput(e.target.value);
    };


    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setCurrentPage(1);
        setSearchQuery(searchInput.trim());
    };

    const handlePaginationChange = (
        newPage?: number,
        newRowsPerPage?: number
    ) => {
        const page = newPage ?? currentPage;
        const rows = newRowsPerPage ?? rowsPerPage;

        const clampedPage = Math.max(
            1,
            Math.min(page, Math.max(totalPages, 1))
        );

        const clampedRows = Math.max(1, rows);

        setCurrentPage(clampedPage);
        setRowsPerPage(clampedRows);
    };

    return (
        <Toolbar>
            <div style={styles.pageControls}>
                <Button
                    onClick={() => handlePaginationChange(1)}
                    disabled={currentPage === 1}
                >{`<<`}
                </Button>
                <Button
                    style={styles.pageButton} type="button"
                    onClick={() => handlePaginationChange(currentPage - 1)}
                    disabled={currentPage === 1}
                >{`<`}</Button>
                <Select
                    value={currentPage}
                    onChange={(e) =>
                        handlePaginationChange(Number(e.target.value))
                    }

                    options={Array.from(
                        { length: totalPages },
                        (_, i) => ({
                            label: `Page ${i + 1}`,
                            value: i + 1,
                        })
                    )}

                    style={{
                        width: "90px",
                    }}
                />
                <Button
                    style={styles.pageButton} type="button"
                    onClick={() => handlePaginationChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                >{`>`}</Button>
                <Button
                    style={styles.pageButton} type="button"
                    onClick={() => handlePaginationChange(totalPages)}
                    disabled={currentPage === totalPages}
                >{`>>`}</Button>
                {totalPages > 0 && (
                    <span style={{ marginLeft: '10px' }}>
                        Page {currentPage} of {totalPages}
                    </span>
                )}
            </div>
            <div style={styles.pageControls}>
                <h3 style={styles.label}>Rows per page:</h3>
                <Select
                    style={styles.pageInput}
                    value={rowsPerPage}
                    onChange={(e) => handlePaginationChange(1, Number(e.target.value))}
                    options={[
                        { label: "50", value: 50 },
                        { label: "100", value: 100 },
                        { label: "200", value: 200 },
                    ]}
                >
                </Select>
            </div>
            <div style={styles.pageControls}>
                <h3 style={styles.label}>Organization:</h3>

                <SearchableOrganizationPicker
                    organizations={organizations}
                    selectedId={organizationId}
                    onSelect={(id) => {
                        setOrganizationId(id);
                        setCurrentPage(1);
                    }}
                    placeholder="All Organizations"
                    clearLabel="All Organizations"
                    width="220px"
                />
            </div>
            <div style={styles.pageControls}>
                <form
                    onSubmit={handleSearchSubmit}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                    }}
                >
                    <h3 style={styles.label}>Search:</h3>
                    <Input
                        type="text"
                        placeholder="Search by name or email"
                        value={searchInput}
                        onChange={handleSearchChange}
                        style={{ width: "240px" }}
                        name="search"
                    />
                    <Button type="submit">
                        Search
                    </Button>
                </form>
            </div>
        </Toolbar>
    );
}

export default UserSearchControls;

const styles: { [key: string]: React.CSSProperties } = {
    pageControls: {
        display: "flex",

        alignItems: "center",

        gap: "12px",

        paddingRight: "20px",

        minHeight: "44px",
    },
    label: {
        fontFamily: "Inter, sans-serif",
        fontSize: "14px",
        fontWeight: 600,
        color: "#475569",
        margin: 0,
    },
};
