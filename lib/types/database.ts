// TODO: Regenerate this file dynamically using the Supabase CLI when remote database credentials are configured:
// npx supabase gen types typescript --project-id hapjpmyiygksptzodowp > lib/types/database.ts

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      cities: {
        Row: {
          id: string
          slug: string
          name: string
          region: string | null
          intro_html: string | null
          latitude: number | null
          longitude: number | null
          is_published: boolean
          venue_count: number
          created_at: string
        }
        Insert: {
          id?: string
          slug: string
          name: string
          region?: string | null
          intro_html?: string | null
          latitude?: number | null
          longitude?: number | null
          is_published?: boolean
          venue_count?: number
          created_at?: string
        }
        Update: {
          id?: string
          slug?: string
          name?: string
          region?: string | null
          intro_html?: string | null
          latitude?: number | null
          longitude?: number | null
          is_published?: boolean
          venue_count?: number
          created_at?: string
        }
      }
      venues: {
        Row: {
          id: string
          city_id: string
          slug: string
          name: string
          google_place_id: string | null
          address: string | null
          district: string | null
          latitude: number | null
          longitude: number | null
          phone: string | null
          website: string | null
          hours_json: Json | null
          description: string | null
          description_ai_version: string | null
          description_edited_by_human: boolean
          highlights: string[] | null
          serves_eg_bodega: boolean
          served_with_bodega_glass: boolean | null
          served_temperature_ok: boolean | null
          pour_quality_ai_score: number | null
          pour_quality_ai_notes: string | null
          cluster_tags: string[] | null
          cover_image_url: string | null
          embedding: string | null
          status: 'draft' | 'published' | 'archived'
          published_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          city_id: string
          slug: string
          name: string
          google_place_id?: string | null
          address?: string | null
          district?: string | null
          latitude?: number | null
          longitude?: number | null
          phone?: string | null
          website?: string | null
          hours_json?: Json | null
          description?: string | null
          description_ai_version?: string | null
          description_edited_by_human?: boolean
          highlights?: string[] | null
          serves_eg_bodega?: boolean
          served_with_bodega_glass?: boolean | null
          served_temperature_ok?: boolean | null
          pour_quality_ai_score?: number | null
          pour_quality_ai_notes?: string | null
          cluster_tags?: string[] | null
          cover_image_url?: string | null
          embedding?: string | null
          status?: 'draft' | 'published' | 'archived'
          published_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          city_id?: string
          slug?: string
          name?: string
          google_place_id?: string | null
          address?: string | null
          district?: string | null
          latitude?: number | null
          longitude?: number | null
          phone?: string | null
          website?: string | null
          hours_json?: Json | null
          description?: string | null
          description_ai_version?: string | null
          description_edited_by_human?: boolean
          highlights?: string[] | null
          serves_eg_bodega?: boolean
          served_with_bodega_glass?: boolean | null
          served_temperature_ok?: boolean | null
          pour_quality_ai_score?: number | null
          pour_quality_ai_notes?: string | null
          cluster_tags?: string[] | null
          cover_image_url?: string | null
          embedding?: string | null
          status?: 'draft' | 'published' | 'archived'
          published_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      venue_suggestions: {
        Row: {
          id: string
          city_id: string | null
          city_name_freetext: string | null
          venue_name: string
          address: string | null
          google_place_id: string | null
          notes: string | null
          submitter_email: string | null
          notify_when_published: boolean
          ai_quality_score: number | null
          ai_classification: string | null
          ai_duplicate_of: string | null
          ai_notes: string | null
          ai_processed_at: string | null
          ai_prompt_version: string | null
          status: 'pending' | 'approved' | 'rejected' | 'duplicate'
          reviewed_at: string | null
          review_notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          city_id?: string | null
          city_name_freetext?: string | null
          venue_name: string
          address?: string | null
          google_place_id?: string | null
          notes?: string | null
          submitter_email?: string | null
          notify_when_published?: boolean
          ai_quality_score?: number | null
          ai_classification?: string | null
          ai_duplicate_of?: string | null
          ai_notes?: string | null
          ai_processed_at?: string | null
          ai_prompt_version?: string | null
          status?: 'pending' | 'approved' | 'rejected' | 'duplicate'
          reviewed_at?: string | null
          review_notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          city_id?: string | null
          city_name_freetext?: string | null
          venue_name?: string
          address?: string | null
          google_place_id?: string | null
          notes?: string | null
          submitter_email?: string | null
          notify_when_published?: boolean
          ai_quality_score?: number | null
          ai_classification?: string | null
          ai_duplicate_of?: string | null
          ai_notes?: string | null
          ai_processed_at?: string | null
          ai_prompt_version?: string | null
          status?: 'pending' | 'approved' | 'rejected' | 'duplicate'
          reviewed_at?: string | null
          review_notes?: string | null
          created_at?: string
        }
      }
    }
  }
}

export type City = Database['public']['Tables']['cities']['Row']
export type Venue = Database['public']['Tables']['venues']['Row']
export type VenueSuggestion = Database['public']['Tables']['venue_suggestions']['Row']
