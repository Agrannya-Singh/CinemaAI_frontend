'use client';

export interface Movie {
  id: string; // This will be the imdbID from the API
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
export function transformApiMovie(apiMovie: ApiMovie): Movie | null {
    return {
    id: apiMovie.id,
    imdbID: apiMovie.id,
    title: apiMovie.title,
    year: apiMovie.release_date,
    genre: apiMovie.genres,
    poster: apiMovie.poster_path || `https://placehold.co/300x450.png`,
    posterHint: apiMovie.overview.split(' ').slice(0, 2).join(' ').toLowerCase() || 'movie poster',
    overview: apiMovie.overview,
    cast: apiMovie.cast,
    rating: apiMovie.vote_average,
  };
}

export async function getMovies(): Promise<Movie[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/movies`);
    if (!response.ok) {
      throw new Error('Failed to fetch movies');
    }
    const data: ApiMovie[] = await response.json();
    return data.map(transformApiMovie).filter((movie): movie is Movie => movie !== null);
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
    return data.map(transformApiMovie).filter((movie): movie is Movie => movie !== null);
  } catch (error) {
    console.error('Error in searchMovies:', error);
    return [];
  }
}

// We need a way to get movie details for the selected movies.
// The API doesn't have a getByIds endpoint, so we will filter the main list.
export async function getMoviesByIds(ids: string[], allMovies: Movie[]): Promise<Movie[]> {
  if (ids.length === 0) {
    return [];
  }
  try {
    const selected = allMovies.filter(movie => ids.includes(movie.id));
    return selected;
  } catch (error) {
    console.error('Error in getMoviesByIds:', error);
    return [];
  }
}
