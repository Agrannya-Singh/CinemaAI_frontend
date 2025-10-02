import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = createClient()
  
  try {
    console.log('Fetching movies from Supabase...');
    const { data: movies, error } = await supabase
      .from('movies')
      .select('*')
      .limit(100);

    if (error) {
      console.error('Error fetching movies from Supabase:', {
        error,
        message: error.message,
        details: error.details,
        hint: error.hint
      });
      return NextResponse.json({ error: 'Failed to fetch movies', details: error.message }, { status: 500 })
    }

    console.log('Movies fetched from Supabase:', movies?.length || 0, 'movies found')
    return NextResponse.json(movies || [])

  } catch (error) {
    console.error('Unexpected error fetching movies:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const supabase = createClient()
  
  try {
    const movies = await request.json()
    
    const { error } = await supabase.from('movies').upsert(movies, { onConflict: 'id' })

    if (error) {
      console.error('Error saving movies to Supabase:', error)
      return NextResponse.json({ error: 'Failed to save movies', details: error.message }, { status: 500 })
    }

    return NextResponse.json({ message: 'Movies saved successfully' })

  } catch (error) {
    console.error('Unexpected error saving movies:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
