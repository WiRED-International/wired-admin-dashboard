import { useEffect, useState } from "react";

import { getAllExamResults } from "@/api/examsAPI";

import {
  AllExamResultItem,
  ExamFilters,
  ExamSort,
} from "@/interfaces/Exam";

type UseExamResultsProps = {
  page: number;
  filters: ExamFilters;
  sort: ExamSort;
};

export default function useExamResults({
  page,
  filters,
  sort,
}: UseExamResultsProps) {

  const { sortBy, sortOrder } = sort;

  const [results, setResults] = useState<AllExamResultItem[]>([]);

  const [totalPages, setTotalPages] = useState<number>(1);

  const [loading, setLoading] = useState(false);

  useEffect(() => {

    const fetchData = async () => {

      setLoading(true);

      try {

        const data = await getAllExamResults({
          page,
          ...filters,
          sortBy,
          sortOrder,
        });

        setResults(data.results);

        setTotalPages(data.totalPages);

      } catch (err) {

        console.error("Failed to load exam results:", err);

      } finally {

        setLoading(false);
      }
    };

    fetchData();

  }, [page, filters, sort]);

  return {
    results,
    totalPages,
    loading,
  };
}