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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      connect_requests: {
        Row: {
          applicant_id: string
          created_at: string
          flag_reason: string | null
          flagged: boolean
          id: string
          pitch_sentence: string
          project_id: string
          responded_at: string | null
          role_offered: string
          status: Database["public"]["Enums"]["request_status"]
        }
        Insert: {
          applicant_id: string
          created_at?: string
          flag_reason?: string | null
          flagged?: boolean
          id?: string
          pitch_sentence: string
          project_id: string
          responded_at?: string | null
          role_offered: string
          status?: Database["public"]["Enums"]["request_status"]
        }
        Update: {
          applicant_id?: string
          created_at?: string
          flag_reason?: string | null
          flagged?: boolean
          id?: string
          pitch_sentence?: string
          project_id?: string
          responded_at?: string | null
          role_offered?: string
          status?: Database["public"]["Enums"]["request_status"]
        }
        Relationships: [
          {
            foreignKeyName: "connect_requests_applicant_id_fkey"
            columns: ["applicant_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "connect_requests_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "match_analytics"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "connect_requests_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          message: string
          read: boolean
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          read?: boolean
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          read?: boolean
          title?: string
          type?: Database["public"]["Enums"]["notification_type"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profile_embeddings: {
        Row: {
          content_hash: string
          embedding: string
          profile_id: string
          updated_at: string
        }
        Insert: {
          content_hash: string
          embedding: string
          profile_id: string
          updated_at?: string
        }
        Update: {
          content_hash?: string
          embedding?: string
          profile_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profile_embeddings_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          direct_contact: string | null
          full_name: string | null
          github_handle: string | null
          github_stats: Json | null
          id: string
          primary_link: string | null
          reputation_score: number
          skills: string[]
          verification_status: Database["public"]["Enums"]["verification_status"]
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          direct_contact?: string | null
          full_name?: string | null
          github_handle?: string | null
          github_stats?: Json | null
          id: string
          primary_link?: string | null
          reputation_score?: number
          skills?: string[]
          verification_status?: Database["public"]["Enums"]["verification_status"]
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          direct_contact?: string | null
          full_name?: string | null
          github_handle?: string | null
          github_stats?: Json | null
          id?: string
          primary_link?: string | null
          reputation_score?: number
          skills?: string[]
          verification_status?: Database["public"]["Enums"]["verification_status"]
        }
        Relationships: []
      }
      project_embeddings: {
        Row: {
          content_hash: string
          embedding: string
          project_id: string
          updated_at: string
        }
        Insert: {
          content_hash: string
          embedding: string
          project_id: string
          updated_at?: string
        }
        Update: {
          content_hash?: string
          embedding?: string
          project_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_embeddings_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: true
            referencedRelation: "match_analytics"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "project_embeddings_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: true
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_events: {
        Row: {
          created_at: string
          event_type: Database["public"]["Enums"]["project_event_type"]
          id: number
          project_id: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          event_type: Database["public"]["Enums"]["project_event_type"]
          id?: never
          project_id: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          event_type?: Database["public"]["Enums"]["project_event_type"]
          id?: never
          project_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_events_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "match_analytics"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "project_events_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_proofs: {
        Row: {
          created_at: string
          id: string
          label: string
          project_id: string
          proof_type: Database["public"]["Enums"]["proof_type"]
          url: string
          verified: boolean
        }
        Insert: {
          created_at?: string
          id?: string
          label: string
          project_id: string
          proof_type: Database["public"]["Enums"]["proof_type"]
          url: string
          verified?: boolean
        }
        Update: {
          created_at?: string
          id?: string
          label?: string
          project_id?: string
          proof_type?: Database["public"]["Enums"]["proof_type"]
          url?: string
          verified?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "project_proofs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "match_analytics"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "project_proofs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          category: Database["public"]["Enums"]["project_category"]
          created_at: string
          entity_type: Database["public"]["Enums"]["entity_type"]
          id: string
          incentive: Database["public"]["Enums"]["incentive_type"]
          looking_for: string
          stage: Database["public"]["Enums"]["project_stage"]
          tagline: string
          tech_stack: string[]
          title: string
          user_id: string | null
        }
        Insert: {
          category: Database["public"]["Enums"]["project_category"]
          created_at?: string
          entity_type: Database["public"]["Enums"]["entity_type"]
          id?: string
          incentive: Database["public"]["Enums"]["incentive_type"]
          looking_for: string
          stage: Database["public"]["Enums"]["project_stage"]
          tagline: string
          tech_stack?: string[]
          title: string
          user_id?: string | null
        }
        Update: {
          category?: Database["public"]["Enums"]["project_category"]
          created_at?: string
          entity_type?: Database["public"]["Enums"]["entity_type"]
          id?: string
          incentive?: Database["public"]["Enums"]["incentive_type"]
          looking_for?: string
          stage?: Database["public"]["Enums"]["project_stage"]
          tagline?: string
          tech_stack?: string[]
          title?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "projects_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      match_analytics: {
        Row: {
          accepted_count: number | null
          avg_ttfr_hours: number | null
          click_count: number | null
          connect_conversion_rate: number | null
          created_at: string | null
          pitch_count: number | null
          project_id: string | null
          title: string | null
          user_id: string | null
          view_count: number | null
        }
        Insert: {
          accepted_count?: never
          avg_ttfr_hours?: never
          click_count?: never
          connect_conversion_rate?: never
          created_at?: string | null
          pitch_count?: never
          project_id?: string | null
          title?: string | null
          user_id?: string | null
          view_count?: never
        }
        Update: {
          accepted_count?: never
          avg_ttfr_hours?: never
          click_count?: never
          connect_conversion_rate?: never
          created_at?: string | null
          pitch_count?: never
          project_id?: string | null
          title?: string | null
          user_id?: string | null
          view_count?: never
        }
        Relationships: [
          {
            foreignKeyName: "projects_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      accept_connect: {
        Args: { _request_id: string }
        Returns: {
          applicant_contact: string
          applicant_name: string
          owner_contact: string
          owner_name: string
          project_title: string
          request_id: string
        }[]
      }
      applicant_semantic_scores: {
        Args: never
        Returns: {
          applicant_id: string
          project_id: string
          similarity: number
        }[]
      }
      get_applicant_contact: { Args: { _request_id: string }; Returns: string }
      get_handshake: {
        Args: { _request_id: string }
        Returns: {
          applicant_contact: string
          applicant_name: string
          owner_contact: string
          owner_name: string
          project_title: string
          request_id: string
        }[]
      }
      get_my_contact: { Args: never; Returns: string }
      my_semantic_scores: {
        Args: never
        Returns: {
          project_id: string
          similarity: number
        }[]
      }
      recommend_builders: {
        Args: { _project_id: string }
        Returns: {
          full_name: string
          github_handle: string
          id: string
          overlap: number
          primary_link: string
          reputation_score: number
          similarity: number
          skills: string[]
          verification_status: Database["public"]["Enums"]["verification_status"]
        }[]
      }
      refresh_reputation: { Args: { _uid: string }; Returns: undefined }
      track_project_events: {
        Args: {
          _project_ids: string[]
          _type: Database["public"]["Enums"]["project_event_type"]
        }
        Returns: undefined
      }
    }
    Enums: {
      entity_type: "Solo Founder" | "Early Team" | "Company"
      incentive_type: "Equity" | "Paid" | "Equity + Paid" | "Open Source"
      notification_type:
        | "new_connect_request"
        | "request_accepted"
        | "request_declined"
      project_category: "AI/ML" | "SaaS" | "DevTools" | "Web3"
      project_event_type: "impression" | "click" | "reveal"
      project_stage: "Idea" | "Prototype" | "Live Revenue" | "Funded"
      proof_type: "github_repo" | "demo_video" | "live_metrics" | "deck_url"
      request_status: "pending" | "accepted" | "declined"
      verification_status: "unverified" | "github_verified" | "top_builder"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      entity_type: ["Solo Founder", "Early Team", "Company"],
      incentive_type: ["Equity", "Paid", "Equity + Paid", "Open Source"],
      notification_type: [
        "new_connect_request",
        "request_accepted",
        "request_declined",
      ],
      project_category: ["AI/ML", "SaaS", "DevTools", "Web3"],
      project_event_type: ["impression", "click", "reveal"],
      project_stage: ["Idea", "Prototype", "Live Revenue", "Funded"],
      proof_type: ["github_repo", "demo_video", "live_metrics", "deck_url"],
      request_status: ["pending", "accepted", "declined"],
      verification_status: ["unverified", "github_verified", "top_builder"],
    },
  },
} as const
