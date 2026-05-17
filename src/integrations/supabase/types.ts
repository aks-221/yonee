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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      announcements: {
        Row: {
          active: boolean
          arrival_date: string | null
          capacity_kg: number
          created_at: string
          currency: string
          departure_date: string
          from_city: string
          from_country: string
          from_country_code: string | null
          from_flag: string | null
          from_lat: number | null
          from_lng: number | null
          gp_id: string
          gp_mode: Database["public"]["Enums"]["gp_mode"]
          id: string
          notes: string | null
          photo_urls: string[]
          price_per_kg: number
          remaining_kg: number
          status: Database["public"]["Enums"]["verification_status"]
          to_city: string
          to_country: string
          to_country_code: string | null
          to_flag: string | null
          to_lat: number | null
          to_lng: number | null
          transport: Database["public"]["Enums"]["transport_mode"]
        }
        Insert: {
          active?: boolean
          arrival_date?: string | null
          capacity_kg: number
          created_at?: string
          currency?: string
          departure_date: string
          from_city: string
          from_country: string
          from_country_code?: string | null
          from_flag?: string | null
          from_lat?: number | null
          from_lng?: number | null
          gp_id: string
          gp_mode?: Database["public"]["Enums"]["gp_mode"]
          id?: string
          notes?: string | null
          photo_urls?: string[]
          price_per_kg: number
          remaining_kg: number
          status?: Database["public"]["Enums"]["verification_status"]
          to_city: string
          to_country: string
          to_country_code?: string | null
          to_flag?: string | null
          to_lat?: number | null
          to_lng?: number | null
          transport?: Database["public"]["Enums"]["transport_mode"]
        }
        Update: {
          active?: boolean
          arrival_date?: string | null
          capacity_kg?: number
          created_at?: string
          currency?: string
          departure_date?: string
          from_city?: string
          from_country?: string
          from_country_code?: string | null
          from_flag?: string | null
          from_lat?: number | null
          from_lng?: number | null
          gp_id?: string
          gp_mode?: Database["public"]["Enums"]["gp_mode"]
          id?: string
          notes?: string | null
          photo_urls?: string[]
          price_per_kg?: number
          remaining_kg?: number
          status?: Database["public"]["Enums"]["verification_status"]
          to_city?: string
          to_country?: string
          to_country_code?: string | null
          to_flag?: string | null
          to_lat?: number | null
          to_lng?: number | null
          transport?: Database["public"]["Enums"]["transport_mode"]
        }
        Relationships: []
      }
      gp_documents: {
        Row: {
          created_at: string
          doc_type: string
          file_path: string
          id: string
          rejection_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["verification_status"]
          user_id: string
        }
        Insert: {
          created_at?: string
          doc_type: string
          file_path: string
          id?: string
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["verification_status"]
          user_id: string
        }
        Update: {
          created_at?: string
          doc_type?: string
          file_path?: string
          id?: string
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["verification_status"]
          user_id?: string
        }
        Relationships: []
      }
      gp_locations: {
        Row: {
          gp_id: string
          id: string
          lat: number
          lng: number
          recorded_at: string
          reservation_id: string | null
        }
        Insert: {
          gp_id: string
          id?: string
          lat: number
          lng: number
          recorded_at?: string
          reservation_id?: string | null
        }
        Update: {
          gp_id?: string
          id?: string
          lat?: number
          lng?: number
          recorded_at?: string
          reservation_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "gp_locations_reservation_id_fkey"
            columns: ["reservation_id"]
            isOneToOne: false
            referencedRelation: "reservations"
            referencedColumns: ["id"]
          },
        ]
      }
      gp_verification: {
        Row: {
          created_at: string
          notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["verification_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["verification_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["verification_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          id: string
          read: boolean
          title: string
          type: string | null
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          read?: boolean
          title: string
          type?: string | null
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          read?: boolean
          title?: string
          type?: string | null
          user_id?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          currency: string
          id: string
          method: string
          paid_at: string | null
          provider_ref: string | null
          reservation_id: string
          status: Database["public"]["Enums"]["payment_status"]
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          currency: string
          id?: string
          method: string
          paid_at?: string | null
          provider_ref?: string | null
          reservation_id: string
          status?: Database["public"]["Enums"]["payment_status"]
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          id?: string
          method?: string
          paid_at?: string | null
          provider_ref?: string | null
          reservation_id?: string
          status?: Database["public"]["Enums"]["payment_status"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_reservation_id_fkey"
            columns: ["reservation_id"]
            isOneToOne: false
            referencedRelation: "reservations"
            referencedColumns: ["id"]
          },
        ]
      }
      payouts: {
        Row: {
          amount: number
          currency: string
          destination: string
          destination_account: string
          id: string
          processed_at: string | null
          requested_at: string
          status: Database["public"]["Enums"]["payout_status"]
          user_id: string
        }
        Insert: {
          amount: number
          currency?: string
          destination: string
          destination_account: string
          id?: string
          processed_at?: string | null
          requested_at?: string
          status?: Database["public"]["Enums"]["payout_status"]
          user_id: string
        }
        Update: {
          amount?: number
          currency?: string
          destination?: string
          destination_account?: string
          id?: string
          processed_at?: string | null
          requested_at?: string
          status?: Database["public"]["Enums"]["payout_status"]
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          address: string | null
          avatar_url: string | null
          bank_holder: string | null
          bank_iban: string | null
          bank_name: string | null
          bio: string | null
          city: string | null
          country: string | null
          country_code: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          is_banned: boolean
          lat: number | null
          lng: number | null
          locale: string
          location_consent: boolean
          om_account: string | null
          om_country: string | null
          phone: string | null
          updated_at: string
          wave_account: string | null
          wave_country: string | null
          whatsapp: string | null
        }
        Insert: {
          address?: string | null
          avatar_url?: string | null
          bank_holder?: string | null
          bank_iban?: string | null
          bank_name?: string | null
          bio?: string | null
          city?: string | null
          country?: string | null
          country_code?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          is_banned?: boolean
          lat?: number | null
          lng?: number | null
          locale?: string
          location_consent?: boolean
          om_account?: string | null
          om_country?: string | null
          phone?: string | null
          updated_at?: string
          wave_account?: string | null
          wave_country?: string | null
          whatsapp?: string | null
        }
        Update: {
          address?: string | null
          avatar_url?: string | null
          bank_holder?: string | null
          bank_iban?: string | null
          bank_name?: string | null
          bio?: string | null
          city?: string | null
          country?: string | null
          country_code?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          is_banned?: boolean
          lat?: number | null
          lng?: number | null
          locale?: string
          location_consent?: boolean
          om_account?: string | null
          om_country?: string | null
          phone?: string | null
          updated_at?: string
          wave_account?: string | null
          wave_country?: string | null
          whatsapp?: string | null
        }
        Relationships: []
      }
      reservations: {
        Row: {
          accepted_at: string | null
          amount: number
          announcement_id: string | null
          arrived_at: string | null
          cancelled_at: string | null
          client_id: string
          code: string
          created_at: string
          currency: string
          delivered_at: string | null
          from_city: string | null
          gp_id: string
          id: string
          in_transit_at: string | null
          paid_at: string | null
          payment_method: string | null
          picked_up_at: string | null
          qr_payload: string | null
          receiver_address: string | null
          receiver_name: string | null
          receiver_phone: string | null
          refunded_at: string | null
          rejected_at: string | null
          rejection_reason: string | null
          sender_name: string | null
          sender_phone: string | null
          status: Database["public"]["Enums"]["reservation_status"]
          to_city: string | null
          unlocked: boolean
          weight_kg: number
        }
        Insert: {
          accepted_at?: string | null
          amount: number
          announcement_id?: string | null
          arrived_at?: string | null
          cancelled_at?: string | null
          client_id: string
          code: string
          created_at?: string
          currency?: string
          delivered_at?: string | null
          from_city?: string | null
          gp_id: string
          id?: string
          in_transit_at?: string | null
          paid_at?: string | null
          payment_method?: string | null
          picked_up_at?: string | null
          qr_payload?: string | null
          receiver_address?: string | null
          receiver_name?: string | null
          receiver_phone?: string | null
          refunded_at?: string | null
          rejected_at?: string | null
          rejection_reason?: string | null
          sender_name?: string | null
          sender_phone?: string | null
          status?: Database["public"]["Enums"]["reservation_status"]
          to_city?: string | null
          unlocked?: boolean
          weight_kg: number
        }
        Update: {
          accepted_at?: string | null
          amount?: number
          announcement_id?: string | null
          arrived_at?: string | null
          cancelled_at?: string | null
          client_id?: string
          code?: string
          created_at?: string
          currency?: string
          delivered_at?: string | null
          from_city?: string | null
          gp_id?: string
          id?: string
          in_transit_at?: string | null
          paid_at?: string | null
          payment_method?: string | null
          picked_up_at?: string | null
          qr_payload?: string | null
          receiver_address?: string | null
          receiver_name?: string | null
          receiver_phone?: string | null
          refunded_at?: string | null
          rejected_at?: string | null
          rejection_reason?: string | null
          sender_name?: string | null
          sender_phone?: string | null
          status?: Database["public"]["Enums"]["reservation_status"]
          to_city?: string | null
          unlocked?: boolean
          weight_kg?: number
        }
        Relationships: [
          {
            foreignKeyName: "reservations_announcement_id_fkey"
            columns: ["announcement_id"]
            isOneToOne: false
            referencedRelation: "announcements"
            referencedColumns: ["id"]
          },
        ]
      }
      topups: {
        Row: {
          amount: number
          confirmed_at: string | null
          created_at: string
          currency: string
          id: string
          reference: string | null
          source: string
          status: Database["public"]["Enums"]["payment_status"]
          user_id: string
        }
        Insert: {
          amount: number
          confirmed_at?: string | null
          created_at?: string
          currency?: string
          id?: string
          reference?: string | null
          source: string
          status?: Database["public"]["Enums"]["payment_status"]
          user_id: string
        }
        Update: {
          amount?: number
          confirmed_at?: string | null
          created_at?: string
          currency?: string
          id?: string
          reference?: string | null
          source?: string
          status?: Database["public"]["Enums"]["payment_status"]
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      wallets: {
        Row: {
          balance: number
          currency: string
          updated_at: string
          user_id: string
        }
        Insert: {
          balance?: number
          currency?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          balance?: number
          currency?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      admin_kpis: {
        Row: {
          active_announcements: number | null
          gmv: number | null
          gp_count: number | null
          gp_pending: number | null
          payments_pending: number | null
          reservations_count: number | null
          users_count: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      admin_confirm_topup: { Args: { _topup_id: string }; Returns: boolean }
      bootstrap_admin: { Args: never; Returns: boolean }
      cancel_reservation: {
        Args: { _reason?: string; _reservation_id: string }
        Returns: boolean
      }
      confirm_payment_received: {
        Args: { _reservation_id: string }
        Returns: boolean
      }
      create_reservation_from_announcement: {
        Args: {
          _announcement_id: string
          _payment_method?: string
          _receiver_address: string
          _receiver_name: string
          _receiver_phone: string
          _sender_name: string
          _sender_phone: string
          _weight_kg: number
        }
        Returns: string
      }
      distance_km: {
        Args: { lat1: number; lat2: number; lng1: number; lng2: number }
        Returns: number
      }
      get_user_roles: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"][]
      }
      gp_advance_reservation: {
        Args: { _action?: string; _reason?: string; _reservation_code: string }
        Returns: {
          accepted_at: string | null
          amount: number
          announcement_id: string | null
          arrived_at: string | null
          cancelled_at: string | null
          client_id: string
          code: string
          created_at: string
          currency: string
          delivered_at: string | null
          from_city: string | null
          gp_id: string
          id: string
          in_transit_at: string | null
          paid_at: string | null
          payment_method: string | null
          picked_up_at: string | null
          qr_payload: string | null
          receiver_address: string | null
          receiver_name: string | null
          receiver_phone: string | null
          refunded_at: string | null
          rejected_at: string | null
          rejection_reason: string | null
          sender_name: string | null
          sender_phone: string | null
          status: Database["public"]["Enums"]["reservation_status"]
          to_city: string | null
          unlocked: boolean
          weight_kg: number
        }
        SetofOptions: {
          from: "*"
          to: "reservations"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      gp_review_reservation: {
        Args: { _accept: boolean; _reason?: string; _reservation_id: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
      request_payout: {
        Args: { _account: string; _amount: number; _destination: string }
        Returns: string
      }
      wallet_topup_request: {
        Args: { _amount: number; _reference: string; _source: string }
        Returns: string
      }
    }
    Enums: {
      app_role:
        | "client"
        | "merchant"
        | "supplier"
        | "gp_standard"
        | "gp_express"
        | "admin"
      gp_mode: "standard" | "express"
      payment_status: "pending" | "succeeded" | "failed" | "refunded"
      payout_status: "pending" | "processing" | "paid" | "failed"
      reservation_status:
        | "pending"
        | "accepted"
        | "paid"
        | "rejected"
        | "picked_up"
        | "in_transit"
        | "arrived"
        | "delivered"
        | "cancelled"
        | "refunded"
      transport_mode: "air" | "sea" | "road"
      verification_status: "pending" | "validated" | "rejected"
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
      app_role: [
        "client",
        "merchant",
        "supplier",
        "gp_standard",
        "gp_express",
        "admin",
      ],
      gp_mode: ["standard", "express"],
      payment_status: ["pending", "succeeded", "failed", "refunded"],
      payout_status: ["pending", "processing", "paid", "failed"],
      reservation_status: [
        "pending",
        "accepted",
        "paid",
        "rejected",
        "picked_up",
        "in_transit",
        "arrived",
        "delivered",
        "cancelled",
        "refunded",
      ],
      transport_mode: ["air", "sea", "road"],
      verification_status: ["pending", "validated", "rejected"],
    },
  },
} as const
