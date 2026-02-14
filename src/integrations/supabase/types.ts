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
      activity_logs: {
        Row: {
          action_type: Database["public"]["Enums"]["action_type"]
          changes: Json | null
          created_at: string
          entity_id: string
          entity_type: Database["public"]["Enums"]["entity_type"]
          id: string
          team_id: string
          user_id: string | null
          user_name: string | null
        }
        Insert: {
          action_type: Database["public"]["Enums"]["action_type"]
          changes?: Json | null
          created_at?: string
          entity_id: string
          entity_type: Database["public"]["Enums"]["entity_type"]
          id?: string
          team_id: string
          user_id?: string | null
          user_name?: string | null
        }
        Update: {
          action_type?: Database["public"]["Enums"]["action_type"]
          changes?: Json | null
          created_at?: string
          entity_id?: string
          entity_type?: Database["public"]["Enums"]["entity_type"]
          id?: string
          team_id?: string
          user_id?: string | null
          user_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "activity_logs_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      ad_accounts: {
        Row: {
          bm_id: string | null
          created_at: string
          id: string
          name: string
          team_id: string
        }
        Insert: {
          bm_id?: string | null
          created_at?: string
          id?: string
          name: string
          team_id: string
        }
        Update: {
          bm_id?: string | null
          created_at?: string
          id?: string
          name?: string
          team_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ad_accounts_bm_id_fkey"
            columns: ["bm_id"]
            isOneToOne: false
            referencedRelation: "bms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_accounts_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      bms: {
        Row: {
          bm_id_facebook: string | null
          created_at: string
          id: string
          name: string
          team_id: string
        }
        Insert: {
          bm_id_facebook?: string | null
          created_at?: string
          id?: string
          name: string
          team_id: string
        }
        Update: {
          bm_id_facebook?: string | null
          created_at?: string
          id?: string
          name?: string
          team_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bms_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      facebook_profiles: {
        Row: {
          created_at: string
          date_blocked: string | null
          date_received: string | null
          email_login: string | null
          id: string
          name: string
          profile_link: string | null
          role_in_bm: Database["public"]["Enums"]["bm_role"] | null
          status: Database["public"]["Enums"]["fb_profile_status"]
          team_id: string
        }
        Insert: {
          created_at?: string
          date_blocked?: string | null
          date_received?: string | null
          email_login?: string | null
          id?: string
          name: string
          profile_link?: string | null
          role_in_bm?: Database["public"]["Enums"]["bm_role"] | null
          status?: Database["public"]["Enums"]["fb_profile_status"]
          team_id: string
        }
        Update: {
          created_at?: string
          date_blocked?: string | null
          date_received?: string | null
          email_login?: string | null
          id?: string
          name?: string
          profile_link?: string | null
          role_in_bm?: Database["public"]["Enums"]["bm_role"] | null
          status?: Database["public"]["Enums"]["fb_profile_status"]
          team_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "facebook_profiles_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      pages: {
        Row: {
          account_status:
            | Database["public"]["Enums"]["account_status_type"]
            | null
          created_at: string
          current_ad_account_id: string | null
          current_bm_id: string | null
          current_manager_id: string | null
          id: string
          name: string
          origin_bm_id: string | null
          status: Database["public"]["Enums"]["page_status"]
          team_id: string
          url: string | null
          usage_date: string | null
        }
        Insert: {
          account_status?:
            | Database["public"]["Enums"]["account_status_type"]
            | null
          created_at?: string
          current_ad_account_id?: string | null
          current_bm_id?: string | null
          current_manager_id?: string | null
          id?: string
          name: string
          origin_bm_id?: string | null
          status?: Database["public"]["Enums"]["page_status"]
          team_id: string
          url?: string | null
          usage_date?: string | null
        }
        Update: {
          account_status?:
            | Database["public"]["Enums"]["account_status_type"]
            | null
          created_at?: string
          current_ad_account_id?: string | null
          current_bm_id?: string | null
          current_manager_id?: string | null
          id?: string
          name?: string
          origin_bm_id?: string | null
          status?: Database["public"]["Enums"]["page_status"]
          team_id?: string
          url?: string | null
          usage_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pages_current_ad_account_id_fkey"
            columns: ["current_ad_account_id"]
            isOneToOne: false
            referencedRelation: "ad_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pages_current_bm_id_fkey"
            columns: ["current_bm_id"]
            isOneToOne: false
            referencedRelation: "bms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pages_origin_bm_id_fkey"
            columns: ["origin_bm_id"]
            isOneToOne: false
            referencedRelation: "bms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pages_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      profile_bm_links: {
        Row: {
          bm_id: string
          id: string
          profile_id: string
        }
        Insert: {
          bm_id: string
          id?: string
          profile_id: string
        }
        Update: {
          bm_id?: string
          id?: string
          profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profile_bm_links_bm_id_fkey"
            columns: ["bm_id"]
            isOneToOne: false
            referencedRelation: "bms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profile_bm_links_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "facebook_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          id: string
          is_active: boolean
          name: string
          team_id: string | null
        }
        Insert: {
          created_at?: string
          email?: string | null
          id: string
          is_active?: boolean
          name: string
          team_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean
          name?: string
          team_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      teams: {
        Row: {
          created_at: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
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
      get_user_team_id: { Args: { _user_id: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      account_status_type: "ativo" | "rejeitado" | "desativado" | "em_analise"
      action_type: "create" | "update" | "delete"
      app_role: "admin" | "gestor" | "auxiliar"
      bm_role: "administrador" | "anunciante"
      entity_type: "page" | "profile" | "bm" | "ad_account"
      fb_profile_status: "ativo" | "analise" | "bloqueado"
      page_status: "disponivel" | "em_uso" | "caiu" | "restrita"
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
      account_status_type: ["ativo", "rejeitado", "desativado", "em_analise"],
      action_type: ["create", "update", "delete"],
      app_role: ["admin", "gestor", "auxiliar"],
      bm_role: ["administrador", "anunciante"],
      entity_type: ["page", "profile", "bm", "ad_account"],
      fb_profile_status: ["ativo", "analise", "bloqueado"],
      page_status: ["disponivel", "em_uso", "caiu", "restrita"],
    },
  },
} as const
