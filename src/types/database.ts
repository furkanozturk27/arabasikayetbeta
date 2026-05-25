// =============================================
// arabaşikayet — Tam Veritabanı Tipi Tanımları
// =============================================

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          avatar_url: string | null;
          trust_score: number;
          verified_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          avatar_url?: string | null;
          trust_score?: number;
          verified_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          trust_score?: number;
          verified_at?: string | null;
          updated_at?: string;
        };
      };
      vehicles: {
        Row: {
          id: string;
          brand: string;
          model: string;
          year: number;
          engine: string;
          trim: string | null;
          transmission: 'manual' | 'automatic' | 'cvt' | 'dct';
          fuel_type: 'gasoline' | 'diesel' | 'hybrid' | 'electric' | 'lpg';
          created_at: string;
        };
        Insert: {
          id?: string;
          brand: string;
          model: string;
          year: number;
          engine: string;
          trim?: string | null;
          transmission: 'manual' | 'automatic' | 'cvt' | 'dct';
          fuel_type: 'gasoline' | 'diesel' | 'hybrid' | 'electric' | 'lpg';
          created_at?: string;
        };
        Update: {
          brand?: string;
          model?: string;
          year?: number;
          engine?: string;
          trim?: string | null;
          transmission?: 'manual' | 'automatic' | 'cvt' | 'dct';
          fuel_type?: 'gasoline' | 'diesel' | 'hybrid' | 'electric' | 'lpg';
        };
      };
      complaints: {
        Row: {
          id: string;
          user_id: string;
          vehicle_id: string;
          category: ComplaintCategory;
          symptoms: string[];
          km_at_complaint: number;
          description: string | null;
          severity: 1 | 2 | 3 | 4 | 5;
          is_recurring: boolean;
          is_chronic: boolean;
          helpful_count: number;
          not_helpful_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          vehicle_id: string;
          category: ComplaintCategory;
          symptoms: string[];
          km_at_complaint: number;
          description?: string | null;
          severity: 1 | 2 | 3 | 4 | 5;
          is_recurring?: boolean;
          is_chronic?: boolean;
          helpful_count?: number;
          not_helpful_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          category?: ComplaintCategory;
          symptoms?: string[];
          km_at_complaint?: number;
          description?: string | null;
          severity?: 1 | 2 | 3 | 4 | 5;
          is_recurring?: boolean;
          is_chronic?: boolean;
          helpful_count?: number;
          not_helpful_count?: number;
          updated_at?: string;
        };
      };
      ai_analyses: {
        Row: {
          id: string;
          complaint_id: string;
          verdict: 'chronic' | 'common' | 'isolated' | 'user_error';
          summary: string;
          similar_complaint_ids: string[];
          insights: string;
          confidence_score: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          complaint_id: string;
          verdict: 'chronic' | 'common' | 'isolated' | 'user_error';
          summary: string;
          similar_complaint_ids?: string[];
          insights: string;
          confidence_score: number;
          created_at?: string;
        };
        Update: Record<string, never>;
      };
      vehicle_logs: {
        Row: {
          id: string;
          user_id: string;
          vehicle_id: string;
          type: 'km_record' | 'service' | 'repair' | 'purchase' | 'sale' | 'note';
          km: number | null;
          note: string | null;
          cost: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          vehicle_id: string;
          type: 'km_record' | 'service' | 'repair' | 'purchase' | 'sale' | 'note';
          km?: number | null;
          note?: string | null;
          cost?: number | null;
          created_at?: string;
        };
        Update: {
          km?: number | null;
          note?: string | null;
          cost?: number | null;
        };
      };
      verifications: {
        Row: {
          id: string;
          user_id: string;
          type: 'phone' | 'vin' | 'registration' | 'service_invoice';
          data_hash: string;
          trust_points: number;
          vehicle_id: string | null;
          complaint_id: string | null;
          verified_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          type: 'phone' | 'vin' | 'registration' | 'service_invoice';
          data_hash: string;
          trust_points: number;
          vehicle_id?: string | null;
          complaint_id?: string | null;
          verified_at?: string;
        };
        Update: Record<string, never>;
      };
      badges: {
        Row: {
          id: string;
          user_id: string;
          badge_type: BadgeType;
          earned_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          badge_type: BadgeType;
          earned_at?: string;
        };
        Update: Record<string, never>;
      };
      user_vehicles: {
        Row: {
          id: string;
          user_id: string;
          vehicle_id: string;
          vin_last6: string | null;
          purchase_year: number | null;
          is_current: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          vehicle_id: string;
          vin_last6?: string | null;
          purchase_year?: number | null;
          is_current?: boolean;
          created_at?: string;
        };
        Update: {
          vin_last6?: string | null;
          purchase_year?: number | null;
          is_current?: boolean;
        };
      };
    };
    Views: {
      chronic_issues_view: {
        Row: {
          vehicle_id: string;
          brand: string;
          model: string;
          year: number;
          engine: string;
          category: ComplaintCategory;
          complaint_count: number;
          chronic_rate: number;
          avg_km: number;
          km_p10: number;
          km_p90: number;
        };
      };
    };
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}

export type ComplaintCategory =
  | 'engine'
  | 'transmission'
  | 'brakes'
  | 'suspension'
  | 'electrical'
  | 'ac_heating'
  | 'fuel_system'
  | 'exhaust'
  | 'body_paint'
  | 'interior'
  | 'safety_systems'
  | 'steering'
  | 'tires_wheels'
  | 'other';

export type BadgeType =
  | 'first_complaint'
  | 'verified_owner'
  | 'trusted_reporter'
  | 'community_helper'
  | 'veteran_driver';

// Convenience row types
export type UserRow = Database['public']['Tables']['users']['Row'];
export type VehicleRow = Database['public']['Tables']['vehicles']['Row'];
export type ComplaintRow = Database['public']['Tables']['complaints']['Row'];
export type AiAnalysisRow = Database['public']['Tables']['ai_analyses']['Row'];
export type VehicleLogRow = Database['public']['Tables']['vehicle_logs']['Row'];
export type VerificationRow = Database['public']['Tables']['verifications']['Row'];
export type BadgeRow = Database['public']['Tables']['badges']['Row'];
export type UserVehicleRow = Database['public']['Tables']['user_vehicles']['Row'];
