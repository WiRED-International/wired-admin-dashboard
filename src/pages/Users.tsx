import DashboardHeader from "../components/DashboardHeader";
import UserSearchControls from "../components/UserSearchControls";
import UsersTable from "../components/UserTable/UsersTable";
import Confirm_custom from "../components/UserTable/Confirm_custom";
import { globalStyles } from "../globalStyles";
import { UserDataInterface, UserSearchBroadResponse } from "../interfaces/UserDataInterface";
import { searchUsersBroad } from "../api/usersAPI";
import { useEffect, useState } from "react";
import LoadingSpinner from "../components/LoadingSpinner/LoadingSpinner";



const UsersPage = () => {
  const [users, setUsers] = useState<UserDataInterface[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [rowsPerPage, setRowsPerPage] = useState<number>(10);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [sortBy, setSortBy] = useState<string | null>('last_name');
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('ASC');
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState<boolean>(false);

  const fetchAllUsers = async () => {
    setLoading(true);
    try {
      const fetchedUsers: UserSearchBroadResponse = await searchUsersBroad(
        searchQuery,
        Number(currentPage),
        Number(rowsPerPage),
        sortBy,
        sortOrder
      );
      setUsers(fetchedUsers.users || []);
      setTotalPages(fetchedUsers.pageCount || 0);
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllUsers();
  }, [sortBy, sortOrder, currentPage]);

  
  return (
  
    <div style={globalStyles.pageContainer}>

      {loading && <LoadingSpinner />}
      <DashboardHeader />
      <div style={styles.usersContainer}>
        <h1 style={styles.userHeader}>Registered Users</h1>
        <UserSearchControls
          currentPage={currentPage}
          rowsPerPage={rowsPerPage}
          setCurrentPage={setCurrentPage}
          setRowsPerPage={setRowsPerPage}
          totalPages={totalPages}
          setTotalPages={setTotalPages}
          setUsers={setUsers}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          sortBy={sortBy}
          sortOrder={sortOrder}
        />
        <UsersTable
          users={users}
          sortBy={sortBy}
          sortOrder={sortOrder}
          setSortBy={setSortBy}
          setSortOrder={setSortOrder}
          setCurrentPage={setCurrentPage}
          fetchAllUsers={fetchAllUsers}
          isDeleteConfirmOpen={isDeleteConfirmOpen}
          setIsDeleteConfirmOpen={setIsDeleteConfirmOpen}
        />
      </div>
    </div>
  );
}
export default UsersPage;

const styles: { [key: string]: React.CSSProperties } = {
  usersContainer: {
    padding: "20px",
    backgroundColor: "#E4E4E4",
    width: "100%",
    height: "100%",
    overflowY: "auto",
  },
  usersHeader: {
    fontFamily: 'inter',
    fontWeight: 'bolder',
    fontSize: "48px",
  }
}
