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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      announcements: {
        Row: {
          content: string
          created_at: string
          id: string
          title: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          title: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          title?: string
        }
        Relationships: []
      }
      assignment_submissions: {
        Row: {
          assignment_id: string
          feedback: string | null
          file_url: string | null
          id: string
          note: string | null
          score: number | null
          status: string
          student_id: string
          submitted_at: string
        }
        Insert: {
          assignment_id: string
          feedback?: string | null
          file_url?: string | null
          id?: string
          note?: string | null
          score?: number | null
          status?: string
          student_id: string
          submitted_at?: string
        }
        Update: {
          assignment_id?: string
          feedback?: string | null
          file_url?: string | null
          id?: string
          note?: string | null
          score?: number | null
          status?: string
          student_id?: string
          submitted_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "assignment_submissions_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "assignments"
            referencedColumns: ["id"]
          },
        ]
      }
      assignments: {
        Row: {
          class_id: string
          created_at: string
          description: string | null
          due_date: string | null
          id: string
          max_score: number
          title: string
        }
        Insert: {
          class_id: string
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          max_score?: number
          title: string
        }
        Update: {
          class_id?: string
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          max_score?: number
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "assignments_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
        ]
      }
      attendance: {
        Row: {
          class_id: string | null
          created_at: string
          date: string
          id: string
          status: string
          student_id: string
        }
        Insert: {
          class_id?: string | null
          created_at?: string
          date?: string
          id?: string
          status?: string
          student_id: string
        }
        Update: {
          class_id?: string | null
          created_at?: string
          date?: string
          id?: string
          status?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendance_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
        ]
      }
      class_schedules: {
        Row: {
          class_id: string
          created_at: string
          day_of_week: number
          end_time: string
          id: string
          start_time: string
          subject: string
        }
        Insert: {
          class_id: string
          created_at?: string
          day_of_week: number
          end_time: string
          id?: string
          start_time: string
          subject: string
        }
        Update: {
          class_id?: string
          created_at?: string
          day_of_week?: number
          end_time?: string
          id?: string
          start_time?: string
          subject?: string
        }
        Relationships: [
          {
            foreignKeyName: "class_schedules_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
        ]
      }
      classes: {
        Row: {
          class_name: string
          created_at: string
          description: string | null
          id: string
          is_archived: boolean
          join_code: string | null
        }
        Insert: {
          class_name: string
          created_at?: string
          description?: string | null
          id?: string
          is_archived?: boolean
          join_code?: string | null
        }
        Update: {
          class_name?: string
          created_at?: string
          description?: string | null
          id?: string
          is_archived?: boolean
          join_code?: string | null
        }
        Relationships: []
      }
      manual_grades: {
        Row: {
          class_id: string | null
          created_at: string
          feedback: string | null
          grade_date: string
          id: string
          max_score: number
          score: number
          student_id: string
          title: string
        }
        Insert: {
          class_id?: string | null
          created_at?: string
          feedback?: string | null
          grade_date?: string
          id?: string
          max_score?: number
          score: number
          student_id: string
          title: string
        }
        Update: {
          class_id?: string | null
          created_at?: string
          feedback?: string | null
          grade_date?: string
          id?: string
          max_score?: number
          score?: number
          student_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "manual_grades_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
        ]
      }
      materials: {
        Row: {
          class_id: string | null
          created_at: string
          description: string | null
          file_url: string | null
          id: string
          title: string
          type: string
        }
        Insert: {
          class_id?: string | null
          created_at?: string
          description?: string | null
          file_url?: string | null
          id?: string
          title: string
          type: string
        }
        Update: {
          class_id?: string | null
          created_at?: string
          description?: string | null
          file_url?: string | null
          id?: string
          title?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "materials_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          class_id: string | null
          created_at: string
          id: string
          is_read: boolean
          message: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          class_id?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string | null
          title: string
          type?: string
          user_id: string
        }
        Update: {
          class_id?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          address: string | null
          avatar_url: string | null
          class_id: string | null
          created_at: string
          date_of_birth: string | null
          full_name: string | null
          gender: string | null
          id: string
          parent_name: string | null
          phone: string | null
          place_of_birth: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          avatar_url?: string | null
          class_id?: string | null
          created_at?: string
          date_of_birth?: string | null
          full_name?: string | null
          gender?: string | null
          id: string
          parent_name?: string | null
          phone?: string | null
          place_of_birth?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          avatar_url?: string | null
          class_id?: string | null
          created_at?: string
          date_of_birth?: string | null
          full_name?: string | null
          gender?: string | null
          id?: string
          parent_name?: string | null
          phone?: string | null
          place_of_birth?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_questions: {
        Row: {
          correct_answer: string | null
          created_at: string
          id: string
          media_url: string | null
          options: Json | null
          order_index: number
          question_text: string
          question_type: string
          quiz_id: string
        }
        Insert: {
          correct_answer?: string | null
          created_at?: string
          id?: string
          media_url?: string | null
          options?: Json | null
          order_index?: number
          question_text: string
          question_type?: string
          quiz_id: string
        }
        Update: {
          correct_answer?: string | null
          created_at?: string
          id?: string
          media_url?: string | null
          options?: Json | null
          order_index?: number
          question_text?: string
          question_type?: string
          quiz_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quiz_questions_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_submissions: {
        Row: {
          created_at: string
          feedback: string | null
          id: string
          quiz_id: string
          score: number | null
          status: string
          student_id: string
        }
        Insert: {
          created_at?: string
          feedback?: string | null
          id?: string
          quiz_id: string
          score?: number | null
          status?: string
          student_id: string
        }
        Update: {
          created_at?: string
          feedback?: string | null
          id?: string
          quiz_id?: string
          score?: number | null
          status?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quiz_submissions_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          },
        ]
      }
      quizzes: {
        Row: {
          class_id: string | null
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          points_per_question: number
          show_answers_after: boolean
          shuffle_options: boolean
          shuffle_questions: boolean
          time_limit: number | null
          title: string
        }
        Insert: {
          class_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          points_per_question?: number
          show_answers_after?: boolean
          shuffle_options?: boolean
          shuffle_questions?: boolean
          time_limit?: number | null
          title: string
        }
        Update: {
          class_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          points_per_question?: number
          show_answers_after?: boolean
          shuffle_options?: boolean
          shuffle_questions?: boolean
          time_limit?: number | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "quizzes_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
        ]
      }
      stream_comments: {
        Row: {
          announcement_id: string
          content: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          announcement_id: string
          content: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          announcement_id?: string
          content?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "stream_comments_announcement_id_fkey"
            columns: ["announcement_id"]
            isOneToOne: false
            referencedRelation: "announcements"
            referencedColumns: ["id"]
          },
        ]
      }
      student_notes: {
        Row: {
          class_id: string | null
          content: string
          created_at: string
          id: string
          student_id: string
        }
        Insert: {
          class_id?: string | null
          content: string
          created_at?: string
          id?: string
          student_id: string
        }
        Update: {
          class_id?: string | null
          content?: string
          created_at?: string
          id?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_notes_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
        ]
      }
      submission_answers: {
        Row: {
          answer_text: string | null
          created_at: string
          id: string
          is_correct: boolean | null
          points: number
          question_id: string
          submission_id: string
          time_taken_ms: number | null
        }
        Insert: {
          answer_text?: string | null
          created_at?: string
          id?: string
          is_correct?: boolean | null
          points?: number
          question_id: string
          submission_id: string
          time_taken_ms?: number | null
        }
        Update: {
          answer_text?: string | null
          created_at?: string
          id?: string
          is_correct?: boolean | null
          points?: number
          question_id?: string
          submission_id?: string
          time_taken_ms?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "submission_answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "quiz_questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "submission_answers_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "quiz_submissions"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "teacher" | "student"
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
    Enums: {
      app_role: ["teacher", "student"],
    },
  },
} as const
