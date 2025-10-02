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

    // Save the transformed movies through our API
    if (transformedMovies.length > 0) {
        try {
            const saveResponse = await fetch(`${API_BASE_URL}/movies`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(transformedMovies)
            });
            if (!saveResponse.ok) {
                console.error('Error saving movies:', saveResponse.statusText);
            }
        } catch (error) {
            console.error('Error saving movies:', error);
        }
    }

    return transformedMovies;

  } catch (error) {
    console.error('Error in searchMovies:', error);
    return [];
  }
}
