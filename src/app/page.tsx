
'use client';

import { useState, useMemo, useCallback, useTransition, useEffect } from 'react';
import { Movie, getMovies, getMoviesByIds, searchMovies, transformApiMovie } from '@/lib/movies';
import { MovieCard } from '@/components/movie-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { Search, Film, LoaderCircle, Download, Clapperboard } from 'lucide-react';
import type { ApiMovie } from '@/lib/movies';

export default function Home() {
  const { toast } = useToast();
  
  const [allMovies, setAllMovies] = useState<Movie[]>([]);
  const [moviesToDisplay, setMoviesToDisplay] = useState<Movie[]>([]);
  const [isFetchingInitialMovies, setIsFetchingInitialMovies] = useState(true);

  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [selectedMovies, setSelectedMovies] = useState<string[]>([]);
  const [recommendations, setRecommendations] = useState<Movie[]>([]);
  const [isPending, startTransition] = useTransition();

  const fetchAllMovies = useCallback(async () => {
    setIsFetchingInitialMovies(true);
    try {
        const movies = await getMovies();
        setAllMovies(movies);
        setMoviesToDisplay(movies);
    } catch (error) {
        console.error("Failed to fetch movies:", error);
        toast({
            title: 'Error',
            description: 'Could not fetch movies. Please try refreshing the page.',
            variant: 'destructive',
        });
    } finally {
        setIsFetchingInitialMovies(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchAllMovies();
  }, [fetchAllMovies]);

  const handleSearch = useCallback(async (query: string) => {
    const trimmedQuery = query.trim();
    if (trimmedQuery.length < 3) {
        setMoviesToDisplay(allMovies);
        return;
    }
    
    setIsSearching(true);
    try {
        const results = await searchMovies(trimmedQuery);
        if (results.length > 0) {
            // New movie found, refetch all to get the updated list
            await fetchAllMovies();
            const lowercasedQuery = trimmedQuery.toLowerCase();
            // This is a bit of a hack. After fetching all, we need to find the movie we just searched for.
            // The `searchMovies` function calls our backend which adds it to the DB.
            // Then `fetchAllMovies` gets it. Then we filter for it.
            // This could be improved if the search API returned the movie and we could add it to state.
            setTimeout(() => {
                const justAdded = allMovies.filter(movie => 
                    movie.title.toLowerCase().includes(lowercasedQuery) || 
                    movie.id.toLowerCase() === lowercasedQuery
                );
                setMoviesToDisplay(justAdded.length > 0 ? justAdded : results);
            }, 100);

        } else {
             const lowercasedQuery = trimmedQuery.toLowerCase();
             const localResults = allMovies.filter(movie => 
                movie.title.toLowerCase().includes(lowercasedQuery) || 
                movie.id.toLowerCase() === lowercasedQuery
             );
             setMoviesToDisplay(localResults);
             if(localResults.length === 0) {
                toast({
                    title: 'Search Result',
                    description: 'Movie not found in our database or OMDb.',
                });
             }
        }

    } catch (error) {
        console.error("Search failed:", error);
        toast({
            title: 'Search Error',
            description: 'Could not perform search. Please try again.',
            variant: 'destructive',
        });
    } finally {
        setIsSearching(false);
    }
  }, [allMovies, toast, fetchAllMovies]);


  useEffect(() => {
    const debounceTimer = setTimeout(() => {
        const trimmedSearchTerm = searchTerm.trim();
        if(trimmedSearchTerm.length >= 3) {
           handleSearch(trimmedSearchTerm);
        } else {
            setMoviesToDisplay(allMovies);
        }
    }, 500); // 500ms debounce delay

    return () => clearTimeout(debounceTimer);
  }, [searchTerm, handleSearch, allMovies]);

  const handleSelectMovie = useCallback((movieId: string) => {
    setSelectedMovies((prev) =>
      prev.includes(movieId)
        ? prev.filter((id) => id !== movieId)
        : [...prev, movieId]
    );
  }, []);
  
  const handleGetRecommendations = async () => {
    if (selectedMovies.length === 0) {
      toast({
        title: 'Selection Incomplete',
        description: 'Please select at least one movie to get recommendations.',
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
          .filter((movie): movie is Movie => movie !== null)
          .filter(movie => !selectedMovies.includes(movie.id));


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
        const details = await getMoviesByIds(selectedMovies, allMovies);
        setSelectedMovieDetails(details);
      } else {
        setSelectedMovieDetails([]);
      }
    };
    fetchSelectedMovieDetails();
  }, [selectedMovies, allMovies]);

  const handleDownloadRecommendations = () => {
    if (recommendations.length === 0) {
      toast({
        title: 'No Recommendations',
        description: 'There are no recommendations to download.',
        variant: 'destructive',
      });
      return;
    }

    const jsonString = JSON.stringify(recommendations, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'movie_recommendations.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
       <header className="sticky top-0 z-20 w-full bg-gradient-to-b from-background to-transparent">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-20">
            <div className="flex items-center space-x-4">
                <Clapperboard className="h-10 w-10 text-primary" />
                <h1 className="text-3xl md:text-4xl font-bold tracking-tighter">
                    CinemaAI
                </h1>
            </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto p-4 sm:p-6 lg:p-8 space-y-16">
        <section className="bg-card border border-border rounded-lg p-6 md:p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                <div className="space-y-4">
                    <h2 className="text-2xl font-bold text-primary">
                        1. Select Your Favorite Movies
                    </h2>
                    <p className="text-muted-foreground">
                        Search for movies you love and add them to your list. The more you add, the better the recommendations.
                    </p>
                    <div className="relative">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground">
                            {isSearching ? <LoaderCircle className="animate-spin text-primary" /> : <Search />}
                        </div>
                        <Input
                            type="text"
                            placeholder="Search by title or IMDb ID..."
                            className="pl-10 text-base bg-secondary border-border focus:ring-primary"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="space-y-4">
                    <h2 className="text-2xl font-bold text-primary">
                        2. Your Selections ({selectedMovies.length})
                    </h2>
                     <ScrollArea className="h-40 rounded-md border border-border bg-secondary p-2">
                        {selectedMovieDetails.length > 0 ? (
                        <ul className="space-y-2">
                            {selectedMovieDetails.map(movie => (
                            <li key={movie.id} className="text-sm text-foreground font-medium p-2 bg-background/50 rounded-md">{movie.title}</li>
                            ))}
                        </ul>
                        ) : (
                        <div className="flex items-center justify-center h-full">
                            <p className="text-sm text-center text-muted-foreground">Selected movies will appear here.</p>
                        </div>
                        )}
                    </ScrollArea>
                     <Button 
                        size="lg" 
                        className="w-full font-bold bg-primary hover:bg-primary/80 text-primary-foreground text-lg"
                        onClick={handleGetRecommendations}
                        disabled={isPending || selectedMovies.length === 0}
                        >
                        {isPending && <LoaderCircle className="mr-2 h-5 w-5 animate-spin" />}
                        Get AI Recommendations
                    </Button>
                </div>
            </div>
        </section>
        
        <section>
              <h2 className="text-3xl font-bold mb-6 text-foreground">
                  {searchTerm.trim().length >=3 ? 'Search Results' : 'Available Movies'}
              </h2>
              {isFetchingInitialMovies ? (
                <div className="flex justify-center items-center h-64">
                  <LoaderCircle className="h-16 w-16 animate-spin text-primary" />
                </div>
              ) : (
                moviesToDisplay.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
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
                  <Card className="flex flex-col items-center justify-center text-center p-8 h-64 bg-card border-dashed border-border">
                    <Film className="h-16 w-16 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground font-medium">
                      {searchTerm ? 'No movies found for your search.' : 'No movies available.'}
                    </p>
                  </Card>
                )
              )}
        </section>
        
        <section id="recommendations-section">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-3xl font-bold text-foreground">
                  Your AI Recommendations
              </h2>
              {recommendations.length > 0 && (
                <Button onClick={handleDownloadRecommendations} variant="outline" size="sm" className="bg-secondary hover:bg-border">
                  <Download className="mr-2 h-4 w-4" />
                  Download JSON
                </Button>
              )}
            </div>
            {isPending ? (
                <div className="flex justify-center items-center h-64">
                    <LoaderCircle className="h-16 w-16 animate-spin text-primary" />
                </div>
            ) : recommendations.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
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
                <Card className="flex flex-col items-center justify-center text-center p-8 h-64 bg-card border-dashed border-border">
                    <Film className="h-16 w-16 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground font-medium">
                        Your personalized movie recommendations will appear here.
                    </p>
                </Card>
            )}
        </section>
      </main>
      <footer className="text-center p-6 text-muted-foreground border-t border-border mt-12">
        Made by Agrannya SIngh
      </footer>
    </div>
  );
}
