import deleteIcon from '/icons/delete.png'
import editIcon from '/icons/edit_icon.png'
import greenEyeIcon from '/icons/green_eye_icon.png'
import { UserDataInterface } from '../../interfaces/UserDataInterface'
import SingleUserView from './SingleUserView'
import { useState } from 'react'

interface UserTableActionsProps {
  user: UserDataInterface;
}

const UserTableActions = ({user}: UserTableActionsProps) => {

  const [isSingleUserViewOpen, setIsSingleUserViewOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'view' | 'edit'>('view');

  return (
    <div style={styles.container}>
      {isSingleUserViewOpen && (
        <SingleUserView 
          user={user} 
          setIsSingleUserViewOpen={setIsSingleUserViewOpen} 
          viewMode={viewMode} 
          setViewMode={setViewMode} 
        />
      )}
      <div style={styles.actionContainer} onClick={() => {
        setViewMode('view');
        setIsSingleUserViewOpen(true);
      }}>
        <img src={greenEyeIcon} style={styles.icon} alt="View" />
        <span style={styles.actionText}>View</span>
      </div>
      <div style={styles.actionContainer} onClick={() => {
        setViewMode('edit');
        setIsSingleUserViewOpen(true);
      }}>
        <img src={editIcon} style={styles.icon} alt="Edit" />
        <span style={styles.actionText}>Edit</span>
      </div>
      <div style={styles.actionContainer}>
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