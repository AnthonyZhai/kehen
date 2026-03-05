export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      alert_logs: {
        Row: {
          alert_type: string
          id: string
          is_read: boolean | null
          remaining_hours: number
          sent_at: string | null
          sent_to: string[]
          student_id: string
        }
        Insert: {
          alert_type: string
          id?: string
          is_read?: boolean | null
          remaining_hours: number
          sent_at?: string | null
          sent_to: string[]
          student_id: string
        }
        Update: {
          alert_type?: string
          id?: string
          is_read?: boolean | null
          remaining_hours?: number
          sent_at?: string | null
          sent_to?: string[]
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "alert_logs_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      class_records: {
        Row: {
          class_date: string
          created_at: string | null
          hours_consumed: number
          id: string
          notes: string | null
          photo_url: string | null
          status: string | null
          student_id: string
          teacher_id: string
          updated_at: string | null
        }
        Insert: {
          class_date: string
          created_at?: string | null
          hours_consumed?: number
          id?: string
          notes?: string | null
          photo_url?: string | null
          status?: string | null
          student_id: string
          teacher_id: string
          updated_at?: string | null
        }
        Update: {
          class_date?: string
          created_at?: string | null
          hours_consumed?: number
          id?: string
          notes?: string | null
          photo_url?: string | null
          status?: string | null
          student_id?: string
          teacher_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "class_records_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_records_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      classes: {
        Row: {
          created_at: string | null
          default_hours?: number
          description: string | null
          id: string
          name: string
          schedule: string | null
          teacher_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          default_hours?: number
          description?: string | null
          id?: string
          name: string
          schedule?: string | null
          teacher_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          default_hours?: number
          description?: string | null
          id?: string
          name?: string
          schedule?: string | null
          teacher_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "classes_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string
          full_name: string
          id: string
          phone: string | null
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email: string
          full_name: string
          id: string
          phone?: string | null
          role: Database["public"]["Enums"]["user_role"]
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string
          full_name?: string
          id?: string
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string | null
        }
        Relationships: []
      }
      renewal_records: {
        Row: {
          id: string
          student_id: string
          hours_added: number
          previous_remaining: number
          previous_total: number
          renewed_at: string
          created_by: string | null
          notes: string | null
        }
        Insert: {
          id?: string
          student_id: string
          hours_added: number
          previous_remaining: number
          previous_total: number
          renewed_at?: string
          created_by?: string | null
          notes?: string | null
        }
        Update: {
          id?: string
          student_id?: string
          hours_added?: number
          previous_remaining?: number
          previous_total?: number
          renewed_at?: string
          created_by?: string | null
          notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "renewal_records_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "renewal_records_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      public_awards: {
        Row: {
          award_name: string
          created_at: string
          id: string
          match_name: string
          school: string
          sort_order: number | null
          student_name: string
        }
        Insert: {
          award_name: string
          created_at?: string
          id?: string
          match_name: string
          school: string
          sort_order?: number | null
          student_name: string
        }
        Update: {
          award_name?: string
          created_at?: string
          id?: string
          match_name?: string
          school?: string
          sort_order?: number | null
          student_name?: string
        }
        Relationships: []
      }
      public_courses: {
        Row: {
          age: string
          border_class: string
          btn_class: string
          color_class: string
          created_at: string
          description: string
          icon_name: string
          id: string
          name: string
          shadow_class: string
          sort_order: number | null
        }
        Insert: {
          age: string
          border_class: string
          btn_class: string
          color_class: string
          created_at?: string
          description: string
          icon_name: string
          id?: string
          name: string
          shadow_class: string
          sort_order?: number | null
        }
        Update: {
          age?: string
          border_class?: string
          btn_class?: string
          color_class?: string
          created_at?: string
          description?: string
          icon_name?: string
          id?: string
          name?: string
          shadow_class?: string
          sort_order?: number | null
        }
        Relationships: []
      }
      public_site_settings: {
        Row: {
          created_at: string
          key: string
          updated_at: string
          value: string
        }
        Insert: {
          created_at?: string
          key: string
          updated_at?: string
          value: string
        }
        Update: {
          created_at?: string
          key?: string
          updated_at?: string
          value?: string
        }
        Relationships: []
      }
      public_teachers: {
        Row: {
          created_at: string
          description: string
          id: string
          image_url: string
          name: string
          sort_order: number | null
          title: string
        }
        Insert: {
          created_at?: string
          description: string
          id?: string
          image_url: string
          name: string
          sort_order?: number | null
          title: string
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          image_url?: string
          name?: string
          sort_order?: number | null
          title?: string
        }
        Relationships: []
      }
      students: {
        Row: {
          alert_threshold: number | null
          class_id: string | null
          class_name: string | null
          created_at: string | null
          id: string
          name: string
          notes: string | null
          parent_id: string | null
          photo_url: string | null
          remaining_hours: number | null
          status: string | null
          subject: string | null
          total_hours: number | null
          updated_at: string | null
        }
        Insert: {
          alert_threshold?: number | null
          class_id?: string | null
          class_name?: string | null
          created_at?: string | null
          id?: string
          name: string
          notes?: string | null
          parent_id?: string | null
          photo_url?: string | null
          remaining_hours?: number | null
          status?: string | null
          subject?: string | null
          total_hours?: number | null
          updated_at?: string | null
        }
        Update: {
          alert_threshold?: number | null
          class_id?: string | null
          class_name?: string | null
          created_at?: string | null
          id?: string
          name?: string
          notes?: string | null
          parent_id?: string | null
          photo_url?: string | null
          remaining_hours?: number | null
          status?: string | null
          subject?: string | null
          total_hours?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "students_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "students_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      trial_applications: {
        Row: {
          child_name: string
          course_type: string
          created_at: string | null
          id: string
          notes: string | null
          phone: string
          status: string | null
          updated_at: string | null
        }
        Insert: {
          child_name: string
          course_type: string
          created_at?: string | null
          id?: string
          notes?: string | null
          phone: string
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          child_name?: string
          course_type?: string
          created_at?: string | null
          id?: string
          notes?: string | null
          phone?: string
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_role: {
        Args: { user_id: string }
        Returns: Database["public"]["Enums"]["user_role"]
      }
    }
    Enums: {
      user_role: "teacher" | "boss" | "parent"
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
      user_role: ["teacher", "boss", "parent"],
    },
  },
} as const
