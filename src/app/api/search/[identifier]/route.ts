
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const API_BASE_URL = 'https://cinemaai-backend.onrender.com'; //hosting path of fastapi backend
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(
  request: Request,
  { params }: { params: { identifier: string } }
) {
  const identifier = params.identifier;
  
  try {
    // First, search in Supabase
    const { data: supabaseMovies, error } = await supabase
      .from('movies')
      .select('*')
      .ilike('title', `%${identifier}%`)
      .limit(5);

    if (error) {
      console.error("Supabase search failed:", error);
      return NextResponse.json({ error: 'Database Error' }, { status: 500 });
    }

    // If we found movies in Supabase, return them
    if (supabaseMovies && supabaseMovies.length > 0) {
      console.log("Movies found in Supabase:", supabaseMovies.length);
      return NextResponse.json(supabaseMovies);
    }

    // If no movies found in Supabase, try OMDB API through our backend
    console.log("No movies found in Supabase, trying external API...");
    const response = await fetch(`${API_BASE_URL}/search/${encodeURIComponent(identifier)}`);
    
    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json([], { status: 200 }); // Return empty array for not found
      }
      const errorBody = await response.text();
      console.error("Backend search failed:", errorBody);
      return NextResponse.json({ error: 'External API Error' }, { status: 500 });
    }
    
    const movie = await response.json();
    
    // Save the movie to Supabase if found
    if (movie) {
      console.log("Movie found in external API, saving to Supabase...");
      const { error: insertError } = await supabase
        .from('movies')
        .insert([movie])
        .select();

      if (insertError) {
        console.error("Failed to save movie to Supabase:", insertError);
      } else {
        console.log("Movie successfully saved to Supabase");
      }
    }

    // Return the movie wrapped in an array for consistency
    return NextResponse.json([movie]);

  } catch (error) {
    console.error("Proxy to /api/search failed:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
