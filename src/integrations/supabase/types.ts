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
      invoices: {
        Row: {
          business_logo: string | null
          business_name: string
          client_address: string | null
          client_contact: string | null
          client_name: string
          created_at: string
          due_date: string
          id: string
          invoice_date: string
          invoice_number: string
          items: Json
          notes: string | null
          payment_info: Json | null
          signature_font: string | null
          signature_image: string | null
          signature_name: string | null
          social_media: Json | null
          status: string
          tax: number | null
          template: string
          updated_at: string
          user_id: string
        }
        Insert: {
          business_logo?: string | null
          business_name: string
          client_address?: string | null
          client_contact?: string | null
          client_name: string
          created_at?: string
          due_date: string
          id?: string
          invoice_date: string
          invoice_number: string
          items: Json
          notes?: string | null
          payment_info?: Json | null
          signature_font?: string | null
          signature_image?: string | null
          signature_name?: string | null
          social_media?: Json | null
          status?: string
          tax?: number | null
          template?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          business_logo?: string | null
          business_name?: string
          client_address?: string | null
          client_contact?: string | null
          client_name?: string
          created_at?: string
          due_date?: string
          id?: string
          invoice_date?: string
          invoice_number?: string
          items?: Json
          notes?: string | null
          payment_info?: Json | null
          signature_font?: string | null
          signature_image?: string | null
          signature_name?: string | null
          social_media?: Json | null
          status?: string
          tax?: number | null
          template?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoices_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "pin_users"
            referencedColumns: ["id"]
          },
        ]
      }
      pin_users: {
        Row: {
          created_at: string
          id: string
          name: string
          pin: string
          updated_at: string
          username: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          pin: string
          updated_at?: string
          username: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          pin?: string
          updated_at?: string
          username?: string
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
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "pin_users"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      change_user_pin: {
        Args: { _new_pin: string; _old_pin: string; _user_id: string }
        Returns: boolean
      }
      create_invoice: {
        Args: {
          _business_logo: string
          _business_name: string
          _client_address: string
          _client_contact: string
          _client_name: string
          _due_date: string
          _invoice_date: string
          _invoice_number: string
          _items: Json
          _notes: string
          _payment_info: Json
          _signature_font: string
          _signature_image: string
          _signature_name: string
          _social_media: Json
          _status: string
          _tax: number
          _template: string
          _user_id: string
        }
        Returns: string
      }
      create_pin_user: {
        Args: {
          _caller_id?: string
          _name: string
          _pin: string
          _role?: Database["public"]["Enums"]["app_role"]
          _username: string
        }
        Returns: string
      }
      delete_invoice: {
        Args: { _invoice_id: string; _user_id: string }
        Returns: boolean
      }
      delete_pin_user:
        | { Args: { _user_id: string }; Returns: boolean }
        | { Args: { _caller_id?: string; _user_id: string }; Returns: boolean }
      fetch_user_invoices: {
        Args: { _user_id: string }
        Returns: {
          business_logo: string
          business_name: string
          client_address: string
          client_contact: string
          client_name: string
          created_at: string
          due_date: string
          id: string
          invoice_date: string
          invoice_number: string
          items: Json
          notes: string
          payment_info: Json
          signature_font: string
          signature_image: string
          signature_name: string
          social_media: Json
          status: string
          tax: number
          template: string
          updated_at: string
          user_id: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      list_all_users: {
        Args: { _caller_id: string }
        Returns: {
          created_at: string
          user_id: string
          user_name: string
          user_role: Database["public"]["Enums"]["app_role"]
          username: string
        }[]
      }
      update_invoice: {
        Args: {
          _business_logo: string
          _business_name: string
          _client_address: string
          _client_contact: string
          _client_name: string
          _due_date: string
          _invoice_date: string
          _invoice_id: string
          _invoice_number: string
          _items: Json
          _notes: string
          _payment_info: Json
          _signature_font: string
          _signature_image: string
          _signature_name: string
          _social_media: Json
          _status: string
          _tax: number
          _template: string
          _user_id: string
        }
        Returns: boolean
      }
      update_user_profile: {
        Args: { _name: string; _user_id: string; _username: string }
        Returns: boolean
      }
      verify_pin: {
        Args: { _pin: string; _username: string }
        Returns: {
          user_id: string
          user_name: string
          user_role: Database["public"]["Enums"]["app_role"]
        }[]
      }
    }
    Enums: {
      app_role: "admin" | "user"
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
      app_role: ["admin", "user"],
    },
  },
} as const
