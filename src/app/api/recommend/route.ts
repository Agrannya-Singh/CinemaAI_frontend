import { NextResponse } from 'next/server';

const API_BASE_URL = 'https://cinemaai-backend.onrender.com';

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

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in /api/recommend:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
