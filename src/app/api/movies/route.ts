import { NextResponse } from 'next/server';
import { Movie, transformApiMovie } from '@/lib/movies';
import { OMDbMovie, OMDbSearchResult } from '@/lib/omdb-api';

const PREDEFINED_MOVIE_IDS = [
  'tt0111161', // The Shawshank Redemption
  'tt0068646', // The Godfather
  'tt0468569', // The Dark Knight
  'tt0071562', // The Godfather Part II
  'tt0110912', // Pulp Fiction
  'tt0167260', // The Lord of the Rings: The Return of the King
  'tt0050083', // 12 Angry Men
  'tt0108052', // Schindler's List
  'tt1375666', // Inception
  'tt0167261', // The Lord of the Rings: The Two Towers
];


const OMDB_API_URL = `http://www.omdbapi.com/?apikey=${process.env.OMDB_API_KEY}`;

async function getMovieDetails(imdbID: string): Promise<OMDbMovie | null> {
    try {
        const response = await fetch(`${OMDB_API_URL}&i=${imdbID}`);
        const data: OMDbMovie = await response.json();
        if (data.Response === "True") {
            return data;
        }
        return null;
    } catch (error) {
        console.error(`Failed to fetch details for ${imdbID}:`, error);
        return null;
    }
}

function transformOMDbMovieToApiMovie(omdbMovie: OMDbMovie) {
    return {
        id: omdbMovie.imdbID,
        title: omdbMovie.Title,
        overview: omdbMovie.Plot,
        genres: omdbMovie.Genre,
        cast: omdbMovie.Actors,
        poster_path: omdbMovie.Poster,
        vote_average: parseFloat(omdbMovie.imdbRating),
        release_date: omdbMovie.Year,
    };
}


export async function GET() {
  try {
    const moviePromises = PREDEFINED_MOVIE_IDS.map(getMovieDetails);
    const movieDetails = await Promise.all(moviePromises);

    const movies = movieDetails
        .filter((movie): movie is OMDbMovie => movie !== null)
        .map(transformOMDbMovieToApiMovie);

    return NextResponse.json(movies);

  } catch (error) {
    console.error('Error fetching predefined movies:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
