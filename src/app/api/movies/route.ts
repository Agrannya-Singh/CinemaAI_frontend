import { NextResponse } from 'next/server';

const API_BASE_URL = 'https://cinemaai-backend.onrender.com';

export async function GET() {
  try {
    const response = await fetch(`${API_BASE_URL}/movies`);
    if (!response.ok) {
      return NextResponse.json({ error: 'Failed to fetch movies' }, { status: response.status });
    }
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
