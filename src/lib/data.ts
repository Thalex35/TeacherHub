import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import type {
  AcademicPeriod,
  AcademicYear,
  AppSettings,
  Assessment,
  Attendance,
  CalendarEvent,
  EvaluationType,
  FinalGradeOverride,
  Grade,
  GradeWeight,
  Klass,
  Lesson,
  Student,
  Subject,
  Teacher,
  Topic,
  Unit,
} from "./types";

type TableName =
  | "teachers"
  | "subjects"
  | "academic_years"
  | "academic_periods"
  | "classes"
  | "students"
  | "units"
  | "topics"
  | "lessons"
  | "evaluation_types"
  | "assessments"
  | "grades"
  | "attendance"
  | "calendar_events"
  | "grade_weights"
  | "final_grade_overrides"
  | "app_settings";

async function selectAll<R>(table: TableName, order?: { column: string; ascending?: boolean }[]) {
  let q = supabase.from(table).select("*");
  for (const o of order ?? []) q = q.order(o.column, { ascending: o.ascending ?? true });
  const { data, error } = await q;
  if (error) throw new Error(error.message);
  return (data ?? []) as R[];
}

function list<R>(
  key: TableName,
  order?: { column: string; ascending?: boolean }[],
  enabled = true,
) {
  return { queryKey: [key], queryFn: () => selectAll<R>(key, order), enabled };
}

export const useTeachers = () => useQuery(list<Teacher>("teachers", [{ column: "full_name" }]));
export const useSubjects = () => useQuery(list<Subject>("subjects", [{ column: "name" }]));
export const useYears = () =>
  useQuery(list<AcademicYear>("academic_years", [{ column: "start_date", ascending: false }]));
export const usePeriods = () =>
  useQuery(list<AcademicPeriod>("academic_periods", [{ column: "sort_order" }]));
export const useClasses = () =>
  useQuery(list<Klass>("classes", [{ column: "sort_order" }, { column: "name" }]));
export const useStudents = () =>
  useQuery(list<Student>("students", [{ column: "last_name" }, { column: "first_name" }]));
export const useUnits = () => useQuery(list<Unit>("units", [{ column: "position" }]));
export const useTopics = () => useQuery(list<Topic>("topics", [{ column: "position" }]));
export const useLessons = () =>
  useQuery(list<Lesson>("lessons", [{ column: "position" }, { column: "planned_date" }]));
export const useEvaluationTypes = () =>
  useQuery(list<EvaluationType>("evaluation_types", [{ column: "created_at" }]));
export const useAssessments = () =>
  useQuery(list<Assessment>("assessments", [{ column: "date", ascending: false }]));
export const useGrades = () => useQuery(list<Grade>("grades"));
export const useAttendance = () =>
  useQuery(list<Attendance>("attendance", [{ column: "session_date", ascending: false }]));
export const useEvents = () =>
  useQuery(list<CalendarEvent>("calendar_events", [{ column: "event_date" }]));
export const useGradeWeights = () => useQuery(list<GradeWeight>("grade_weights"));
export const useOverrides = () => useQuery(list<FinalGradeOverride>("final_grade_overrides"));

export function useSettings() {
  return useQuery({
    queryKey: ["app_settings"],
    queryFn: async () => {
      const { data, error } = await supabase.from("app_settings").select("*").maybeSingle();
      if (error) throw new Error(error.message);
      return data as AppSettings | null;
    },
  });
}

/** Generic write helpers — all invalidate the matching cache key. */
export function useUpsert(table: TableName, onConflict?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (rows: Record<string, unknown> | Record<string, unknown>[]) => {
      const { error } = await supabase
        .from(table)
        .upsert(rows as never, onConflict ? { onConflict } : undefined);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: [table] });
      if (table === "app_settings") void qc.invalidateQueries({ queryKey: ["app_settings"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useInsert(table: TableName) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (row: Record<string, unknown>) => {
      const { data, error } = await supabase
        .from(table)
        .insert(row as never)
        .select()
        .single();
      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: [table] }),
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useUpdate(table: TableName) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, values }: { id: string; values: Record<string, unknown> }) => {
      const { error } = await supabase
        .from(table)
        .update(values as never)
        .eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: [table] });
      if (table === "app_settings") void qc.invalidateQueries({ queryKey: ["app_settings"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useRemove(table: TableName) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from(table).delete().eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: [table] }),
    onError: (e: Error) => toast.error(e.message),
  });
}
