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


export async function POST(request: Request) {
  try {
    const body = await request.json();
    const response = await fetch(`${API_BASE_URL}/recommend`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
        const errorBody = await response.text();
        console.error('Failed to fetch recommendations from backend:', errorBody);
        return NextResponse.json({ error: 'Failed to fetch recommendations', details: errorBody }, { status: response.status });
    }

    const data: ApiMovie[] = await response.json();
    const filteredData = filterMovies(data);
    return NextResponse.json(filteredData);
  } catch (error) {
    console.error('Error in /api/recommend:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
