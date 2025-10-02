
import { NextResponse } from 'next/server';
import { createClient, PostgrestResponse } from '@supabase/supabase-js';
import type { Database } from '@/types/database.types';


// API Configuration for fastapi python backend
// API Configuration  
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://cinemaai-backend-1.onrender.com';
const OMDB_API_URL = process.env.NEXT_PUBLIC_OMDB_API_URL || 'http://www.omdbapi.com';
const OMDB_API_KEY = process.env.NEXT_PUBLIC_OMDB_API_KEY;

// Initialize Supabase with custom fetch options
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      persistSession: false
    },
    global: {
      headers: {
        'x-custom-fetch-timeout': '5000'
      }
    }
  }
);

// Helper function to add timeout to fetch requests
const fetchWithTimeout = async (url: string, options: RequestInit = {}, timeout = 5000) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
};


type Movie = Database['public']['Tables']['movies']['Row'];

// Cache implementation
const CACHE_DURATION = 3600000; // 1 hour in milliseconds
const movieCache = new Map<string, { data: Movie[]; timestamp: number }>();

const getCachedData = (key: string): Movie[] | null => {
  const cached = movieCache.get(key);
  if (!cached) return null;
  
  if (Date.now() - cached.timestamp > CACHE_DURATION) {
    movieCache.delete(key);
    return null;
  }
  
  return cached.data;
};

const setCacheData = (key: string, data: Movie[]) => {
  movieCache.set(key, { data, timestamp: Date.now() });
};

export async function GET(
  request: Request,
  { params }: { params: Promise<{ identifier: string }> }
) {
  const { identifier } = await params;
  const cacheKey = `search:${identifier}`;
  
  // Check cache first
  const cachedResult = getCachedData(cacheKey);
  if (cachedResult) {
    console.log("Returning cached result for:", identifier);
    return NextResponse.json(cachedResult);
  }
  
  try {
    // First, search in Supabase with a timeout
    const supabasePromise = Promise.race([
      supabase
        .from('movies')
        .select('*')
        .ilike('title', `%${identifier}%`)
        .limit(5),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Supabase timeout')), 3000)
      )
    ]);

    try {
      const { data: supabaseMovies, error } = await (supabasePromise as Promise<PostgrestResponse<Movie>>);

      if (error) throw error;

      if (supabaseMovies && supabaseMovies.length > 0) {
        console.log("Movies found in Supabase:", supabaseMovies.length);
        setCacheData(cacheKey, supabaseMovies);
        return NextResponse.json(supabaseMovies);
      }
    } catch (error) {
      console.error("Supabase search failed:", error);
      // Continue to external API if Supabase fails
    }

    // If no movies found in Supabase or it failed, try external APIs
    console.log("Trying external APIs for:", identifier);
    
    try {
      // Try backend first (might have cached results)
      const backendResponse = await fetchWithTimeout(
        `${BACKEND_URL}/search/${encodeURIComponent(identifier)}`,
        {
          headers: {
            'Cache-Control': 'public, max-age=86400',
          }
        },
        5000
      );
      
      if (backendResponse.ok) {
        const movie = await backendResponse.json();
        setCacheData(cacheKey, [movie]);
        return NextResponse.json([movie]);
      }
      
      // If backend fails and we have OMDB API key, try OMDB directly
      if (OMDB_API_KEY) {
        const omdbResponse = await fetchWithTimeout(
          `${OMDB_API_URL}/?apikey=${OMDB_API_KEY}&t=${encodeURIComponent(identifier)}`,
          {},
          5000
        );
        
        if (omdbResponse.ok) {
          const omdbData = await omdbResponse.json();
          if (omdbData.Response === 'True') {
            const movie: Movie = {
              id: omdbData.imdbID,
              title: omdbData.Title,
              overview: omdbData.Plot,
              vote_average: parseFloat(omdbData.imdbRating) || 0,
              poster_path: omdbData.Poster,
              genre: omdbData.Genre?.split(', ')[0] || 'Unknown',
              created_at: new Date().toISOString(),
              imdb_id: omdbData.imdbID
            };
            
            // Save to Supabase in the background
            (async () => {
              try {
                await supabase.from('movies').insert([movie]);
                console.log('Movie saved to Supabase');
              } catch (err) {
                console.error('Failed to save to Supabase:', err);
              }
            })();
            
            setCacheData(cacheKey, [movie]);
            return NextResponse.json([movie]);
          }
        }
      }
      
      // If all attempts fail, return empty array
      return NextResponse.json([]);

    } catch (error) {
      console.error("External API search failed:", error);
      return NextResponse.json({ error: 'External API Error' }, { status: 500 });
    }

  } catch (error) {
    console.error("Search failed:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
