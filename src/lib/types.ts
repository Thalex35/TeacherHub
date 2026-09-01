import type { Database } from "@/integrations/supabase/types";

type T = Database["public"]["Tables"];

export type Teacher = T["teachers"]["Row"];
export type Subject = T["subjects"]["Row"];
export type AcademicYear = T["academic_years"]["Row"];
export type AcademicPeriod = T["academic_periods"]["Row"];
export type Klass = T["classes"]["Row"];
export type Student = T["students"]["Row"];
export type Unit = T["units"]["Row"];
export type Topic = T["topics"]["Row"];
export type Lesson = T["lessons"]["Row"];
export type EvaluationType = T["evaluation_types"]["Row"];
export type Assessment = T["assessments"]["Row"];
export type Grade = T["grades"]["Row"];
export type Attendance = T["attendance"]["Row"];
export type CalendarEvent = T["calendar_events"]["Row"];
export type GradeWeight = T["grade_weights"]["Row"];
export type FinalGradeOverride = T["final_grade_overrides"]["Row"];
export type AppSettings = T["app_settings"]["Row"];

export const LESSON_STATUSES = ["planned", "in_progress", "completed", "skipped"] as const;
export const ATTENDANCE_STATUSES = ["present", "absent", "late", "excused"] as const;
export const EVENT_TYPES = [
  "class",
  "assignment",
  "quiz",
  "test",
  "exam",
  "practical",
  "project",
  "other",
] as const;
