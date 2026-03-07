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
      assessment_answers: {
        Row: {
          answer_text: string | null
          created_at: string
          id: string
          is_correct: boolean | null
          points: number
          question_id: string
          submission_id: string
        }
        Insert: {
          answer_text?: string | null
          created_at?: string
          id?: string
          is_correct?: boolean | null
          points?: number
          question_id: string
          submission_id: string
        }
        Update: {
          answer_text?: string | null
          created_at?: string
          id?: string
          is_correct?: boolean | null
          points?: number
          question_id?: string
          submission_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "assessment_answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "assessment_questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assessment_answers_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "assessment_submissions"
            referencedColumns: ["id"]
          },
        ]
      }
      assessment_class_assignments: {
        Row: {
          assessment_id: string
          class_id: string
          created_at: string | null
          id: string
        }
        Insert: {
          assessment_id: string
          class_id: string
          created_at?: string | null
          id?: string
        }
        Update: {
          assessment_id?: string
          class_id?: string
          created_at?: string | null
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "assessment_class_assignments_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "assessments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assessment_class_assignments_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
        ]
      }
      assessment_questions: {
        Row: {
          assessment_id: string
          cognitive_level: string
          correct_answer: string | null
          created_at: string
          difficulty: string
          id: string
          options: Json | null
          order_index: number
          question_text: string
          section_id: string
        }
        Insert: {
          assessment_id: string
          cognitive_level?: string
          correct_answer?: string | null
          created_at?: string
          difficulty?: string
          id?: string
          options?: Json | null
          order_index?: number
          question_text: string
          section_id: string
        }
        Update: {
          assessment_id?: string
          cognitive_level?: string
          correct_answer?: string | null
          created_at?: string
          difficulty?: string
          id?: string
          options?: Json | null
          order_index?: number
          question_text?: string
          section_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "assessment_questions_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "assessments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assessment_questions_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "assessment_sections"
            referencedColumns: ["id"]
          },
        ]
      }
      assessment_sections: {
        Row: {
          assessment_id: string
          cognitive_levels: Json | null
          created_at: string
          difficulty_easy: number
          difficulty_hard: number
          difficulty_medium: number
          id: string
          num_questions: number
          order_index: number
          question_type: string
          reading_passage: string | null
          title: string
        }
        Insert: {
          assessment_id: string
          cognitive_levels?: Json | null
          created_at?: string
          difficulty_easy?: number
          difficulty_hard?: number
          difficulty_medium?: number
          id?: string
          num_questions?: number
          order_index?: number
          question_type?: string
          reading_passage?: string | null
          title?: string
        }
        Update: {
          assessment_id?: string
          cognitive_levels?: Json | null
          created_at?: string
          difficulty_easy?: number
          difficulty_hard?: number
          difficulty_medium?: number
          id?: string
          num_questions?: number
          order_index?: number
          question_type?: string
          reading_passage?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "assessment_sections_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "assessments"
            referencedColumns: ["id"]
          },
        ]
      }
      assessment_student_assignments: {
        Row: {
          assessment_id: string
          created_at: string | null
          id: string
          purpose: string | null
          student_id: string
        }
        Insert: {
          assessment_id: string
          created_at?: string | null
          id?: string
          purpose?: string | null
          student_id: string
        }
        Update: {
          assessment_id?: string
          created_at?: string | null
          id?: string
          purpose?: string | null
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "assessment_student_assignments_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "assessments"
            referencedColumns: ["id"]
          },
        ]
      }
      assessment_submissions: {
        Row: {
          assessment_id: string
          created_at: string
          id: string
          score: number | null
          started_at: string
          status: string
          student_id: string
          submitted_at: string | null
        }
        Insert: {
          assessment_id: string
          created_at?: string
          id?: string
          score?: number | null
          started_at?: string
          status?: string
          student_id: string
          submitted_at?: string | null
        }
        Update: {
          assessment_id?: string
          created_at?: string
          id?: string
          score?: number | null
          started_at?: string
          status?: string
          student_id?: string
          submitted_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "assessment_submissions_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "assessments"
            referencedColumns: ["id"]
          },
        ]
      }
      assessments: {
        Row: {
          assessment_type: string
          class_id: string | null
          created_at: string
          description: string | null
          duration_minutes: number
          expires_at: string | null
          id: string
          is_active: boolean
          scheduled_at: string | null
          title: string
        }
        Insert: {
          assessment_type?: string
          class_id?: string | null
          created_at?: string
          description?: string | null
          duration_minutes?: number
          expires_at?: string | null
          id?: string
          is_active?: boolean
          scheduled_at?: string | null
          title: string
        }
        Update: {
          assessment_type?: string
          class_id?: string | null
          created_at?: string
          description?: string | null
          duration_minutes?: number
          expires_at?: string | null
          id?: string
          is_active?: boolean
          scheduled_at?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "assessments_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
        ]
      }
      assignment_materials: {
        Row: {
          assignment_id: string
          created_at: string
          id: string
          material_id: string
        }
        Insert: {
          assignment_id: string
          created_at?: string
          id?: string
          material_id: string
        }
        Update: {
          assignment_id?: string
          created_at?: string
          id?: string
          material_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "assignment_materials_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "assignments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assignment_materials_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "materials"
            referencedColumns: ["id"]
          },
        ]
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
          expires_at: string | null
          id: string
          max_score: number
          scheduled_at: string | null
          title: string
        }
        Insert: {
          class_id: string
          created_at?: string
          description?: string | null
          due_date?: string | null
          expires_at?: string | null
          id?: string
          max_score?: number
          scheduled_at?: string | null
          title: string
        }
        Update: {
          class_id?: string
          created_at?: string
          description?: string | null
          due_date?: string | null
          expires_at?: string | null
          id?: string
          max_score?: number
          scheduled_at?: string | null
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
      courses: {
        Row: {
          class_id: string | null
          created_at: string
          description: string | null
          id: string
          is_published: boolean
          title: string
          updated_at: string
        }
        Insert: {
          class_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_published?: boolean
          title: string
          updated_at?: string
        }
        Update: {
          class_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_published?: boolean
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "courses_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
        ]
      }
      gemini_api_keys: {
        Row: {
          api_key: string
          created_at: string
          created_by: string
          id: string
          is_active: boolean
          label: string
        }
        Insert: {
          api_key: string
          created_at?: string
          created_by: string
          id?: string
          is_active?: boolean
          label?: string
        }
        Update: {
          api_key?: string
          created_at?: string
          created_by?: string
          id?: string
          is_active?: boolean
          label?: string
        }
        Relationships: []
      }
      grade_categories: {
        Row: {
          class_id: string
          created_at: string
          id: string
          max_score: number
          name: string
          order_index: number
        }
        Insert: {
          class_id: string
          created_at?: string
          id?: string
          max_score?: number
          name: string
          order_index?: number
        }
        Update: {
          class_id?: string
          created_at?: string
          id?: string
          max_score?: number
          name?: string
          order_index?: number
        }
        Relationships: [
          {
            foreignKeyName: "grade_categories_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
        ]
      }
      grading_config: {
        Row: {
          assessment_weight: number
          attendance_weight: number
          class_id: string
          created_at: string
          id: string
          manual_weight: number
          passing_grade: number
          quiz_weight: number
          updated_at: string
        }
        Insert: {
          assessment_weight?: number
          attendance_weight?: number
          class_id: string
          created_at?: string
          id?: string
          manual_weight?: number
          passing_grade?: number
          quiz_weight?: number
          updated_at?: string
        }
        Update: {
          assessment_weight?: number
          attendance_weight?: number
          class_id?: string
          created_at?: string
          id?: string
          manual_weight?: number
          passing_grade?: number
          quiz_weight?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "grading_config_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: true
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_completions: {
        Row: {
          completed_at: string
          id: string
          lesson_id: string
          student_id: string
        }
        Insert: {
          completed_at?: string
          id?: string
          lesson_id: string
          student_id: string
        }
        Update: {
          completed_at?: string
          id?: string
          lesson_id?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lesson_completions_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_plans: {
        Row: {
          assessment_method: string | null
          class_id: string
          closing_activity: string | null
          core_competencies: string | null
          created_at: string
          date_end: string | null
          date_start: string | null
          id: string
          learning_objectives: string
          main_activity: string | null
          materials_resources: string | null
          notes: string | null
          opening_activity: string | null
          status: string
          time_allocation: string | null
          title: string
          topic: string
          week_number: number | null
        }
        Insert: {
          assessment_method?: string | null
          class_id: string
          closing_activity?: string | null
          core_competencies?: string | null
          created_at?: string
          date_end?: string | null
          date_start?: string | null
          id?: string
          learning_objectives?: string
          main_activity?: string | null
          materials_resources?: string | null
          notes?: string | null
          opening_activity?: string | null
          status?: string
          time_allocation?: string | null
          title: string
          topic?: string
          week_number?: number | null
        }
        Update: {
          assessment_method?: string | null
          class_id?: string
          closing_activity?: string | null
          core_competencies?: string | null
          created_at?: string
          date_end?: string | null
          date_start?: string | null
          id?: string
          learning_objectives?: string
          main_activity?: string | null
          materials_resources?: string | null
          notes?: string | null
          opening_activity?: string | null
          status?: string
          time_allocation?: string | null
          title?: string
          topic?: string
          week_number?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "lesson_plans_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
        ]
      }
      lessons: {
        Row: {
          content: string | null
          course_id: string
          created_at: string
          id: string
          order_index: number
          title: string
          updated_at: string
          video_url: string | null
        }
        Insert: {
          content?: string | null
          course_id: string
          created_at?: string
          id?: string
          order_index?: number
          title: string
          updated_at?: string
          video_url?: string | null
        }
        Update: {
          content?: string | null
          course_id?: string
          created_at?: string
          id?: string
          order_index?: number
          title?: string
          updated_at?: string
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lessons_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
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
      products: {
        Row: {
          checkout_link: string | null
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          price: number
          thumbnail_url: string | null
          title: string
          updated_at: string
        }
        Insert: {
          checkout_link?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          price?: number
          thumbnail_url?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          checkout_link?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          price?: number
          thumbnail_url?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
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
          expires_at: string | null
          id: string
          is_active: boolean
          points_per_question: number
          scheduled_at: string | null
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
          expires_at?: string | null
          id?: string
          is_active?: boolean
          points_per_question?: number
          scheduled_at?: string | null
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
          expires_at?: string | null
          id?: string
          is_active?: boolean
          points_per_question?: number
          scheduled_at?: string | null
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
      teaching_journals: {
        Row: {
          class_id: string
          created_at: string
          date: string
          id: string
          notes: string | null
          period_label: string
          schedule_id: string | null
          topic: string
        }
        Insert: {
          class_id: string
          created_at?: string
          date?: string
          id?: string
          notes?: string | null
          period_label?: string
          schedule_id?: string | null
          topic?: string
        }
        Update: {
          class_id?: string
          created_at?: string
          date?: string
          id?: string
          notes?: string | null
          period_label?: string
          schedule_id?: string | null
          topic?: string
        }
        Relationships: [
          {
            foreignKeyName: "teaching_journals_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teaching_journals_schedule_id_fkey"
            columns: ["schedule_id"]
            isOneToOne: false
            referencedRelation: "class_schedules"
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
