
'use client';

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
    const response = await fetch(`${API_BASE_URL}/search/${encodeURIComponent(identifier)}`);
    if (!response.ok) {
      console.error('Backend search failed:', response.statusText);
      return [];
    }
    const data: ApiMovie[] = await response.json();
    return data.map(transformApiMovie).filter((movie): movie is Movie => movie !== null);
  } catch (error) {
    console.error('Error in searchMovies:', error);
    return [];
  }
}


// We need a way to get movie details for the selected movies.
// Since we don't store all movies in memory, we must fetch them.
// We can optimize by first trying to find them in the displayed list.
export async function getMoviesByIds(ids: string[]): Promise<Movie[]> {
  if (ids.length === 0) {
    return [];
  }
  
  // This is a simplified approach. In a real-world scenario, you might have
  // a more sophisticated caching layer or a dedicated multi-fetch endpoint.
  // For now, we'll fetch them one by one if not found.
  const moviePromises = ids.map(id => searchMovies(id));
  
  try {
    const movieArrays = await Promise.all(moviePromises);
    // Flatten the array of arrays and filter out any empty results
    const movies = movieArrays.flat().filter(movie => movie !== null);
    // Ensure uniqueness
    const uniqueMovies = Array.from(new Map(movies.map(m => [m.id, m])).values());
    return uniqueMovies;
  } catch (error) {
    console.error('Error in getMoviesByIds:', error);
    return [];
  }
}

export function getGenres(movies: Movie[]): string[] {
    const allGenres = new Set<string>();
    movies.forEach(movie => {
        if (movie.genre) {
            movie.genre.split(',').forEach(genre => {
                const trimmedGenre = genre.trim();
                if (trimmedGenre) {
                    allGenres.add(trimmedGenre.toLowerCase());
                }
            });
        }
    });
    return Array.from(allGenres).sort();
}
