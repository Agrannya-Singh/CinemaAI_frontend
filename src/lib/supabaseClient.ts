import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/database.types'

if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_URL')
}

if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_ANON_KEY')
}

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

// Helper function to check if user has required permissions
export async function checkUserPermissions(supabase: ReturnType<typeof createClient>) {
  try {
    // Try to read user preferences - this will fail if permissions aren't set up correctly
    const { data, error } = await supabase
      .from('user_preferences')
      .select('id')
      .limit(1)

    if (error) {
      if (error.code === 'PGRST116') {
        return { hasPermission: false, error: 'Missing RLS policies' }
      }
      return { hasPermission: false, error: error.message }
    }

    return { hasPermission: true, error: null }
  } catch (error) {
    return { hasPermission: false, error: 'Failed to check permissions' }
  }
}