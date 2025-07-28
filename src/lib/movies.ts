'use client';

export interface Movie {
  id: string; // This will be the imdbID from the API
  imdbID: string;
  title: string;
  year: string;
  genre: string;
  poster: string;
  posterHint: string;
}

// The API response structure is different from the old Movie interface.
// Let's define a type for the API response.
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

const API_BASE_URL = '/api'; // Using local API proxy

// Helper to transform API movie to our local Movie interface
function transformApiMovie(apiMovie: ApiMovie): Movie {
  return {
    id: apiMovie.id,
    imdbID: apiMovie.id,
    title: apiMovie.title,
    year: apiMovie.release_date,
    genre: apiMovie.genres,
    poster: apiMovie.poster_path || `https://placehold.co/300x450.png`,
    posterHint: apiMovie.overview.split(' ').slice(0, 2).join(' ').toLowerCase() || 'movie poster',
  };
}

export async function getMovies(): Promise<Movie[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/movies`);
    if (!response.ok) {
      throw new Error('Failed to fetch movies');
    }
    const data: ApiMovie[] = await response.json();
    return data.map(transformApiMovie);
  } catch (error) {
    console.error('Error in getMovies:', error);
    return [];
  }
}

export async function searchMovies(identifier: string): Promise<Movie[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/search/${identifier}`);
    if (!response.ok) {
      // It's ok if not found, just return empty
      if (response.status === 404) {
        return [];
      }
      throw new Error('Failed to search movies');
    }
    const data: ApiMovie[] = await response.json();
    return data.map(transformApiMovie);
  } catch (error) {
    console.error('Error in searchMovies:', error);
    return [];
  }
}

// We need a way to get movie details for the selected movies.
// The API doesn't have a getByIds endpoint, so we will fetch them one by one.
// This is not ideal for performance, but it's what the API allows.
export async function getMoviesByIds(ids: string[]): Promise<Movie[]> {
  if (ids.length === 0) {
    return [];
  }
  // This is a bit inefficient. A better API would have a /movies?ids=... endpoint.
  // For now, we search for each movie by its ID.
  const moviePromises = ids.map(id => searchMovies(id));
  const moviesArrays = await Promise.all(moviePromises);
  // Flatten the array of arrays and remove duplicates
  const moviesMap = new Map<string, Movie>();
  moviesArrays.flat().forEach(movie => moviesMap.set(movie.id, movie));
  return Array.from(moviesMap.values());
}

export function getGenres(): string[] {
  // This will be static for now, as the API doesn't provide a genre list endpoint.
  // We can derive it from the initial movie list, but that list is now async.
  // For simplicity, we'll keep the static list.
  return [
    "Action",
    "Adventure",
    "Crime",
    "Drama",
    "Fantasy",
    "Sci-Fi",
    "Thriller",
    "War"
  ].sort();
}
