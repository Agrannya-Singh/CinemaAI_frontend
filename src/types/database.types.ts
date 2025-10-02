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
      movies: {
        Row: {
          id: string
          created_at: string
          title: string
          overview: string
          vote_average: number
          poster_path: string
          genre: string | null
        }
        Insert: {
          id: string
          created_at?: string
          title: string
          overview: string
          vote_average: number
          poster_path: string
          genre?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          title?: string
          overview?: string
          vote_average?: number
          poster_path?: string
          genre?: string | null
        }
      }
      user_movies: {
        Row: {
          id: string
          user_id: string
          movie_id: string
          created_at: string
          rating: number | null
          notes: string | null
          is_favorite: boolean
          watched_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          movie_id: string
          created_at?: string
          rating?: number | null
          notes?: string | null
          is_favorite?: boolean
          watched_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          movie_id?: string
          created_at?: string
          rating?: number | null
          notes?: string | null
          is_favorite?: boolean
          watched_at?: string | null
        }
      }
      user_preferences: {
        Row: {
          id: string
          user_id: string
          created_at: string
          preferred_genres: string[]
          dashboard_layout: string
          theme: string
          notification_settings: Json
          language: string
        }
        Insert: {
          id?: string
          user_id: string
          created_at?: string
          preferred_genres?: string[]
          dashboard_layout?: string
          theme?: string
          notification_settings?: Json
          language?: string
        }
        Update: {
          id?: string
          user_id?: string
          created_at?: string
          preferred_genres?: string[]
          dashboard_layout?: string
          theme?: string
          notification_settings?: Json
          language?: string
        }
      }
      user_lists: {
        Row: {
          id: string
          user_id: string
          created_at: string
          name: string
          description: string | null
          is_public: boolean
          movies: string[] // Array of movie IDs
        }
        Insert: {
          id?: string
          user_id: string
          created_at?: string
          name: string
          description?: string | null
          is_public?: boolean
          movies?: string[]
        }
        Update: {
          id?: string
          user_id?: string
          created_at?: string
          name?: string
          description?: string | null
          is_public?: boolean
          movies?: string[]
        }
      }
    }
    Views: {
      user_movie_details: {
        Row: {
          user_id: string
          movie_id: string
          title: string
          overview: string
          vote_average: number
          poster_path: string
          genre: string | null
          user_rating: number | null
          notes: string | null
          is_favorite: boolean
          watched_at: string | null
        }
      }
    }
  }
}