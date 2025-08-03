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

// Type for OMDb API response
interface OMDbMovie {
    Title: string;
    Year: string;
    imdbID: string;
    Type: string;
    Poster: string;
    Genre?: string;
    Plot?: string;
    Actors?: string;
    imdbRating?: string;
    Response: "True" | "False";
    Error?: string;
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

function transformOMDbMovie(omdbMovie: OMDbMovie): Movie | null {
    if (omdbMovie.Response !== "True") return null;
    return {
        id: omdbMovie.imdbID,
        imdbID: omdbMovie.imdbID,
        title: omdbMovie.Title,
        year: omdbMovie.Year,
        genre: omdbMovie.Genre || 'N/A',
        poster: omdbMovie.Poster !== 'N/A' ? omdbMovie.Poster : `https://placehold.co/300x450.png`,
        posterHint: omdbMovie.Plot?.split(' ').slice(0, 2).join(' ').toLowerCase() || 'movie poster',
        overview: omdbMovie.Plot || 'No overview available.',
        cast: omdbMovie.Actors || 'N/A',
        rating: omdbMovie.imdbRating ? parseFloat(omdbMovie.imdbRating) : 0,
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
    // First, try searching via our backend
    const response = await fetch(`${API_BASE_URL}/search/${identifier}`);
    if (response.ok) {
      const data: ApiMovie[] = await response.json();
       if (data.length > 0) {
        return data.map(transformApiMovie).filter((movie): movie is Movie => movie !== null);
      }
    }
    
    // If backend search fails or returns no results, try OMDb directly as a fallback
    console.log('Backend search failed or empty, trying OMDb API fallback.');
    const omdbApiKey = process.env.NEXT_PUBLIC_OMDB_API_KEY;
    if (!omdbApiKey) {
        console.error('OMDb API key is not configured.');
        return [];
    }

    const omdbUrl = `http://www.omdbapi.com/?t=${encodeURIComponent(identifier)}&apikey=${omdbApiKey}`;
    const omdbResponse = await fetch(omdbUrl);
    
    if (!omdbResponse.ok) {
        throw new Error('Failed to fetch from OMDb API.');
    }

    const omdbData: OMDbMovie = await omdbResponse.json();

    if (omdbData.Response === "True") {
        const movie = transformOMDbMovie(omdbData);
        // We can't add to our backend from here, but we can return it to the UI for display
        return movie ? [movie] : [];
    } else {
        console.log('Movie not found in OMDb.');
        return [];
    }
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
