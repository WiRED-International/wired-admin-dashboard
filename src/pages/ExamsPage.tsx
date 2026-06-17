import { useEffect, useState } from "react";
import ExamsHeader from "../components/Exams/ExamsHeader";
import ExamFilters from "../components/Exams/ExamFilters";
import KpiCards from "../components/Exams/KpiCards";
import UpcomingExams from "../components/Exams/UpcomingExams";
import PerformanceChart from "../components/Exams/PerformanceChart";
import AllExamsTable from "../components/Exams/AllExamsTable";
import { ExamFilters as ExamFiltersType } from "@/interfaces/Exam";
import useExamResults from "@/hooks/useExamResults";
import { ExamSort } from "@/interfaces/Exam";
import useExamKpis from "@/hooks/useExamKpis";
import useExamAnalytics from "@/hooks/useExamAnalytics";
import MostMissedQuestions from "../components/Exams/MostMissedQuestions";

export default function ExamsPage() {

  // 🔹 Filters
  const [filters, setFilters] = useState<ExamFiltersType>({
    examId: null,
    orgId: null,
    status: null,
    limit: 50,
    dateFrom: null,
    dateTo: null,
  });

  useEffect(() => {
    setPage(1);
  }, [filters]);

  // 🔹 Pagination
  const [page, setPage] = useState<number>(1);

  // Sorting
  const [sort, setSort] = useState<ExamSort>({
    sortBy: null,
    sortOrder: "ASC",
  });

  // 🔹 Fetch data whenever filters or page change
  const {
    results,
    totalPages,
    loading,
  } = useExamResults({
    page,
    filters,
    sort,
  });

  const { kpis } = useExamKpis({
    filters,
    sort,
  });

  const { analytics } = useExamAnalytics({
    filters,
    sort,
  });

  return (
    <div style={styles.container}>

      <ExamsHeader />

      {/* 🔹 FILTERS */}
      <ExamFilters
        filters={filters}
        setFilters={setFilters}
      />

      <KpiCards
        kpis={kpis}
      />

      <div style={styles.middleRow}>
        <div style={styles.leftColumn}>
          <UpcomingExams />
        </div>
        <div style={styles.rightColumn}>

          <PerformanceChart
            analytics={analytics}
          />

        </div>
      </div>

      {/* 🔹 TABLE WITH PAGINATION */}
      <AllExamsTable
        loading={loading}
        results={results}
        page={page}
        setPage={setPage}
        totalPages={totalPages}
        sort={sort}
        setSort={setSort}
      />
      <MostMissedQuestions
        questions={analytics.mostMissedQuestions}
      />

    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    display: "flex",
    flexDirection: "column",
    gap: "25px",
    paddingLeft: "20px",
    paddingRight: "20px",
    paddingTop: "15px",
    paddingBottom: "20px"
  },
  middleRow: {
    display: "flex",
    gap: "20px",
    width: "100%",
  },
  leftColumn: { flex: 2 },
  rightColumn: { flex: 1 },
};