import { useEffect, useState } from "react";

import { getExamAnalytics } from "@/api/examsAPI";

import {
  ExamAnalyticsResponse,
  ExamFilters,
  ExamSort,
} from "@/interfaces/Exam";

type UseExamAnalyticsProps = {
  filters: ExamFilters;
  sort: ExamSort;
};

export default function useExamAnalytics({
  filters,
  sort,
}: UseExamAnalyticsProps) {

  const { sortBy, sortOrder } = sort;

  const [analytics, setAnalytics] =
    useState<ExamAnalyticsResponse>({
      distribution: {
      excellent: 0,
      good: 0,
      needsImprovement: 0,
      totalCompleted: 0,
    },
    mostMissedQuestions: [],
    });

  const [loading, setLoading] =
    useState(false);

  useEffect(() => {

    const fetchAnalytics = async () => {

      setLoading(true);

      try {

        const data =
          await getExamAnalytics({
            ...filters,
            sortBy,
            sortOrder,
          });

        setAnalytics(data);

      } catch (err) {

        console.error(
          "Failed to load analytics:",
          err
        );

      } finally {

        setLoading(false);

      }

    };

    fetchAnalytics();

  }, [
    filters,
    sortBy,
    sortOrder,
  ]);

  return {
    analytics,
    loading,
  };
}