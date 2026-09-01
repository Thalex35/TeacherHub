export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.17"
  }
  public: {
    Tables: {
      academic_periods: {
        Row: {
          academic_year_id: string
          created_at: string
          end_date: string
          id: string
          is_current: boolean
          name: string
          sort_order: number
          start_date: string
          status: string
          updated_at: string
        }
        Insert: {
          academic_year_id: string
          created_at?: string
          end_date: string
          id?: string
          is_current?: boolean
          name: string
          sort_order?: number
          start_date: string
          status?: string
          updated_at?: string
        }
        Update: {
          academic_year_id?: string
          created_at?: string
          end_date?: string
          id?: string
          is_current?: boolean
          name?: string
          sort_order?: number
          start_date?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "academic_periods_academic_year_id_fkey"
            columns: ["academic_year_id"]
            isOneToOne: false
            referencedRelation: "academic_years"
            referencedColumns: ["id"]
          },
        ]
      }
      academic_years: {
        Row: {
          created_at: string
          end_date: string
          id: string
          is_active: boolean
          is_current: boolean
          name: string
          start_date: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          end_date: string
          id?: string
          is_active?: boolean
          is_current?: boolean
          name: string
          start_date: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          end_date?: string
          id?: string
          is_active?: boolean
          is_current?: boolean
          name?: string
          start_date?: string
          updated_at?: string
        }
        Relationships: []
      }
      app_settings: {
        Row: {
          allow_grade_override: boolean
          created_at: string
          current_period_id: string | null
          current_year_id: string | null
          decimal_precision: number
          default_max_grade: number
          id: boolean
          is_demo_data: boolean
          school_info: string | null
          school_name: string
          teacher_name: string
          updated_at: string
        }
        Insert: {
          allow_grade_override?: boolean
          created_at?: string
          current_period_id?: string | null
          current_year_id?: string | null
          decimal_precision?: number
          default_max_grade?: number
          id?: boolean
          is_demo_data?: boolean
          school_info?: string | null
          school_name?: string
          teacher_name?: string
          updated_at?: string
        }
        Update: {
          allow_grade_override?: boolean
          created_at?: string
          current_period_id?: string | null
          current_year_id?: string | null
          decimal_precision?: number
          default_max_grade?: number
          id?: boolean
          is_demo_data?: boolean
          school_info?: string | null
          school_name?: string
          teacher_name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "app_settings_current_period_id_fkey"
            columns: ["current_period_id"]
            isOneToOne: false
            referencedRelation: "academic_periods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "app_settings_current_year_id_fkey"
            columns: ["current_year_id"]
            isOneToOne: false
            referencedRelation: "academic_years"
            referencedColumns: ["id"]
          },
        ]
      }
      assessments: {
        Row: {
          class_id: string
          created_at: string
          date: string
          description: string | null
          evaluation_type_id: string
          id: string
          instructions: string | null
          lesson_id: string | null
          max_grade: number
          period_id: string | null
          status: string
          title: string
          topic_id: string | null
          unit_id: string | null
          updated_at: string
          weight: number
        }
        Insert: {
          class_id: string
          created_at?: string
          date?: string
          description?: string | null
          evaluation_type_id: string
          id?: string
          instructions?: string | null
          lesson_id?: string | null
          max_grade?: number
          period_id?: string | null
          status?: string
          title: string
          topic_id?: string | null
          unit_id?: string | null
          updated_at?: string
          weight?: number
        }
        Update: {
          class_id?: string
          created_at?: string
          date?: string
          description?: string | null
          evaluation_type_id?: string
          id?: string
          instructions?: string | null
          lesson_id?: string | null
          max_grade?: number
          period_id?: string | null
          status?: string
          title?: string
          topic_id?: string | null
          unit_id?: string | null
          updated_at?: string
          weight?: number
        }
        Relationships: [
          {
            foreignKeyName: "assessments_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assessments_evaluation_type_id_fkey"
            columns: ["evaluation_type_id"]
            isOneToOne: false
            referencedRelation: "evaluation_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assessments_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assessments_period_id_fkey"
            columns: ["period_id"]
            isOneToOne: false
            referencedRelation: "academic_periods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assessments_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "topics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assessments_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      attendance: {
        Row: {
          class_id: string
          created_at: string
          id: string
          note: string | null
          session_date: string
          status: string
          student_id: string
          updated_at: string
        }
        Insert: {
          class_id: string
          created_at?: string
          id?: string
          note?: string | null
          session_date: string
          status?: string
          student_id: string
          updated_at?: string
        }
        Update: {
          class_id?: string
          created_at?: string
          id?: string
          note?: string | null
          session_date?: string
          status?: string
          student_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendance_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      calendar_events: {
        Row: {
          class_id: string | null
          created_at: string
          description: string | null
          end_time: string | null
          event_date: string
          event_type: string
          id: string
          start_time: string | null
          subject_id: string | null
          title: string
          updated_at: string
        }
        Insert: {
          class_id?: string | null
          created_at?: string
          description?: string | null
          end_time?: string | null
          event_date: string
          event_type?: string
          id?: string
          start_time?: string | null
          subject_id?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          class_id?: string | null
          created_at?: string
          description?: string | null
          end_time?: string | null
          event_date?: string
          event_type?: string
          id?: string
          start_time?: string | null
          subject_id?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "calendar_events_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "calendar_events_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      classes: {
        Row: {
          academic_year_id: string
          created_at: string
          id: string
          is_active: boolean
          name: string
          section: string | null
          sort_order: number
          subject_id: string
          teacher_id: string | null
          updated_at: string
        }
        Insert: {
          academic_year_id: string
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          section?: string | null
          sort_order?: number
          subject_id: string
          teacher_id?: string | null
          updated_at?: string
        }
        Update: {
          academic_year_id?: string
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          section?: string | null
          sort_order?: number
          subject_id?: string
          teacher_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "classes_academic_year_id_fkey"
            columns: ["academic_year_id"]
            isOneToOne: false
            referencedRelation: "academic_years"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "classes_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "classes_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
        ]
      }
      evaluation_types: {
        Row: {
          code: string
          created_at: string
          id: string
          is_active: boolean
          is_system: boolean
          name: string
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          is_active?: boolean
          is_system?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          is_active?: boolean
          is_system?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      final_grade_overrides: {
        Row: {
          created_at: string
          id: string
          period_id: string
          reason: string | null
          student_id: string
          updated_at: string
          value: number
        }
        Insert: {
          created_at?: string
          id?: string
          period_id: string
          reason?: string | null
          student_id: string
          updated_at?: string
          value: number
        }
        Update: {
          created_at?: string
          id?: string
          period_id?: string
          reason?: string | null
          student_id?: string
          updated_at?: string
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "final_grade_overrides_period_id_fkey"
            columns: ["period_id"]
            isOneToOne: false
            referencedRelation: "academic_periods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "final_grade_overrides_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      grade_weights: {
        Row: {
          created_at: string
          evaluation_type_id: string
          id: string
          period_id: string | null
          updated_at: string
          weight: number
        }
        Insert: {
          created_at?: string
          evaluation_type_id: string
          id?: string
          period_id?: string | null
          updated_at?: string
          weight?: number
        }
        Update: {
          created_at?: string
          evaluation_type_id?: string
          id?: string
          period_id?: string | null
          updated_at?: string
          weight?: number
        }
        Relationships: [
          {
            foreignKeyName: "grade_weights_evaluation_type_id_fkey"
            columns: ["evaluation_type_id"]
            isOneToOne: false
            referencedRelation: "evaluation_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "grade_weights_period_id_fkey"
            columns: ["period_id"]
            isOneToOne: false
            referencedRelation: "academic_periods"
            referencedColumns: ["id"]
          },
        ]
      }
      grades: {
        Row: {
          assessment_id: string
          comment: string | null
          created_at: string
          id: string
          score: number | null
          student_id: string
          updated_at: string
        }
        Insert: {
          assessment_id: string
          comment?: string | null
          created_at?: string
          id?: string
          score?: number | null
          student_id: string
          updated_at?: string
        }
        Update: {
          assessment_id?: string
          comment?: string | null
          created_at?: string
          id?: string
          score?: number | null
          student_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "grades_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "assessments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "grades_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      lessons: {
        Row: {
          assignment_minutes: number
          assignment_section: string | null
          class_id: string
          created_at: string
          demo_minutes: number
          description: string | null
          estimated_minutes: number
          id: string
          is_active: boolean
          notes: string | null
          objectives: string | null
          planned_date: string | null
          position: number
          practical: string | null
          review_minutes: number
          status: string
          theory: string | null
          theory_minutes: number
          title: string
          topic_id: string | null
          unit_id: string | null
          updated_at: string
        }
        Insert: {
          assignment_minutes?: number
          assignment_section?: string | null
          class_id: string
          created_at?: string
          demo_minutes?: number
          description?: string | null
          estimated_minutes?: number
          id?: string
          is_active?: boolean
          notes?: string | null
          objectives?: string | null
          planned_date?: string | null
          position?: number
          practical?: string | null
          review_minutes?: number
          status?: string
          theory?: string | null
          theory_minutes?: number
          title: string
          topic_id?: string | null
          unit_id?: string | null
          updated_at?: string
        }
        Update: {
          assignment_minutes?: number
          assignment_section?: string | null
          class_id?: string
          created_at?: string
          demo_minutes?: number
          description?: string | null
          estimated_minutes?: number
          id?: string
          is_active?: boolean
          notes?: string | null
          objectives?: string | null
          planned_date?: string | null
          position?: number
          practical?: string | null
          review_minutes?: number
          status?: string
          theory?: string | null
          theory_minutes?: number
          title?: string
          topic_id?: string | null
          unit_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lessons_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lessons_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "topics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lessons_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      students: {
        Row: {
          class_id: string
          created_at: string
          first_name: string
          id: string
          last_name: string
          status: string
          student_code: string
          updated_at: string
        }
        Insert: {
          class_id: string
          created_at?: string
          first_name: string
          id?: string
          last_name: string
          status?: string
          student_code: string
          updated_at?: string
        }
        Update: {
          class_id?: string
          created_at?: string
          first_name?: string
          id?: string
          last_name?: string
          status?: string
          student_code?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "students_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
        ]
      }
      subjects: {
        Row: {
          code: string | null
          color: string
          created_at: string
          id: string
          is_active: boolean
          name: string
          teacher_id: string | null
          updated_at: string
        }
        Insert: {
          code?: string | null
          color?: string
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          teacher_id?: string | null
          updated_at?: string
        }
        Update: {
          code?: string | null
          color?: string
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          teacher_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subjects_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
        ]
      }
      teachers: {
        Row: {
          created_at: string
          email: string | null
          full_name: string
          id: string
          is_active: boolean
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name: string
          id?: string
          is_active?: boolean
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string
          id?: string
          is_active?: boolean
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      topics: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          position: number
          title: string
          unit_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          position?: number
          title: string
          unit_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          position?: number
          title?: string
          unit_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "topics_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      units: {
        Row: {
          class_id: string
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          position: number
          title: string
          updated_at: string
        }
        Insert: {
          class_id: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          position?: number
          title: string
          updated_at?: string
        }
        Update: {
          class_id?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          position?: number
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "units_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
