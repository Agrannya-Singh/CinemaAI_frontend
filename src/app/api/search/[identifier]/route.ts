import { NextResponse } from 'next/server';
import { OMDbMovie, OMDbSearchResult } from '@/lib/omdb-api';

const OMDB_API_URL = `http://www.omdbapi.com/?apikey=${process.env.OMDB_API_KEY}`;


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


export async function GET(
  request: Request,
  { params }: { params: { identifier: string } }
) {
  const identifier = params.identifier;
  try {
    const response = await fetch(`${OMDB_API_URL}&t=${encodeURIComponent(identifier)}`);
    const data: OMDbMovie = await response.json();
    
    if (data.Response === 'True') {
      const movie = transformOMDbMovieToApiMovie(data);
      return NextResponse.json([movie]);
    } else {
      // If search by title fails, try searching as an ID
      const byIdResponse = await fetch(`${OMDB_API_URL}&i=${encodeURIComponent(identifier)}`);
      const byIdData: OMDbMovie = await byIdResponse.json();
      if (byIdData.Response === 'True') {
          const movie = transformOMDbMovieToApiMovie(byIdData);
          return NextResponse.json([movie]);
      }
    }
    
    return NextResponse.json([], { status: 200 });
  } catch (error) {
    console.error("OMDb API search failed:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
