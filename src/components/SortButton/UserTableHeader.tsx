import styles from './UserTableHeader.module.css';

interface UserTableHeaderProps {
    actionKey: string;
    columnKey: string;
}

const UserTableHeader: React.FC<UserTableHeaderProps> = ({ columnKey }) => {
    return (
            <div 
                className={styles.container}
            >

                    <div className={styles.user_table_head_text}>
                        {columnKey !== 'actions' && (
                            <div className={styles.sort_triangle_container} >
                                <svg
                                    className={styles.sort_triangle}
                                    width="14" height="11" viewBox="0 0 14 11" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M7 0L13.0622 10.5H0.937822L7 0Z" fill="#898989" />
                                </svg>
                                <svg className={styles.sort_triangle_desc} width="14" height="11" viewBox="0 0 14 11" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M7 0L13.0622 10.5H0.937822L7 0Z" fill="#898989" />
                                </svg>

                            </div>
                        )}
                    </div>
        

            </div>


    );
}

export default UserTableHeader;
