import DashboardHeader from "../components/DashboardHeader";
import UserSearchControls from "../components/UserSearchControls";
import UsersTable from "../components/UserTable/UsersTable";
import { globalStyles } from "../globalStyles";
import { UserDataInterface } from "../interfaces/UserDataInterface";
import { fetchUsers } from "../api/usersAPI";
import { useEffect, useState } from "react";
import LoadingSpinner from "../components/LoadingSpinner/LoadingSpinner";



const UsersPage = () => {
  const [users, setUsers] = useState<UserDataInterface[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [currentPage, setCurrentPage] = useState<string>("1");
  const [rowsPerPage, setRowsPerPage] = useState<string>("10");
  const [totalPages, setTotalPages] = useState<number>(0);

  useEffect(() => {
    setLoading(true);
    const fetchAllUsers = async () => {
      try {
        const fetchedUsers = await fetchUsers();
        setUsers(fetchedUsers);
      } catch (error) {
        console.error("Error fetching users:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAllUsers();
  }, []);


  
  return (
  
    <div style={globalStyles.pageContainer}>
      {loading && <LoadingSpinner />}
      <DashboardHeader />
      <div style={styles.usersContainer}>
        <h1 style={styles.userHeader}>Registered Users</h1>
        <UserSearchControls
          users={users}
          currentPage={currentPage}
          rowsPerPage={rowsPerPage}
          setCurrentPage={setCurrentPage}
          setRowsPerPage={setRowsPerPage}
          totalPages={totalPages}
          setTotalPages={setTotalPages}
          setUsers={setUsers}
        />
        <UsersTable
          users={users}
          currentPage={currentPage}
          rowsPerPage={rowsPerPage}
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
