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
          id: string
          pitch_sentence: string
          project_id: string
          role_offered: string
          status: Database["public"]["Enums"]["request_status"]
        }
        Insert: {
          applicant_id: string
          created_at?: string
          id?: string
          pitch_sentence: string
          project_id: string
          role_offered: string
          status?: Database["public"]["Enums"]["request_status"]
        }
        Update: {
          applicant_id?: string
          created_at?: string
          id?: string
          pitch_sentence?: string
          project_id?: string
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
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          direct_contact: string | null
          full_name: string | null
          id: string
          primary_link: string | null
          skills: string[]
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          direct_contact?: string | null
          full_name?: string | null
          id: string
          primary_link?: string | null
          skills?: string[]
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          direct_contact?: string | null
          full_name?: string | null
          id?: string
          primary_link?: string | null
          skills?: string[]
        }
        Relationships: []
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
      [_ in never]: never
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
    }
    Enums: {
      entity_type: "Solo Founder" | "Early Team" | "Company"
      incentive_type: "Equity" | "Paid" | "Equity + Paid" | "Open Source"
      notification_type:
        | "new_connect_request"
        | "request_accepted"
        | "request_declined"
      project_category: "AI/ML" | "SaaS" | "DevTools" | "Web3"
      project_stage: "Idea" | "Prototype" | "Live Revenue" | "Funded"
      request_status: "pending" | "accepted" | "declined"
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
      project_stage: ["Idea", "Prototype", "Live Revenue", "Funded"],
      request_status: ["pending", "accepted", "declined"],
    },
  },
} as const
