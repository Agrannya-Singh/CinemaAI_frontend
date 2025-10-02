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
        }
        Insert: {
          id?: string
          user_id: string
          movie_id: string
          created_at?: string
          rating?: number | null
          notes?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          movie_id?: string
          created_at?: string
          rating?: number | null
          notes?: string | null
        }
      }
    }
  }
}