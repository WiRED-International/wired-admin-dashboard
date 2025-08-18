import styles from './SortButtons.module.css';
import classNames from 'classnames';

interface SortButtonsProps {
    columnKey: string;
    sortBy?: string | null;
    sortOrder?: 'ASC' | 'DESC';
}

const SortButtons: React.FC<SortButtonsProps> = ({ columnKey, sortBy, sortOrder }) => {
    const isSorted = sortBy === columnKey;
    const isAscending = sortOrder === 'ASC';
    
    return (
      <div className={styles.container}>
        <div className={styles.user_table_head_text}>
          <div className={styles.sort_triangle_container}>
            <svg
              className={classNames(styles.sort_triangle, {
                [styles.sort_triangle_active]: isSorted && isAscending,
              })}
              width="14"
              height="11"
              viewBox="0 0 14 11"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M7 0L13.0622 10.5H0.937822L7 0Z" />
            </svg>
            <svg
              className={classNames(styles.sort_triangle, {
                [styles.sort_triangle_desc]: true,
                [styles.sort_triangle_active]: isSorted && !isAscending,
              })}
              width="14"
              height="11"
              viewBox="0 0 14 11"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M7 0L13.0622 10.5H0.937822L7 0Z" />
            </svg>
          </div>
        </div>
      </div>
    );
}

export default SortButtons;
