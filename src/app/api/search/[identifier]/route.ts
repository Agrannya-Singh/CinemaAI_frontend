import { NextResponse } from 'next/server';
import type { ApiMovie } from '@/lib/movies';

const API_BASE_URL = 'https://cinemaai-backend.onrender.com';

const OFFENSIVE_TERMS = ['nigger'];

function containsOffensiveTerm(text: string): boolean {
    if (!text) return false;
    const lowerText = text.toLowerCase();
    return OFFENSIVE_TERMS.some(term => lowerText.includes(term));
}

function filterMovies(movies: ApiMovie[]): ApiMovie[] {
    return movies.filter(movie => !containsOffensiveTerm(movie.title));
}

export async function GET(
  request: Request,
  { params }: { params: { identifier: string } }
) {
  const identifier = params.identifier;
  try {
    const response = await fetch(`${API_BASE_URL}/search/${identifier}`);
    if (!response.ok) {
        return NextResponse.json({ error: 'Failed to search movies' }, { status: response.status });
    }
    const data: ApiMovie[] = await response.json();
    const filteredData = filterMovies(data);
    return NextResponse.json(filteredData);
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
