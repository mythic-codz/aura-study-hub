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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      achievements: {
        Row: {
          badge_color: string
          created_at: string
          description: string
          icon: string
          id: string
          name: string
          requirement: number
          type: Database["public"]["Enums"]["achievement_type"]
          xp_reward: number
        }
        Insert: {
          badge_color?: string
          created_at?: string
          description: string
          icon?: string
          id?: string
          name: string
          requirement?: number
          type: Database["public"]["Enums"]["achievement_type"]
          xp_reward?: number
        }
        Update: {
          badge_color?: string
          created_at?: string
          description?: string
          icon?: string
          id?: string
          name?: string
          requirement?: number
          type?: Database["public"]["Enums"]["achievement_type"]
          xp_reward?: number
        }
        Relationships: []
      }
      admin_log: {
        Row: {
          action: string
          admin_id: number
          created_at: string
          details: string | null
          id: string
          target_user: number | null
        }
        Insert: {
          action: string
          admin_id: number
          created_at?: string
          details?: string | null
          id?: string
          target_user?: number | null
        }
        Update: {
          action?: string
          admin_id?: number
          created_at?: string
          details?: string | null
          id?: string
          target_user?: number | null
        }
        Relationships: []
      }
      banned_devices: {
        Row: {
          banned_until: string | null
          created_at: string
          device_id: string
          id: string
          ip_address: string | null
          updated_at: string
          violation_count: number
        }
        Insert: {
          banned_until?: string | null
          created_at?: string
          device_id: string
          id?: string
          ip_address?: string | null
          updated_at?: string
          violation_count?: number
        }
        Update: {
          banned_until?: string | null
          created_at?: string
          device_id?: string
          id?: string
          ip_address?: string | null
          updated_at?: string
          violation_count?: number
        }
        Relationships: []
      }
      batches: {
        Row: {
          batch_name: string | null
          data: Json | null
          id: string
          name: string | null
          pdfs: Json | null
          structured_data: Json | null
          thumbnail: string | null
          updated_at: string | null
          videos: Json | null
        }
        Insert: {
          batch_name?: string | null
          data?: Json | null
          id: string
          name?: string | null
          pdfs?: Json | null
          structured_data?: Json | null
          thumbnail?: string | null
          updated_at?: string | null
          videos?: Json | null
        }
        Update: {
          batch_name?: string | null
          data?: Json | null
          id?: string
          name?: string | null
          pdfs?: Json | null
          structured_data?: Json | null
          thumbnail?: string | null
          updated_at?: string | null
          videos?: Json | null
        }
        Relationships: []
      }
      bot_users: {
        Row: {
          daily_limit: number
          extractions_today: number
          full_name: string | null
          id: number
          is_admin: boolean
          is_allowed: boolean
          is_blocked: boolean
          joined_at: string
          last_reset_date: string | null
          last_seen: string
          notes: string | null
          username: string | null
        }
        Insert: {
          daily_limit?: number
          extractions_today?: number
          full_name?: string | null
          id: number
          is_admin?: boolean
          is_allowed?: boolean
          is_blocked?: boolean
          joined_at?: string
          last_reset_date?: string | null
          last_seen?: string
          notes?: string | null
          username?: string | null
        }
        Update: {
          daily_limit?: number
          extractions_today?: number
          full_name?: string | null
          id?: number
          is_admin?: boolean
          is_allowed?: boolean
          is_blocked?: boolean
          joined_at?: string
          last_reset_date?: string | null
          last_seen?: string
          notes?: string | null
          username?: string | null
        }
        Relationships: []
      }
      broadcasts: {
        Row: {
          id: string
          message: string
          recipient_count: number | null
          sent_at: string
          sent_by: number | null
        }
        Insert: {
          id?: string
          message: string
          recipient_count?: number | null
          sent_at?: string
          sent_by?: number | null
        }
        Update: {
          id?: string
          message?: string
          recipient_count?: number | null
          sent_at?: string
          sent_by?: number | null
        }
        Relationships: []
      }
      extracted_batches: {
        Row: {
          all_items: Json
          batch_id: string
          batch_name: string | null
          dpps: Json
          extracted_at: string
          item_count: number
          lives: Json
          pdfs: Json
          structured: Json
          tests: Json
          videos: Json
        }
        Insert: {
          all_items?: Json
          batch_id: string
          batch_name?: string | null
          dpps?: Json
          extracted_at?: string
          item_count?: number
          lives?: Json
          pdfs?: Json
          structured?: Json
          tests?: Json
          videos?: Json
        }
        Update: {
          all_items?: Json
          batch_id?: string
          batch_name?: string | null
          dpps?: Json
          extracted_at?: string
          item_count?: number
          lives?: Json
          pdfs?: Json
          structured?: Json
          tests?: Json
          videos?: Json
        }
        Relationships: []
      }
      extraction_log: {
        Row: {
          batch_id: string
          extracted_at: string
          id: string
          item_count: number | null
          user_id: number
        }
        Insert: {
          batch_id: string
          extracted_at?: string
          id?: string
          item_count?: number | null
          user_id: number
        }
        Update: {
          batch_id?: string
          extracted_at?: string
          id?: string
          item_count?: number | null
          user_id?: number
        }
        Relationships: []
      }
      favorites: {
        Row: {
          batch_id: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          batch_id: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          batch_id?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      known_batches: {
        Row: {
          added_at: string
          batch_id: string
          batch_name: string | null
          category: string | null
          is_active: boolean | null
        }
        Insert: {
          added_at?: string
          batch_id: string
          batch_name?: string | null
          category?: string | null
          is_active?: boolean | null
        }
        Update: {
          added_at?: string
          batch_id?: string
          batch_name?: string | null
          category?: string | null
          is_active?: boolean | null
        }
        Relationships: []
      }
      live_classes: {
        Row: {
          batch_id: string
          created_at: string
          ended_at: string | null
          id: string
          started_at: string
          stream_url: string | null
          thumbnail: string | null
          title: string
          updated_at: string
        }
        Insert: {
          batch_id: string
          created_at?: string
          ended_at?: string | null
          id?: string
          started_at?: string
          stream_url?: string | null
          thumbnail?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          batch_id?: string
          created_at?: string
          ended_at?: string | null
          id?: string
          started_at?: string
          stream_url?: string | null
          thumbnail?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      notes: {
        Row: {
          batch_id: string
          content_index: number
          content_type: string
          created_at: string
          id: string
          is_bookmark: boolean
          text: string
          timestamp_pos: number
          updated_at: string
          user_id: string
        }
        Insert: {
          batch_id: string
          content_index: number
          content_type: string
          created_at?: string
          id?: string
          is_bookmark?: boolean
          text?: string
          timestamp_pos?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          batch_id?: string
          content_index?: number
          content_type?: string
          created_at?: string
          id?: string
          is_bookmark?: boolean
          text?: string
          timestamp_pos?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      progress: {
        Row: {
          batch_id: string
          batch_name: string | null
          completed: boolean
          content_index: number
          content_type: string
          created_at: string
          id: string
          last_position: number | null
          progress_percent: number
          updated_at: string
          user_id: string
          xp_milestones_claimed: string | null
        }
        Insert: {
          batch_id: string
          batch_name?: string | null
          completed?: boolean
          content_index: number
          content_type: string
          created_at?: string
          id?: string
          last_position?: number | null
          progress_percent?: number
          updated_at?: string
          user_id: string
          xp_milestones_claimed?: string | null
        }
        Update: {
          batch_id?: string
          batch_name?: string | null
          completed?: boolean
          content_index?: number
          content_type?: string
          created_at?: string
          id?: string
          last_position?: number | null
          progress_percent?: number
          updated_at?: string
          user_id?: string
          xp_milestones_claimed?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users_public"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_attempts: {
        Row: {
          answers: Json
          created_at: string
          id: string
          quiz_id: string
          score: number
          total_questions: number
          user_id: string
          xp_earned: number
        }
        Insert: {
          answers?: Json
          created_at?: string
          id?: string
          quiz_id: string
          score?: number
          total_questions?: number
          user_id: string
          xp_earned?: number
        }
        Update: {
          answers?: Json
          created_at?: string
          id?: string
          quiz_id?: string
          score?: number
          total_questions?: number
          user_id?: string
          xp_earned?: number
        }
        Relationships: [
          {
            foreignKeyName: "quiz_attempts_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          },
        ]
      }
      quizzes: {
        Row: {
          batch_id: string
          content_index: number
          content_type: string
          created_at: string
          id: string
          questions: Json
        }
        Insert: {
          batch_id: string
          content_index: number
          content_type: string
          created_at?: string
          id?: string
          questions?: Json
        }
        Update: {
          batch_id?: string
          content_index?: number
          content_type?: string
          created_at?: string
          id?: string
          questions?: Json
        }
        Relationships: []
      }
      study_sessions: {
        Row: {
          created_at: string
          id: string
          minutes_studied: number
          study_date: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          minutes_studied?: number
          study_date?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          minutes_studied?: number
          study_date?: string
          user_id?: string
        }
        Relationships: []
      }
      user_achievements: {
        Row: {
          achievement_id: string
          id: string
          unlocked_at: string
          user_id: string
        }
        Insert: {
          achievement_id: string
          id?: string
          unlocked_at?: string
          user_id: string
        }
        Update: {
          achievement_id?: string
          id?: string
          unlocked_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_achievements_achievement_id_fkey"
            columns: ["achievement_id"]
            isOneToOne: false
            referencedRelation: "achievements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_achievements_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_achievements_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_achievements_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users_public"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          avatar_url: string | null
          created_at: string
          current_streak: number
          device_id: string
          id: string
          ip_address: string | null
          longest_streak: number
          name: string
          updated_at: string
          xp: number
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          current_streak?: number
          device_id: string
          id?: string
          ip_address?: string | null
          longest_streak?: number
          name: string
          updated_at?: string
          xp?: number
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          current_streak?: number
          device_id?: string
          id?: string
          ip_address?: string | null
          longest_streak?: number
          name?: string
          updated_at?: string
          xp?: number
        }
        Relationships: []
      }
    }
    Views: {
      public_profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          current_streak: number | null
          id: string | null
          longest_streak: number | null
          name: string | null
          xp: number | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          current_streak?: number | null
          id?: string | null
          longest_streak?: number | null
          name?: string | null
          xp?: number | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          current_streak?: number | null
          id?: string | null
          longest_streak?: number | null
          name?: string | null
          xp?: number | null
        }
        Relationships: []
      }
      users_public: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          id: string | null
          name: string | null
          xp: number | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          id?: string | null
          name?: string | null
          xp?: number | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          id?: string | null
          name?: string | null
          xp?: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      achievement_type:
        | "batch_complete"
        | "videos_watched"
        | "xp_milestone"
        | "streak"
        | "first_steps"
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
      achievement_type: [
        "batch_complete",
        "videos_watched",
        "xp_milestone",
        "streak",
        "first_steps",
      ],
    },
  },
} as const
