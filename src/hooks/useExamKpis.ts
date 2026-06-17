import { useEffect, useState } from "react";

import { getExamKpis } from "@/api/examsAPI";

import {
  ExamFilters,
  ExamSort,
  ExamKpiResponse,
} from "@/interfaces/Exam";

type UseExamKpisProps = {
  filters: ExamFilters;
  sort: ExamSort;
};

export default function useExamKpis({
  filters,
  sort,
}: UseExamKpisProps) {

  const { sortBy, sortOrder } = sort;

  const [kpis, setKpis] =
    useState<ExamKpiResponse>({
      totalAttempts: 0,
      averageScore: 0,
      passRate: 0,
      activeExams: 0,
    });

  const [loading, setLoading] =
    useState(false);

  useEffect(() => {

    const fetchKpis = async () => {

      setLoading(true);

      try {

        const data =
          await getExamKpis({
            ...filters,
            sortBy,
            sortOrder,
          });

        setKpis(data);

      } catch (err) {

        console.error(
          "Failed to load KPI metrics:",
          err
        );

      } finally {

        setLoading(false);

      }

    };

    fetchKpis();

  }, [
    filters,
    sortBy,
    sortOrder,
  ]);

  return {
    kpis,
    loading,
  };

}