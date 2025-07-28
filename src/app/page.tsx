
'use client';

import { useState, useMemo, useCallback, useTransition, useEffect } from 'react';
import { Movie, getMovies, getGenres, getMoviesByIds, searchMovies, transformApiMovie } from '@/lib/movies';
import { MovieCard } from '@/components/movie-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { Search, Film, LoaderCircle } from 'lucide-react';
import type { ApiMovie } from '@/lib/movies';

export default function Home() {
  const { toast } = useToast();
  
  const [allMovies, setAllMovies] = useState<Movie[]>([]);
  const [moviesToDisplay, setMoviesToDisplay] = useState<Movie[]>([]);
  const [isFetchingInitialMovies, setIsFetchingInitialMovies] = useState(true);

  const allGenres = useMemo(() => getGenres(), []);

  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [selectedMovies, setSelectedMovies] = useState<string[]>([]);
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [recommendations, setRecommendations] = useState<Movie[]>([]);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const fetchInitialMovies = async () => {
      setIsFetchingInitialMovies(true);
      const movies = await getMovies();
      setAllMovies(movies);
      setMoviesToDisplay(movies);
      setIsFetchingInitialMovies(false);
    };
    fetchInitialMovies();
  }, []);

  const handleSearch = useCallback(async (query: string) => {
    if (!query) {
      setMoviesToDisplay(allMovies);
      return;
    }
    setIsSearching(true);
    const results = await searchMovies(query);
    setMoviesToDisplay(results); // Always show search results, even if empty, to indicate the search was performed.
    setIsSearching(false);
  }, [allMovies]);

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      handleSearch(searchTerm);
    }, 500); // 500ms debounce delay

    return () => clearTimeout(debounceTimer);
  }, [searchTerm, handleSearch]);

  const handleSelectMovie = useCallback((movieId: string) => {
    setSelectedMovies((prev) =>
      prev.includes(movieId)
        ? prev.filter((id) => id !== movieId)
        : [...prev, movieId]
    );
  }, []);

  const handleSelectGenre = (genre: string) => {
    setSelectedGenres((prev) =>
      prev.includes(genre)
        ? prev.filter((g) => g !== genre)
        : [...prev, genre]
    );
  };
  
  const handleGetRecommendations = async () => {
    if (selectedMovies.length === 0 || selectedGenres.length === 0) {
      toast({
        title: 'Selection Incomplete',
        description: 'Please select at least one movie and one genre to get recommendations.',
        variant: 'destructive',
      });
      return;
    }

    startTransition(async () => {
      try {
        const response = await fetch('/api/recommend', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            movie_ids: selectedMovies,
            num_recommendations: 10,
          }),
        });

        if (!response.ok) {
           throw new Error('Failed to fetch recommendations');
        }

        const recommendedApiMovies: ApiMovie[] = await response.json();
        const recommendedMovieData = recommendedApiMovies
          .map(transformApiMovie)
          .filter((movie): movie is Movie => movie !== null);


        setRecommendations(recommendedMovieData);
        document.getElementById('recommendations-section')?.scrollIntoView({ behavior: 'smooth' });
      } catch (error) {
        console.error('Error getting recommendations:', error);
        toast({
          title: 'Error',
          description: 'Failed to get recommendations. Please try again.',
          variant: 'destructive',
        });
      }
    });
  };

  const [selectedMovieDetails, setSelectedMovieDetails] = useState<Movie[]>([]);
  
  useEffect(() => {
    const fetchSelectedMovieDetails = async () => {
      if (selectedMovies.length > 0) {
        const details = await getMoviesByIds(selectedMovies);
        setSelectedMovieDetails(details);
      } else {
        setSelectedMovieDetails([]);
      }
    };
    fetchSelectedMovieDetails();
  }, [selectedMovies]);
  
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-20 w-full bg-background/80 backdrop-blur-sm border-b border-primary/20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 flex items-center h-16">
          <Film className="h-8 w-8 text-primary" />
          <h1 className="text-2xl md:text-3xl font-bold font-headline ml-3 text-primary">
            CinemaAI
          </h1>
        </div>
      </header>

      <main className="flex-1 container mx-auto p-4 sm:p-6 lg:p-8 space-y-12">
        <section>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            <div className="lg:col-span-1 lg:sticky top-20">
              <h2 className="text-2xl font-headline font-semibold mb-4 text-primary">
                  Search & Select
              </h2>
              <div className="relative mb-6">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground">
                  {isSearching ? <LoaderCircle className="animate-spin text-primary" /> : <Search />}
                  </div>
                  <Input
                  type="text"
                  placeholder="Search by title or IMDb ID..."
                  className="pl-10 text-base bg-background border-primary/50 focus:ring-primary"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  />
              </div>
              <Card className="border-primary/20">
                  <CardHeader>
                      <CardTitle className="font-headline text-xl text-primary">Your Selections</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                      <div>
                          <h3 className="font-semibold mb-3">1. Pick Your Genres</h3>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                              {allGenres.map((genre) => (
                              <div key={genre} className="flex items-center space-x-2">
                                  <Checkbox
                                  id={genre}
                                  onCheckedChange={() => handleSelectGenre(genre)}
                                  checked={selectedGenres.includes(genre)}
                                  className="border-primary data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
                                  />
                                  <Label htmlFor={genre} className="text-sm font-normal cursor-pointer">
                                  {genre}
                                  </Label>
                              </div>
                              ))}
                          </div>
                      </div>

                      <div>
                          <h3 className="font-semibold mb-3">2. Your Selected Movies ({selectedMovies.length})</h3>
                          <ScrollArea className="h-40 rounded-md border border-primary/20 p-2">
                              {selectedMovieDetails.length > 0 ? (
                              <ul className="space-y-1">
                                  {selectedMovieDetails.map(movie => (
                                  <li key={movie.id} className="text-sm text-muted-foreground">{movie.title}</li>
                                  ))}
                              </ul>
                              ) : (
                              <p className="text-sm text-center text-muted-foreground p-4">Select movies from the list below.</p>
                              )}
                          </ScrollArea>
                      </div>
                      
                      <Button 
                      size="lg" 
                      className="w-full font-bold bg-primary hover:bg-primary/90 text-primary-foreground"
                      onClick={handleGetRecommendations}
                      disabled={isPending || selectedMovies.length === 0 || selectedGenres.length === 0}
                      >
                      {isPending && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
                      Generate Recommendations
                      </Button>
                  </CardContent>
              </Card>
            </div>
            <div className='lg:col-span-2'>
              <h2 className="text-2xl font-headline font-semibold mb-4 text-primary">
                  {searchTerm ? 'Search Results' : 'Available Movies'}
              </h2>
              {isFetchingInitialMovies ? (
                <div className="flex justify-center items-center h-64">
                  <LoaderCircle className="h-12 w-12 animate-spin text-primary" />
                </div>
              ) : (
                moviesToDisplay.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {moviesToDisplay.map((movie) => (
                      <MovieCard
                        key={movie.id}
                        movie={movie}
                        isSelected={selectedMovies.includes(movie.id)}
                        onSelect={handleSelectMovie}
                      />
                    ))}
                  </div>
                ) : (
                  <Card className="flex flex-col items-center justify-center text-center p-8 h-64 bg-background border-primary/20">
                    <Film className="h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">
                      {searchTerm ? 'No movies found for your search.' : 'No movies available.'}
                    </p>
                  </Card>
                )
              )}
            </div>
          </div>
        </section>
        
        <section id="recommendations-section">
            <h2 className="text-2xl font-headline font-semibold mb-4 text-primary">
                Your AI Recommendations
            </h2>
            {isPending ? (
                <div className="flex justify-center items-center h-64">
                <LoaderCircle className="h-12 w-12 animate-spin text-primary" />
                </div>
            ) : recommendations.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {recommendations.map((movie) => (
                    <MovieCard
                    key={movie.id}
                    movie={movie}
                    isSelected={false} // Recommendations are not selectable
                    onSelect={() => {}} // No action on select
                    />
                ))}
                </div>
            ) : (
                <Card className="flex flex-col items-center justify-center text-center p-8 h-64 bg-background border-primary/20">
                <Film className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                    Your personalized movie recommendations will appear here.
                </p>
                </Card>
            )}
        </section>
      </main>
    </div>
  );
}
