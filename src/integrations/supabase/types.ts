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
      autonomous_matches: {
        Row: {
          builder_id: string
          project_id: string
          score: number
          updated_at: string
        }
        Insert: {
          builder_id: string
          project_id: string
          score: number
          updated_at?: string
        }
        Update: {
          builder_id?: string
          project_id?: string
          score?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "autonomous_matches_builder_id_fkey"
            columns: ["builder_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "autonomous_matches_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "match_analytics"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "autonomous_matches_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      builder_endorsements: {
        Row: {
          author_id: string
          created_at: string
          id: string
          request_id: string
          skill: string
          subject_id: string
        }
        Insert: {
          author_id: string
          created_at?: string
          id?: string
          request_id: string
          skill: string
          subject_id: string
        }
        Update: {
          author_id?: string
          created_at?: string
          id?: string
          request_id?: string
          skill?: string
          subject_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "builder_endorsements_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "builder_endorsements_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "connect_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "builder_endorsements_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      builder_invites: {
        Row: {
          builder_id: string
          created_at: string
          id: string
          project_id: string
        }
        Insert: {
          builder_id: string
          created_at?: string
          id?: string
          project_id: string
        }
        Update: {
          builder_id?: string
          created_at?: string
          id?: string
          project_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "builder_invites_builder_id_fkey"
            columns: ["builder_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "builder_invites_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "match_analytics"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "builder_invites_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      builder_passports: {
        Row: {
          contribution_graph: Json
          headline: string
          is_demo: boolean
          user_id: string
          username: string
        }
        Insert: {
          contribution_graph?: Json
          headline?: string
          is_demo?: boolean
          user_id: string
          username: string
        }
        Update: {
          contribution_graph?: Json
          headline?: string
          is_demo?: boolean
          user_id?: string
          username?: string
        }
        Relationships: [
          {
            foreignKeyName: "builder_passports_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      builder_preferences: {
        Row: {
          available: boolean
          digest_email: string | null
          last_digest_at: string | null
          master_pitch: string | null
          master_role: string | null
          user_id: string
          weekly_digest: boolean
        }
        Insert: {
          available?: boolean
          digest_email?: string | null
          last_digest_at?: string | null
          master_pitch?: string | null
          master_role?: string | null
          user_id: string
          weekly_digest?: boolean
        }
        Update: {
          available?: boolean
          digest_email?: string | null
          last_digest_at?: string | null
          master_pitch?: string | null
          master_role?: string | null
          user_id?: string
          weekly_digest?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "builder_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      builder_verifiable_credentials: {
        Row: {
          claim_type: Database["public"]["Enums"]["credential_claim"]
          event_id: string
          id: string
          issuer: string
          proof_hash: string
          source: string
          user_id: string
          verified_at: string
        }
        Insert: {
          claim_type: Database["public"]["Enums"]["credential_claim"]
          event_id: string
          id?: string
          issuer?: string
          proof_hash: string
          source: string
          user_id: string
          verified_at?: string
        }
        Update: {
          claim_type?: Database["public"]["Enums"]["credential_claim"]
          event_id?: string
          id?: string
          issuer?: string
          proof_hash?: string
          source?: string
          user_id?: string
          verified_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "builder_verifiable_credentials_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      cofounder_alignment_matrix: {
        Row: {
          equity_range_offered: string
          id: string
          location_preference: Database["public"]["Enums"]["location_type"]
          project_id: string
          time_commitment: Database["public"]["Enums"]["commitment_type"]
          timezone_overlap_min: number
          vesting_schedule: string
        }
        Insert: {
          equity_range_offered?: string
          id?: string
          location_preference?: Database["public"]["Enums"]["location_type"]
          project_id: string
          time_commitment?: Database["public"]["Enums"]["commitment_type"]
          timezone_overlap_min?: number
          vesting_schedule?: string
        }
        Update: {
          equity_range_offered?: string
          id?: string
          location_preference?: Database["public"]["Enums"]["location_type"]
          project_id?: string
          time_commitment?: Database["public"]["Enums"]["commitment_type"]
          timezone_overlap_min?: number
          vesting_schedule?: string
        }
        Relationships: [
          {
            foreignKeyName: "cofounder_alignment_matrix_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: true
            referencedRelation: "match_analytics"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "cofounder_alignment_matrix_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: true
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      commitment_checklists: {
        Row: {
          ip_assignment: boolean
          request_id: string
          time_commitment: boolean
          user_id: string
          vesting: boolean
        }
        Insert: {
          ip_assignment?: boolean
          request_id: string
          time_commitment?: boolean
          user_id: string
          vesting?: boolean
        }
        Update: {
          ip_assignment?: boolean
          request_id?: string
          time_commitment?: boolean
          user_id?: string
          vesting?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "commitment_checklists_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "connect_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commitment_checklists_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
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
      credential_verified_events: {
        Row: {
          event_id: string
          payload: Json
          source: string
          user_id: string
          verified_at: string
        }
        Insert: {
          event_id: string
          payload: Json
          source: string
          user_id: string
          verified_at?: string
        }
        Update: {
          event_id?: string
          payload?: Json
          source?: string
          user_id?: string
          verified_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "credential_verified_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      ecosystem_activity: {
        Row: {
          created_at: string
          event_type: string
          id: number
          project_id: string
        }
        Insert: {
          created_at?: string
          event_type: string
          id?: never
          project_id: string
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: never
          project_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ecosystem_activity_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "match_analytics"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "ecosystem_activity_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      ecosystem_job_items: {
        Row: {
          completed_at: string
          item_key: string
          job_name: string
        }
        Insert: {
          completed_at?: string
          item_key: string
          job_name: string
        }
        Update: {
          completed_at?: string
          item_key?: string
          job_name?: string
        }
        Relationships: []
      }
      ecosystem_job_state: {
        Row: {
          lease_until: string | null
          name: string
          pause_reason: string | null
          paused: boolean
          updated_at: string
        }
        Insert: {
          lease_until?: string | null
          name: string
          pause_reason?: string | null
          paused?: boolean
          updated_at?: string
        }
        Update: {
          lease_until?: string | null
          name?: string
          pause_reason?: string | null
          paused?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      ecosystem_outbox: {
        Row: {
          completed_at: string | null
          created_at: string
          event_type: string
          id: string
          last_error: string | null
          request_id: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          event_type: string
          id?: string
          last_error?: string | null
          request_id: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          event_type?: string
          id?: string
          last_error?: string | null
          request_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ecosystem_outbox_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "connect_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ecosystem_outbox_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      integration_settings: {
        Row: {
          access_token_encrypted: string | null
          enabled: boolean
          id: string
          provider: Database["public"]["Enums"]["integration_provider"]
          settings_json: Json
          user_id: string
          webhook_url: string | null
        }
        Insert: {
          access_token_encrypted?: string | null
          enabled?: boolean
          id?: string
          provider: Database["public"]["Enums"]["integration_provider"]
          settings_json?: Json
          user_id: string
          webhook_url?: string | null
        }
        Update: {
          access_token_encrypted?: string | null
          enabled?: boolean
          id?: string
          provider?: Database["public"]["Enums"]["integration_provider"]
          settings_json?: Json
          user_id?: string
          webhook_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "integration_settings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      match_feedback_loops: {
        Row: {
          connect_request_id: string
          created_at: string
          feedback_notes: string | null
          id: string
          owner_rating: number | null
          pass_reason: Database["public"]["Enums"]["pass_reason_type"] | null
        }
        Insert: {
          connect_request_id: string
          created_at?: string
          feedback_notes?: string | null
          id?: string
          owner_rating?: number | null
          pass_reason?: Database["public"]["Enums"]["pass_reason_type"] | null
        }
        Update: {
          connect_request_id?: string
          created_at?: string
          feedback_notes?: string | null
          id?: string
          owner_rating?: number | null
          pass_reason?: Database["public"]["Enums"]["pass_reason_type"] | null
        }
        Relationships: [
          {
            foreignKeyName: "match_feedback_loops_connect_request_id_fkey"
            columns: ["connect_request_id"]
            isOneToOne: true
            referencedRelation: "connect_requests"
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
          is_demo: boolean
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
          is_demo?: boolean
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
          is_demo?: boolean
          primary_link?: string | null
          reputation_score?: number
          skills?: string[]
          verification_status?: Database["public"]["Enums"]["verification_status"]
        }
        Relationships: []
      }
      project_bounties: {
        Row: {
          assignee_id: string | null
          builder_signed_at: string | null
          created_at: string
          currency: string
          delivery_url: string | null
          description: string
          duration: string
          funding_status: string
          id: string
          is_demo: boolean
          owner_signed_at: string | null
          payout_type: Database["public"]["Enums"]["bounty_payout"]
          project_id: string
          reward_amount: number
          status: Database["public"]["Enums"]["bounty_status"]
          tech_stack: string[]
          title: string
        }
        Insert: {
          assignee_id?: string | null
          builder_signed_at?: string | null
          created_at?: string
          currency?: string
          delivery_url?: string | null
          description?: string
          duration?: string
          funding_status?: string
          id?: string
          is_demo?: boolean
          owner_signed_at?: string | null
          payout_type?: Database["public"]["Enums"]["bounty_payout"]
          project_id: string
          reward_amount: number
          status?: Database["public"]["Enums"]["bounty_status"]
          tech_stack?: string[]
          title: string
        }
        Update: {
          assignee_id?: string | null
          builder_signed_at?: string | null
          created_at?: string
          currency?: string
          delivery_url?: string | null
          description?: string
          duration?: string
          funding_status?: string
          id?: string
          is_demo?: boolean
          owner_signed_at?: string | null
          payout_type?: Database["public"]["Enums"]["bounty_payout"]
          project_id?: string
          reward_amount?: number
          status?: Database["public"]["Enums"]["bounty_status"]
          tech_stack?: string[]
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_bounties_assignee_id_fkey"
            columns: ["assignee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_bounties_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "match_analytics"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "project_bounties_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
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
      project_merger_proposals: {
        Row: {
          created_at: string
          id: string
          proposer_id: string
          risk_tolerance: string
          source_project: string
          status: string
          target_project: string
          terms: string
        }
        Insert: {
          created_at?: string
          id?: string
          proposer_id: string
          risk_tolerance: string
          source_project: string
          status?: string
          target_project: string
          terms: string
        }
        Update: {
          created_at?: string
          id?: string
          proposer_id?: string
          risk_tolerance?: string
          source_project?: string
          status?: string
          target_project?: string
          terms?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_merger_proposals_proposer_id_fkey"
            columns: ["proposer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_merger_proposals_source_project_fkey"
            columns: ["source_project"]
            isOneToOne: false
            referencedRelation: "match_analytics"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "project_merger_proposals_source_project_fkey"
            columns: ["source_project"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_merger_proposals_target_project_fkey"
            columns: ["target_project"]
            isOneToOne: false
            referencedRelation: "match_analytics"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "project_merger_proposals_target_project_fkey"
            columns: ["target_project"]
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
          is_demo: boolean
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
          is_demo?: boolean
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
          is_demo?: boolean
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
      reciprocal_match_alerts: {
        Row: {
          builder_id: string
          created_at: string
          project_id: string
          similarity: number
        }
        Insert: {
          builder_id: string
          created_at?: string
          project_id: string
          similarity: number
        }
        Update: {
          builder_id?: string
          created_at?: string
          project_id?: string
          similarity?: number
        }
        Relationships: [
          {
            foreignKeyName: "reciprocal_match_alerts_builder_id_fkey"
            columns: ["builder_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reciprocal_match_alerts_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "match_analytics"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "reciprocal_match_alerts_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      scout_candidates: {
        Row: {
          created_at: string
          draft_pitch: string
          evidence_summary: string
          handle: string
          id: string
          project_id: string
          run_id: string
          source: string
          source_url: string
          status: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          draft_pitch: string
          evidence_summary: string
          handle: string
          id?: string
          project_id: string
          run_id: string
          source: string
          source_url: string
          status?: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          draft_pitch?: string
          evidence_summary?: string
          handle?: string
          id?: string
          project_id?: string
          run_id?: string
          source?: string
          source_url?: string
          status?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "scout_candidates_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "match_analytics"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "scout_candidates_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scout_candidates_run_id_fkey"
            columns: ["run_id"]
            isOneToOne: false
            referencedRelation: "scout_runs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scout_candidates_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      scout_processed_items: {
        Row: {
          completed_at: string
          item_key: string
          run_id: string
        }
        Insert: {
          completed_at?: string
          item_key: string
          run_id: string
        }
        Update: {
          completed_at?: string
          item_key?: string
          run_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "scout_processed_items_run_id_fkey"
            columns: ["run_id"]
            isOneToOne: false
            referencedRelation: "scout_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      scout_runs: {
        Row: {
          created_at: string
          id: string
          lease_token: string | null
          lease_until: string | null
          pause_reason: string | null
          project_id: string
          requested_by: string
          status: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          lease_token?: string | null
          lease_until?: string | null
          pause_reason?: string | null
          project_id: string
          requested_by: string
          status?: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          id?: string
          lease_token?: string | null
          lease_until?: string | null
          pause_reason?: string | null
          project_id?: string
          requested_by?: string
          status?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "scout_runs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "match_analytics"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "scout_runs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scout_runs_requested_by_fkey"
            columns: ["requested_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scout_runs_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_candidate_notes: {
        Row: {
          author_id: string
          created_at: string
          id: string
          note: string
          request_id: string
          workspace_id: string
        }
        Insert: {
          author_id: string
          created_at?: string
          id?: string
          note: string
          request_id: string
          workspace_id: string
        }
        Update: {
          author_id?: string
          created_at?: string
          id?: string
          note?: string
          request_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_candidate_notes_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workspace_candidate_notes_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "connect_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workspace_candidate_notes_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_candidates: {
        Row: {
          added_by: string
          builder_id: string
          stage: string
          workspace_id: string
        }
        Insert: {
          added_by: string
          builder_id: string
          stage?: string
          workspace_id: string
        }
        Update: {
          added_by?: string
          builder_id?: string
          stage?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_candidates_added_by_fkey"
            columns: ["added_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workspace_candidates_builder_id_fkey"
            columns: ["builder_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workspace_candidates_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_members: {
        Row: {
          role: Database["public"]["Enums"]["workspace_role"]
          user_id: string
          workspace_id: string
        }
        Insert: {
          role?: Database["public"]["Enums"]["workspace_role"]
          user_id: string
          workspace_id: string
        }
        Update: {
          role?: Database["public"]["Enums"]["workspace_role"]
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workspace_members_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_projects: {
        Row: {
          project_id: string
          workspace_id: string
        }
        Insert: {
          project_id: string
          workspace_id: string
        }
        Update: {
          project_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_projects_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: true
            referencedRelation: "match_analytics"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "workspace_projects_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: true
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workspace_projects_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspaces: {
        Row: {
          created_at: string
          domain: string | null
          id: string
          is_demo: boolean
          logo_url: string | null
          name: string
          owner_id: string | null
          slug: string
          tier: Database["public"]["Enums"]["workspace_tier"]
        }
        Insert: {
          created_at?: string
          domain?: string | null
          id?: string
          is_demo?: boolean
          logo_url?: string | null
          name: string
          owner_id?: string | null
          slug: string
          tier?: Database["public"]["Enums"]["workspace_tier"]
        }
        Update: {
          created_at?: string
          domain?: string | null
          id?: string
          is_demo?: boolean
          logo_url?: string | null
          name?: string
          owner_id?: string | null
          slug?: string
          tier?: Database["public"]["Enums"]["workspace_tier"]
        }
        Relationships: [
          {
            foreignKeyName: "workspaces_owner_id_fkey"
            columns: ["owner_id"]
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
      acquire_ecosystem_job: { Args: { _name: string }; Returns: boolean }
      applicant_semantic_scores: {
        Args: never
        Returns: {
          applicant_id: string
          project_id: string
          similarity: number
        }[]
      }
      attach_workspace_project: {
        Args: { _project: string; _workspace: string }
        Returns: undefined
      }
      available_builders: {
        Args: never
        Returns: {
          id: string
        }[]
      }
      bounty_action: {
        Args: { _action: string; _bounty: string; _delivery?: string }
        Returns: undefined
      }
      claim_scout_run: { Args: { _run: string }; Returns: string }
      create_bounty: {
        Args: {
          _amount: number
          _currency: string
          _description: string
          _duration: string
          _payout: Database["public"]["Enums"]["bounty_payout"]
          _project: string
          _title: string
        }
        Returns: string
      }
      create_workspace: {
        Args: { _name: string; _slug: string }
        Returns: string
      }
      decline_with_feedback: {
        Args: {
          _notes?: string
          _rating?: number
          _reason: Database["public"]["Enums"]["pass_reason_type"]
          _request_id: string
        }
        Returns: undefined
      }
      finish_scout_item: {
        Args: {
          _handle: string
          _pitch: string
          _run: string
          _source: string
          _summary: string
          _token: string
          _url: string
        }
        Returns: undefined
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
      instant_apply: { Args: { _project_id: string }; Returns: string }
      invite_builder: {
        Args: { _builder_id: string; _project_id: string }
        Returns: string
      }
      issue_verified_credential: {
        Args: {
          _claim: Database["public"]["Enums"]["credential_claim"]
          _event: string
          _source: string
        }
        Returns: string
      }
      manage_workspace_member: {
        Args: {
          _role: Database["public"]["Enums"]["workspace_role"]
          _user: string
          _workspace: string
        }
        Returns: undefined
      }
      my_semantic_scores: {
        Args: never
        Returns: {
          project_id: string
          similarity: number
        }[]
      }
      portfolio_pipeline: {
        Args: { _workspace: string }
        Returns: {
          builder_id: string
          builder_name: string
          created_at: string
          pitch_sentence: string
          project_id: string
          project_title: string
          request_id: string
          response_hours: number
          status: string
        }[]
      }
      profiles_missing_embeddings: {
        Args: never
        Returns: {
          github_stats: Json
          id: string
          skills: string[]
        }[]
      }
      projects_missing_embeddings: {
        Args: never
        Returns: {
          category: Database["public"]["Enums"]["project_category"]
          created_at: string
          entity_type: Database["public"]["Enums"]["entity_type"]
          id: string
          incentive: Database["public"]["Enums"]["incentive_type"]
          is_demo: boolean
          looking_for: string
          stage: Database["public"]["Enums"]["project_stage"]
          tagline: string
          tech_stack: string[]
          title: string
          user_id: string | null
        }[]
        SetofOptions: {
          from: "*"
          to: "projects"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      propose_merger: {
        Args: {
          _risk: string
          _source: string
          _target: string
          _terms: string
        }
        Returns: string
      }
      public_project_badge: {
        Args: { _project_id: string }
        Returns: {
          applicants: number
          looking_for: string
        }[]
      }
      queue_scout: {
        Args: { _project: string; _workspace: string }
        Returns: string
      }
      read_integration_secret: {
        Args: {
          _key: string
          _provider: Database["public"]["Enums"]["integration_provider"]
          _uid: string
        }
        Returns: string
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
      refresh_autonomous_matches: { Args: { _uid: string }; Returns: number }
      refresh_reciprocal_alerts: { Args: never; Returns: number }
      refresh_reputation: { Args: { _uid: string }; Returns: undefined }
      respond_merger: {
        Args: { _decision: string; _proposal: string }
        Returns: undefined
      }
      review_scout_candidate: {
        Args: { _candidate: string; _draft: string; _status: string }
        Returns: undefined
      }
      routing_match_score: { Args: { _request_id: string }; Returns: number }
      save_builder_passport: {
        Args: { _headline: string; _username: string }
        Returns: undefined
      }
      save_candidate_note: {
        Args: { _note: string; _request: string; _workspace: string }
        Returns: undefined
      }
      save_workspace_candidate: {
        Args: { _builder: string; _stage: string; _workspace: string }
        Returns: undefined
      }
      store_integration_secret: {
        Args: {
          _key: string
          _plaintext: string
          _provider: Database["public"]["Enums"]["integration_provider"]
          _uid: string
        }
        Returns: undefined
      }
      track_project_events: {
        Args: {
          _project_ids: string[]
          _type: Database["public"]["Enums"]["project_event_type"]
        }
        Returns: undefined
      }
      weekly_builder_matches: {
        Args: { _uid: string }
        Returns: {
          project_id: string
          score: number
          title: string
        }[]
      }
      workspace_access: {
        Args: { _manage?: boolean; _workspace: string }
        Returns: boolean
      }
    }
    Enums: {
      bounty_payout: "Milestone" | "Completion" | "RevShare"
      bounty_status: "open" | "assigned" | "submitted" | "paid"
      commitment_type:
        | "Side Project (<10h/wk)"
        | "Part-Time (10-20h/wk)"
        | "Full-Time Co-Founder"
      credential_claim:
        | "Top_1_Percent_Committer"
        | "Successful_Exit"
        | "AI_Ship_Streak"
      entity_type: "Solo Founder" | "Early Team" | "Company"
      incentive_type: "Equity" | "Paid" | "Equity + Paid" | "Open Source"
      integration_provider:
        | "slack"
        | "linear"
        | "notion"
        | "github"
        | "discord"
        | "telegram"
      location_type: "Remote-Only" | "Hybrid" | "On-Site"
      notification_type:
        | "new_connect_request"
        | "request_accepted"
        | "request_declined"
      pass_reason_type:
        | "stack_mismatch"
        | "overqualified"
        | "underqualified"
        | "time_commitment"
        | "no_response"
        | "position_filled"
      project_category: "AI/ML" | "SaaS" | "DevTools" | "Web3"
      project_event_type: "impression" | "click" | "reveal"
      project_stage: "Idea" | "Prototype" | "Live Revenue" | "Funded"
      proof_type: "github_repo" | "demo_video" | "live_metrics" | "deck_url"
      request_status: "pending" | "accepted" | "declined"
      verification_status: "unverified" | "github_verified" | "top_builder"
      workspace_role: "owner" | "admin" | "member" | "recruiter" | "founder"
      workspace_tier: "Free" | "Pro_Founder" | "Enterprise_VC"
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
      bounty_payout: ["Milestone", "Completion", "RevShare"],
      bounty_status: ["open", "assigned", "submitted", "paid"],
      commitment_type: [
        "Side Project (<10h/wk)",
        "Part-Time (10-20h/wk)",
        "Full-Time Co-Founder",
      ],
      credential_claim: [
        "Top_1_Percent_Committer",
        "Successful_Exit",
        "AI_Ship_Streak",
      ],
      entity_type: ["Solo Founder", "Early Team", "Company"],
      incentive_type: ["Equity", "Paid", "Equity + Paid", "Open Source"],
      integration_provider: [
        "slack",
        "linear",
        "notion",
        "github",
        "discord",
        "telegram",
      ],
      location_type: ["Remote-Only", "Hybrid", "On-Site"],
      notification_type: [
        "new_connect_request",
        "request_accepted",
        "request_declined",
      ],
      pass_reason_type: [
        "stack_mismatch",
        "overqualified",
        "underqualified",
        "time_commitment",
        "no_response",
        "position_filled",
      ],
      project_category: ["AI/ML", "SaaS", "DevTools", "Web3"],
      project_event_type: ["impression", "click", "reveal"],
      project_stage: ["Idea", "Prototype", "Live Revenue", "Funded"],
      proof_type: ["github_repo", "demo_video", "live_metrics", "deck_url"],
      request_status: ["pending", "accepted", "declined"],
      verification_status: ["unverified", "github_verified", "top_builder"],
      workspace_role: ["owner", "admin", "member", "recruiter", "founder"],
      workspace_tier: ["Free", "Pro_Founder", "Enterprise_VC"],
    },
  },
} as const
