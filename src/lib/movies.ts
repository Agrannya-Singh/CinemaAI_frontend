// Types shared between client and server
export interface Movie {
  id: string;
  created_at?: string;
  title: string;
  overview: string;
  vote_average: number;
  poster_path: string;
  genre?: string; // Optional, we'll set a default
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

// Helper to transform API movie to our local Movie interface
export function transformApiMovie(apiMovie: ApiMovie): Movie | null {
  if (!apiMovie || !apiMovie.id) return null;
  return {
    id: apiMovie.id,
    title: apiMovie.title,
    overview: apiMovie.overview,
    vote_average: apiMovie.vote_average,
    poster_path: apiMovie.poster_path === 'N/A' ? `https://placehold.co/300x450.png` : apiMovie.poster_path,
    genre: apiMovie.genres.split(',')[0].trim(), // Take the first genre
    created_at: new Date().toISOString() // Set current date as creation date
  };
}


// Fetch movies from our Next.js API endpoint
export async function getMovies(): Promise<Movie[]> {
    try {
        const response = await fetch(`${API_BASE_URL}/movies`);
        if (!response.ok) {
            console.error('Error fetching movies:', response.statusText);
            return [];
        }
        const movies = await response.json();
        return movies;
    } catch (error) {
        console.error('Error fetching movies:', error);
        return [];
    }
}

// Search for movies in Supabase first, then fallback to external API
export async function searchMovies(identifier: string): Promise<Movie[]> {
  try {
    console.log('Searching for movies with identifier:', identifier);
    const response = await fetch(`${API_BASE_URL}/search/${encodeURIComponent(identifier)}`);
    
    if (!response.ok) {
      console.error('Search request failed:', response.statusText);
      return [];
    }
    
    const data = await response.json();
    
    // The API now returns movies in the correct format, no need to transform
    const movies = Array.isArray(data) ? data : [data];
    
    if (movies.length === 0) {
      console.log('No movies found for:', identifier);
    } else {
      console.log('Found', movies.length, 'movies');
    }
    
    return movies;

  } catch (error) {
    console.error('Error in searchMovies:', error);
    return [];
  }
}
