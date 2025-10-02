// API Configuration
const API_BASE_URL = '/api';
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

// Types shared between client and server
export interface Movie {
  id: string | number;
  created_at?: string;
  title: string;
  overview: string;
  vote_average: number;
  poster_path: string;
  genre?: string;
  last_fetched?: number; // Timestamp of last fetch
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

// Cache configuration
interface CacheEntry {
  timestamp: number;
  data: Movie[];
}

const searchCache = new Map<string, CacheEntry>();

// Cache helper functions
function getCachedSearch(query: string): Movie[] | null {
  const cached = searchCache.get(query);
  if (!cached) return null;
  
  // Check if cache is still valid
  if (Date.now() - cached.timestamp > CACHE_DURATION) {
    searchCache.delete(query);
    return null;
  }
  
  return cached.data;
}

function setCachedSearch(query: string, movies: Movie[]) {
  searchCache.set(query, {
    timestamp: Date.now(),
    data: movies
  });
}

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

// Search for movies with caching and optimized external calls
export async function searchMovies(identifier: string): Promise<Movie[]> {
  try {
    // Normalize search term
    const normalizedQuery = identifier.trim().toLowerCase();
    
    // Check in-memory cache first
    const cachedResults = getCachedSearch(normalizedQuery);
    if (cachedResults) {
      console.log('Retrieved from cache:', normalizedQuery);
      return cachedResults;
    }

    // If not in cache, make API request
    console.log('Searching for movies with identifier:', normalizedQuery);
    const response = await fetch(`${API_BASE_URL}/search/${encodeURIComponent(normalizedQuery)}`, {
      headers: {
        'Cache-Control': 'public, max-age=86400', // Cache for 24 hours
      }
    });
    
    if (!response.ok) {
      console.error('Search request failed:', response.statusText);
      return [];
    }
    
    const data = await response.json();
    const movies = Array.isArray(data) ? data : [data];
    
    // Add timestamp to movies
    const moviesWithTimestamp = movies.map(movie => ({
      ...movie,
      last_fetched: Date.now()
    }));
    
    // Cache the results
    if (moviesWithTimestamp.length > 0) {
      setCachedSearch(normalizedQuery, moviesWithTimestamp);
      console.log('Cached results for:', normalizedQuery);
    } else {
      console.log('No movies found for:', normalizedQuery);
    }
    
    return moviesWithTimestamp;

  } catch (error) {
    console.error('Error in searchMovies:', error);
    return [];
  }
}
