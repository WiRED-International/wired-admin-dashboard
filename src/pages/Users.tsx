import PageHeader from "../components/ui/PageHeader";
import PageContainer from "../components/ui/PageContainer";
import Panel from "../components/ui/Panel";
import UserSearchControls from "../components/UserSearchControls";
import UsersTable from "../components/UserTable/UsersTable";
import { UserDataInterface, UserSearchBroadResponse } from "../interfaces/UserDataInterface";
import { searchUsersBroad } from "../api/usersAPI";
import { useEffect, useState } from "react";
import LoadingSpinner from "../components/LoadingSpinner/LoadingSpinner";



const UsersPage = () => {
  const [users, setUsers] = useState<UserDataInterface[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [rowsPerPage, setRowsPerPage] = useState<number>(50);
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
      console.log(
        "📦 users fetched:",
        fetchedUsers.users?.length,
        "rowsPerPage:",
        rowsPerPage,
        "sortBy:",
        sortBy,
        "sortOrder:",
        sortOrder
      );
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllUsers();
  }, [sortBy, sortOrder, currentPage, rowsPerPage]);

  
  return (
  
    <>

      {loading && <LoadingSpinner />}
      {/* <DashboardHeader /> */}
      <PageContainer>

        <Panel>

          <PageHeader
            title="Registered Users"
            subtitle="Manage users, roles, CME progress, and account activity."
          />
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
        </Panel>
      </PageContainer>
    </>
  );
}
export default UsersPage;
