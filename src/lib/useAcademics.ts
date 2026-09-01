import { useMemo } from "react";

import { computeFinalGrade, normalise, avg, round } from "./calc";
import {
  useAssessments,
  useClasses,
  useEvaluationTypes,
  useGradeWeights,
  useGrades,
  useOverrides,
  usePeriods,
  useSettings,
  useStudents,
} from "./data";

/** Shared academic dataset + derived averages used across modules. */
export function useAcademics() {
  const classes = useClasses();
  const students = useStudents();
  const assessments = useAssessments();
  const grades = useGrades();
  const types = useEvaluationTypes();
  const weights = useGradeWeights();
  const periods = usePeriods();
  const settings = useSettings();
  const overrides = useOverrides();

  const scale = Number(settings.data?.default_max_grade ?? 10);
  const precision = settings.data?.decimal_precision ?? 2;

  const loading =
    classes.isLoading ||
    students.isLoading ||
    assessments.isLoading ||
    grades.isLoading ||
    types.isLoading;

  const derived = useMemo(() => {
    const allGrades = grades.data ?? [];
    const allAssessments = assessments.data ?? [];
    const assessmentById = new Map(allAssessments.map((a) => [a.id, a]));

    const studentAverage = (studentId: string, periodId?: string | null) => {
      const scores = allGrades
        .filter((g) => g.student_id === studentId && g.score !== null)
        .map((g) => ({ g, a: assessmentById.get(g.assessment_id) }))
        .filter(
          (x) => x.a && (!periodId || x.a.period_id === periodId),
        )
        .map((x) => normalise(Number(x.g.score), Number(x.a!.max_grade), scale));
      const a = avg(scores);
      return a === null ? null : round(a, precision);
    };

    const classAverage = (classId: string, periodId?: string | null) => {
      const ids = new Set(
        (students.data ?? []).filter((s) => s.class_id === classId).map((s) => s.id),
      );
      const values = [...ids].map((id) => studentAverage(id, periodId)).filter((v) => v !== null);
      const a = avg(values as number[]);
      return a === null ? null : round(a, precision);
    };

    const assessmentAverage = (assessmentId: string) => {
      const a = assessmentById.get(assessmentId);
      if (!a) return null;
      const scores = allGrades
        .filter((g) => g.assessment_id === assessmentId && g.score !== null)
        .map((g) => normalise(Number(g.score), Number(a.max_grade), scale));
      const v = avg(scores);
      return v === null ? null : round(v, precision);
    };

    const finalGrade = (studentId: string, periodId: string) => {
      const periodAssessments = allAssessments.filter((a) => a.period_id === periodId);
      const ids = new Set(periodAssessments.map((a) => a.id));
      const result = computeFinalGrade({
        grades: allGrades.filter((g) => g.student_id === studentId && ids.has(g.assessment_id)),
        assessments: periodAssessments,
        types: types.data ?? [],
        weights: (weights.data ?? []).filter((w) => w.period_id === null || w.period_id === periodId),
        scale,
        precision,
      });
      const override = (overrides.data ?? []).find(
        (o) => o.student_id === studentId && o.period_id === periodId,
      );
      return {
        ...result,
        overridden: Boolean(override),
        value: override ? Number(override.value) : result.final,
      };
    };

    return { studentAverage, classAverage, assessmentAverage, finalGrade };
  }, [grades.data, assessments.data, students.data, types.data, weights.data, overrides.data, scale, precision]);

  return {
    loading,
    scale,
    precision,
    classes: classes.data ?? [],
    students: students.data ?? [],
    assessments: assessments.data ?? [],
    grades: grades.data ?? [],
    types: types.data ?? [],
    weights: weights.data ?? [],
    periods: periods.data ?? [],
    overrides: overrides.data ?? [],
    settings: settings.data ?? null,
    ...derived,
  };
}
