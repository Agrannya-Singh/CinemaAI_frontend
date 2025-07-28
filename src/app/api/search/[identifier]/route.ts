import { NextResponse } from 'next/server';

const API_BASE_URL = 'https://cinemaai-backend.onrender.com';

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
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
