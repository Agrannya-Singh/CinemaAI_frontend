
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// API Configuration
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://cinemaai-backend-1.onrender.com';
const OMDB_API_URL = process.env.NEXT_PUBLIC_OMDB_API_URL || 'http://www.omdbapi.com';
const OMDB_API_KEY = process.env.NEXT_PUBLIC_OMDB_API_KEY;
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
    
    // Try backend first (which might have cached results)
    const backendResponse = await fetch(`${BACKEND_URL}/search/${encodeURIComponent(identifier)}`, {
      headers: {
        'Cache-Control': 'public, max-age=86400', // Enable caching for 24 hours
      }
    });
    
    // If backend fails or returns 404, try OMDB API directly
    if (!backendResponse.ok && OMDB_API_KEY) {
      console.log("Trying OMDB API directly...");
      const omdbResponse = await fetch(`${OMDB_API_URL}/?apikey=${OMDB_API_KEY}&t=${encodeURIComponent(identifier)}`);
      
      if (!omdbResponse.ok) {
        console.error("OMDB API request failed:", omdbResponse.statusText);
        return NextResponse.json([], { status: 200 }); // Return empty array for not found
      }
      
      const omdbData = await omdbResponse.json();
      if (omdbData.Response === 'False') {
        return NextResponse.json([], { status: 200 });
      }
      
      // Transform OMDB data to our format
      const movie = {
        id: omdbData.imdbID,
        title: omdbData.Title,
        overview: omdbData.Plot,
        vote_average: parseFloat(omdbData.imdbRating) || 0,
        poster_path: omdbData.Poster,
        genre: omdbData.Genre?.split(', ')[0] || 'Unknown',
        created_at: new Date().toISOString()
      };
      
      return NextResponse.json([movie]);
    }
    
    // Use backend response if available
    const movie = await backendResponse.json();
    
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
