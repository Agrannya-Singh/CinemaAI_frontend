import { createClient } from '@/lib/supabase/client';
import { Pool } from 'pg';

export interface Movie {
  id: string; 
  imdbID: string;
  title: string;
  year: string;
  genre: string;
  poster: string;
  posterHint: string;
  overview: string;
  cast: string;
  rating: number;
}

export interface ApiMovie {
  id: string; // imdbID
  title: string;
  overview: string;
  genres: string; // Comma-separated
  cast: string;
  poster_path: string;
  vote_average: number;
  release_date: string; // Year
}

const API_BASE_URL = '/api'; 
// Configure PostgreSQL pool using DATABASE_URL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20, // Pool size
});

// Check for connection errors
pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
});
const supabase = createClient();
// Helper to transform API movie to our local Movie interface
export function transformApiMovie(apiMovie: ApiMovie): Movie | null {
  if (!apiMovie || !apiMovie.id) return null;
  return {
    id: apiMovie.id,
    imdbID: apiMovie.id,
    title: apiMovie.title,
    year: apiMovie.release_date,
    genre: apiMovie.genres,
    poster: apiMovie.poster_path === 'N/A' ? `https://placehold.co/300x450.png` : apiMovie.poster_path,
    posterHint: apiMovie.overview?.split(' ').slice(0, 2).join(' ').toLowerCase() || 'movie poster',
    overview: apiMovie.overview,
    cast: apiMovie.cast,
    rating: apiMovie.vote_average,
  };
}


// Fetches movies from the Supabase database
export async function getSupabaseMovies(): Promise<Movie[]> {
    const { data: movies, error } = await supabase.from('movies').select('*');
    if (error) {
        console.error('Error fetching movies from Supabase:', error);
        return [];
    }
    return movies;
}

// Main function to get movies, now using Supabase
export async function getMovies(): Promise<Movie[]> {
    return await getSupabaseMovies();
}

// Search for movies using the external API and add to Supabase
export async function searchMovies(identifier: string): Promise<Movie[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/search/${encodeURIComponent(identifier)}`);
    if (!response.ok) {
      console.error('Backend search failed:', response.statusText);
      return [];
    }
    const data: ApiMovie[] = await response.json();
    const moviesArray = Array.isArray(data) ? data : [data];

    const transformedMovies = moviesArray.map(transformApiMovie).filter((movie): movie is Movie => movie !== null);

    // Add newly found movies to Supabase asynchronously
    if (transformedMovies.length > 0) {
        const { error: upsertError } = await supabase.from('movies').upsert(transformedMovies, { onConflict: 'id' });
        if (upsertError) {
            console.error('Error saving movie to Supabase:', upsertError);
        }
    }

    return transformedMovies;

  } catch (error) {
    console.error('Error in searchMovies:', error);
    return [];
  }
}
