import styles from './QuizScores.module.css';
import { QuizScoreInterface } from '../../interfaces/UserDataInterface';
import { useState, useEffect } from 'react';
import Alert_Custom from '../AlertCustom';

interface QuizScoresProps {
    quizScores: QuizScoreInterface[];
    viewMode?: 'view' | 'edit';
    quizYears?: number[];
    setQuizScores: React.Dispatch<React.SetStateAction<QuizScoreInterface[]>>;
    selectedYear: number | null;
    setSelectedYear: React.Dispatch<React.SetStateAction<number | null>>;
    filteredQuizScores: QuizScoreInterface[];
    setFilteredQuizScores: React.Dispatch<React.SetStateAction<QuizScoreInterface[]>>;
}

//columns for quiz scores table
const columns = [
    { key: "module_id", label: "Module ID" },
    { key: "module_name", label: "Module Name" },
    { key: "date_taken", label: "Date Taken" },
    { key: "score", label: "Score" },
];


const QuizScores = ({ quizScores, viewMode, quizYears, setQuizScores, selectedYear, setSelectedYear, filteredQuizScores, setFilteredQuizScores }: QuizScoresProps) => {


  
    const [alertMessage, setAlertMessage] = useState<string | null>(null);


    const handleYearChange = (year: number | null) => {
        // Logic to filter quizScores based on selected year
        setSelectedYear(year);
        if (year !== null) {
            setFilteredQuizScores(quizScores.filter(score => new Date(score.date_taken).getFullYear() === year));
        } else {
            setFilteredQuizScores(quizScores);
        }
    }

    const handleAlertClose = () => {
        setAlertMessage(null);
    }

    const handleScoreChange = (id: number, newScore: number) => {
        if (isNaN(newScore) || newScore < 0 || newScore > 100) {
            setAlertMessage("Please enter a valid score between 0 and 100 (2 decimal places).");
            return;
        }
        setQuizScores(prevScores =>
            prevScores.map((score) =>
                score.id === id ? { ...score, score: newScore } : score
            )
        );
        // const updatedScores = [...filteredQuizScores];
        // updatedScores[index].score = newScore;
        // setFilteredQuizScores(prevScores =>
        //     prevScores.map((score, i) =>
        //         i === index ? { ...score, score: newScore } : score
        //     )
        // );

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
            {alertMessage && <Alert_Custom message={alertMessage} onClose={handleAlertClose} />}
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
                            <tr>
                                {columns.map((column) => (
                                    <th key={column.key} className={styles.headerCell}>
                                        {column.label}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {filteredQuizScores.map((score, index) => (
                                <tr
                                    key={`index-${index}-${selectedYear}`}//forces the input to reset when year changes
                                    className={`${styles.row} ${index % 2 === 0 ? styles.evenRow : styles.oddRow
                                        }`}
                                >
                                    <td className={styles.cell}>{score.module.module_id}</td>
                                    <td className={styles.cell}>{score.module.name}</td>
                                    <td className={styles.cell}>
                                        {new Date(score.date_taken).toLocaleDateString()}
                                    </td>
                                    {viewMode === 'edit' ? (
                                        <td className={styles.cell}>
                                            <form
                                                onSubmit={(e) => {
                                                    e.preventDefault();
                                                    const formData = new FormData(e.currentTarget);
                                                    const newScore = Number(formData.get('score'));
    
                                                    handleScoreChange(index, newScore);
                                            
                                                }}
                                            >
                                                <input
                                                    name="score"
                                                    className={styles.scoreInput}
                                                    defaultValue={score.score}
                                                    onBlur={(e) => {
                                                        const newScore = Number(e.target.value);
                                                        handleScoreChange(score.id, newScore);
    
                                                    }}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter') {
                                                            e.preventDefault();
                                                            e.currentTarget.blur(); // <-- Manually blur
                                                        }
                                                    }}
                                                />
                                            </form>
                                        </td>
                                    ) : (
                                        <td className={styles.cell}>{score.score}</td>
                                    )}
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