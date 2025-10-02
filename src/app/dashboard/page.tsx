'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { createClient } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { MovieCard } from '@/components/movie-card'
import { Download, LogOut } from 'lucide-react'
import { toast } from 'sonner'
import type { Movie } from '@/lib/movies'

export default function DashboardPage() {
  const { user, signOut } = useAuth()
  const router = useRouter()
  const [userMovies, setUserMovies] = useState<Movie[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    if (!user) {
      router.push('/login')
      return
    }

    fetchUserMovies()
  }, [user, router])

  const fetchUserMovies = async () => {
    try {
      const { data: userMovieRelations, error: relationsError } = await supabase
        .from('user_movies')
        .select('movie_id')
        .eq('user_id', user?.id)

      if (relationsError) throw relationsError

      if (!userMovieRelations.length) {
        setLoading(false)
        return
      }

      const movieIds = userMovieRelations.map(rel => rel.movie_id)
      
      const { data: movies, error: moviesError } = await supabase
        .from('movies')
        .select('*')
        .in('id', movieIds)

      if (moviesError) throw moviesError

      setUserMovies(movies)
    } catch (error: any) {
      toast.error('Failed to fetch your movies')
      console.error('Error fetching user movies:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDownloadMovies = () => {
    try {
      const moviesData = userMovies.map(movie => ({
        title: movie.title,
        overview: movie.overview,
        rating: movie.vote_average,
        genre: movie.genre
      }))

      const dataStr = JSON.stringify(moviesData, null, 2)
      const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr)
      
      const linkElement = document.createElement('a')
      linkElement.setAttribute('href', dataUri)
      linkElement.setAttribute('download', `my_movies_${new Date().toISOString().split('T')[0]}.json`)
      linkElement.click()
      
      toast.success('Movies list downloaded successfully!')
    } catch (error) {
      toast.error('Failed to download movies list')
      console.error('Error downloading movies:', error)
    }
  }

  if (!user) {
    return <div>Loading...</div>
  }

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold">CinemaAI Dashboard</h1>
            </div>
            <div className="flex items-center gap-4">
              <p className="text-muted-foreground">
                Welcome, {user.email}
              </p>
              <Button variant="destructive" size="sm" onClick={signOut}>
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <main className="py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-3xl font-bold">Your Movie Collection</h2>
            {userMovies.length > 0 && (
              <Button onClick={handleDownloadMovies} variant="outline">
                <Download className="mr-2 h-4 w-4" />
                Download Collection
              </Button>
            )}
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(3)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <div className="h-[400px] bg-muted rounded-t-lg" />
                  <CardContent className="mt-4">
                    <div className="h-4 bg-muted rounded w-3/4" />
                    <div className="h-4 bg-muted rounded w-1/2 mt-2" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : userMovies.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {userMovies.map((movie) => (
                <MovieCard
                  key={movie.id}
                  movie={movie}
                  isSelected={false}
                  onSelect={() => {}}
                />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <h3 className="text-xl font-semibold mb-2">No Movies Selected</h3>
                <p className="text-muted-foreground text-center mb-4">
                  You haven't selected any movies yet. Go to the home page to discover and select movies!
                </p>
                <Button onClick={() => router.push('/')}>
                  Discover Movies
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  )
}