import styles from './QuizScores.module.css';
import { QuizScoreInterface } from '../../interfaces/UserDataInterface';
import { useState, useEffect} from 'react';

interface QuizScoresProps {
    quizScores: QuizScoreInterface[];
    viewMode?: 'view' | 'edit';
    quizYears?: number[];
}

//columns for quiz scores table
const columns = [
    { key: "module_id", label: "Module ID" },
    { key: "module_name", label: "Module Name" },
    { key: "date_taken", label: "Date Taken" },
    { key: "score", label: "Score" },
];


const QuizScores = ({ quizScores, viewMode, quizYears }: QuizScoresProps) => {

    const [selectedYear, setSelectedYear] = useState<number | null>(quizYears && quizYears.length > 0 ? quizYears[0] : null);
    const [filteredQuizScores, setFilteredQuizScores] = useState<QuizScoreInterface[]>(quizScores);

    const handleYearChange = (year: number | null) => {
        // Logic to filter quizScores based on selected year
        setSelectedYear(year);
        if (year !== null) {
            setFilteredQuizScores(quizScores.filter(score => new Date(score.date_taken).getFullYear() === year));
        } else {
            setFilteredQuizScores(quizScores);
        }
    }


    useEffect(() => {
        if (quizYears && quizYears.length > 0 && selectedYear === null) {
            setSelectedYear(quizYears[0]);
            setFilteredQuizScores(quizScores.filter(score => new Date(score.date_taken).getFullYear() === quizYears[0]));
        }
    }, [quizYears, selectedYear]);

    if (quizYears?.length === 0) {
        return <p className={styles.noData}>This user has not completed any quizzes.</p>;
    }


    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h2 className={styles.heading}>Quiz Scores</h2>
                <div className={styles.yearSelectContainer}>
                    <h2 className={styles.heading}>Select Year</h2>
                    <select 
                        className={styles.yearSelect}
                        value={selectedYear ?? ''}
                        onChange={(e) => handleYearChange(e.target.value ? parseInt(e.target.value) : null)}
                    >
                        {/* <option value=''>All Years</option> */}
                        {quizYears && quizYears.map((year) => (
                            <option key={year} value={year}>{year}</option>
                        ))}
                    </select>
                </div>

            </div>
            {<div className={styles.quizScoresWrapper}>
                {filteredQuizScores && filteredQuizScores.length > 0 ? (
                    <table className={styles.table}>
                        <thead className={styles.tableHead}>
                            <tr className={styles.headerRow}>
                                {columns.map((column) => (
                                    <th key={column.key} className={styles.headerCell}>
                                        {column.label}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className={styles.tableBody}>
                            {filteredQuizScores.map((score, index) => (
                                <tr
                                    key={index}
                                    className={`${styles.row} ${index % 2 === 0 ? styles.evenRow : styles.oddRow
                                        }`}
                                >
                                    <td className={styles.cell}>{score.module.module_id}</td>
                                    <td className={styles.cell}>{score.module.name}</td>
                                    <td className={styles.cell}>
                                        {new Date(score.date_taken).toLocaleDateString()}
                                    </td>
                                    <td className={styles.cell}>{score.score}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <p className={styles.noData}>No quiz scores available.</p>
                )}
            </div>}
        </div>

    );
};

export default QuizScores;