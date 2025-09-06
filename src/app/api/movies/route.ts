
import { NextResponse } from 'next/server';

const API_BASE_URL = 'https://cinemaai-backend.onrender.com';

// This route now acts as a direct proxy to the backend's /movies endpoint.
export async function GET() {
  try {
    const response = await fetch(`${API_BASE_URL}/movies`);

    if (!response.ok) {
        const errorBody = await response.text();
        console.error('Failed to fetch movies from backend:', errorBody);
        return NextResponse.json({ error: 'Failed to fetch movies from backend', details: errorBody }, { status: response.status });
    }

    const movies = await response.json();
    return NextResponse.json(movies);

  } catch (error) {
    console.error('Error fetching movies from backend:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
