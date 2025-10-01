import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = createClient()
  
  try {
    const { data: movies, error } = await supabase.from('movies').select('*')

    if (error) {
      console.error('Error fetching movies from Supabase:', error)
      return NextResponse.json({ error: 'Failed to fetch movies', details: error.message }, { status: 500 })
    }

    return NextResponse.json(movies)

  } catch (error) {
    console.error('Unexpected error fetching movies:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
