
import { NextResponse } from 'next/server';

const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://sreenscount-rag-bmhxbshag6gdfeb8.southeastasia-01.azurewebsites.net';

// This route now proxies search requests to the backend.
export async function GET(
  request: Request,
  { params }: { params: { identifier: string } }
) {
  const identifier = params.identifier;
  try {
    const response = await fetch(`${API_BASE_URL}/search/${encodeURIComponent(identifier)}`);
    
    // The backend returns 404 if not found, which is fine. We'll forward that.
    if (!response.ok) {
        if (response.status === 404) {
            return NextResponse.json([], { status: 200 }); // Return empty array for not found
        }
        const errorBody = await response.text();
        console.error("Backend search failed:", errorBody);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
    
    const movie = await response.json();
    // The backend search endpoint returns a single movie object, not an array.
    // We wrap it in an array to maintain consistency with the frontend's expectations.
    return NextResponse.json([movie]);

  } catch (error) {
    console.error("Proxy to /api/search failed:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
