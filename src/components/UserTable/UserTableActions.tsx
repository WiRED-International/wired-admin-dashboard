import deleteIcon from '/icons/delete.png'
import editIcon from '/icons/edit_icon.png'
import greenEyeIcon from '/icons/green_eye_icon.png'
import { UserDataInterface } from '../../interfaces/UserDataInterface'
import SingleUserView from './SingleUserView'
import { useState } from 'react'
import { deleteUserById } from '../../api/usersAPI'
import Confirm_custom from './Confirm_custom'


interface UserTableActionsProps {
  user: UserDataInterface;
  fetchAllUsers: () => void;
}

const UserTableActions = ({user, fetchAllUsers}: UserTableActionsProps) => {

  const [isSingleUserViewOpen, setIsSingleUserViewOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'view' | 'edit'>('view');
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

  const handleViewClick = () => {
    setViewMode('view');
    setIsSingleUserViewOpen(true);
  };

  const handleEditClick = () => {
    setViewMode('edit');
    setIsSingleUserViewOpen(true);
  };

  const handleDeleteClick = () => {
    setIsDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    try {
      await deleteUserById(user.id);
      fetchAllUsers();
    } catch (error) {
      console.error("Error deleting user:", error);
    } finally {
      setIsDeleteConfirmOpen(false);
    }
  }

  return (
    <div style={styles.container}>
      <Confirm_custom
        message="Are you sure you want to delete this user?"
        onConfirm={confirmDelete}
        onCancel={() => setIsDeleteConfirmOpen(false)}
        isOpen={isDeleteConfirmOpen}
      />
      {isSingleUserViewOpen && (
        <SingleUserView
          user={user}
          setIsSingleUserViewOpen={setIsSingleUserViewOpen}
          viewMode={viewMode}
          setViewMode={setViewMode}
        />
      )}
      <div style={styles.actionContainer} onClick={handleViewClick}>
        <img src={greenEyeIcon} style={styles.icon} alt="View" />
        <span style={styles.actionText}>View</span>
      </div>
      <div style={styles.actionContainer} onClick={handleEditClick}>
        <img src={editIcon} style={styles.icon} alt="Edit" />
        <span style={styles.actionText}>Edit</span>
      </div>
      <div style={styles.actionContainer} onClick={handleDeleteClick}>
        <img src={deleteIcon} style={styles.icon} alt="Delete" />
        <span style={styles.actionText}>Delete</span>
      </div>
    </div>
  );
}
export default UserTableActions;

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
  },
  icon: {
    height: '20px',
  },
  actionContainer:{
    display: 'flex',
    alignItems: 'center',
    cursor: 'pointer',
    gap: '5px',
  },
  actionText: {
    color: '#2E83F3',
    fontSize: '20px',
  }
}