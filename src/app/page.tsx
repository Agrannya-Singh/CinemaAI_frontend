
'use client';

import { useState, useMemo, useCallback, useTransition, useEffect } from 'react';
import { Movie, getMovies, searchMovies, transformApiMovie } from '@/lib/movies';
import { MovieCard } from '@/components/movie-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { Search, Film, LoaderCircle, Download, Clapperboard } from 'lucide-react';
import type { ApiMovie } from '@/lib/movies';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"

type GroupedMovies = {
  [genre: string]: Movie[];
}

export default function Home() {
  const { toast } = useToast();
  
  const [allMovies, setAllMovies] = useState<Movie[]>([]);
  const [groupedMovies, setGroupedMovies] = useState<GroupedMovies>({});

  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<Movie[]>([]);
  const [selectedMovies, setSelectedMovies] = useState<Map<string, string>>(new Map()); // Map of ID to Title
  const [recommendations, setRecommendations] = useState<Movie[]>([]);
  const [isPending, startTransition] = useTransition();

  const getUniqueMovies = (movies: Movie[]): Movie[] => {
    const uniqueIds = new Set<string>();
    return movies.filter(movie => {
        if (uniqueIds.has(movie.id)) {
            return false;
        }
        uniqueIds.add(movie.id);
        return true;
    });
  };

  const fetchAllMovies = useCallback(async () => {
    try {
        const fetchedMovies = await getMovies();
        const uniqueMovies = getUniqueMovies(fetchedMovies);
        setAllMovies(uniqueMovies);

        const genres: GroupedMovies = {};
        uniqueMovies.forEach(movie => {
          if (movie.genre) {
            movie.genre.split(',').forEach(g => {
              const trimmedGenre = g.trim();
              if(trimmedGenre) {
                if (!genres[trimmedGenre]) {
                  genres[trimmedGenre] = [];
                }
                genres[trimmedGenre].push(movie);
              }
            });
          }
        });
        setGroupedMovies(genres);

    } catch (error) {
        console.error("Failed to fetch movies:", error);
        toast({
            title: 'Error',
            description: 'Could not fetch movies. Please try refreshing the page.',
            variant: 'destructive',
        });
    }
  }, [toast]);

  useEffect(() => {
    fetchAllMovies();
  }, [fetchAllMovies]);

  const handleSearch = useCallback(async (query: string) => {
    const trimmedQuery = query.trim();
    if (trimmedQuery.length < 2) {
      setSearchResults([]);
      return;
    }
    
    setIsSearching(true);
    try {
        const results = await searchMovies(trimmedQuery);
        setSearchResults(results);
        if (results.length === 0) {
            toast({
                title: 'Search Result',
                description: 'Movie not found.',
            });
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
  }, [toast]);

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      if (searchTerm) {
        handleSearch(searchTerm);
      } else {
        setSearchResults([]);
      }
    }, 500);

    return () => clearTimeout(debounceTimer);
  }, [searchTerm, handleSearch]);

  const handleSelectMovie = useCallback((movie: Movie) => {
    setSelectedMovies(prev => {
        const newMap = new Map(prev);
        if (newMap.has(movie.id)) {
            newMap.delete(movie.id);
        } else {
            newMap.set(movie.id, movie.title);
        }
        return newMap;
    });
  }, []);
  
  const handleGetRecommendations = async () => {
    if (selectedMovies.size === 0) {
      toast({
        title: 'Selection Incomplete',
        description: 'Please select at least one movie to get recommendations.',
        variant: 'destructive',
      });
      return;
    }

    startTransition(async () => {
      try {
        const requestBody = {
          movie_ids: Array.from(selectedMovies.keys()),
          num_recommendations: 10,
        };
        
        const response = await fetch('/api/recommend', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
           const errorData = await response.json();
           throw new Error(errorData.detail || 'Failed to fetch recommendations');
        }

        const recommendedApiMovies: ApiMovie[] = await response.json();
        const recommendedMovieData = recommendedApiMovies
          .map(transformApiMovie)
          .filter((movie): movie is Movie => movie !== null)
          .filter(movie => !selectedMovies.has(movie.id));

        setRecommendations(recommendedMovieData);
        document.getElementById('recommendations-section')?.scrollIntoView({ behavior: 'smooth' });
      } catch (error) {
        console.error('Error getting recommendations:', error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
        toast({
          title: 'Error Getting Recommendations',
          description: errorMessage,
          variant: 'destructive',
        });
      }
    });
  };

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
  
  const movieListsToDisplay = useMemo(() => {
    if (searchTerm.trim().length > 0) {
      return { 'Search Results': searchResults };
    }
    return groupedMovies;
  }, [searchTerm, searchResults, groupedMovies]);

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
       <header className="sticky top-0 z-20 w-full bg-gradient-to-b from-background to-transparent">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-20">
            <div className="flex items-center space-x-4">
                <Clapperboard className="h-10 w-10 text-primary" />
                <h1 className="text-3xl md:text-4xl font-bold tracking-tighter">
                    ScreenScout
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
                            placeholder="Search for any movie..."
                            className="pl-10 text-base bg-secondary border-border focus:ring-primary"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="space-y-4">
                    <h2 className="text-2xl font-bold text-primary">
                        2. Your Selections ({selectedMovies.size})
                    </h2>
                     <ScrollArea className="h-40 rounded-md border border-border bg-secondary p-2">
                        {selectedMovies.size > 0 ? (
                        <ul className="space-y-2">
                            {Array.from(selectedMovies.entries()).map(([id, title]) => (
                            <li key={id} className="text-sm text-foreground font-medium p-2 bg-background/50 rounded-md">{title}</li>
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
                        disabled={isPending || selectedMovies.size === 0}
                        >
                        {isPending && <LoaderCircle className="mr-2 h-5 w-5 animate-spin" />}
                        Get AI Recommendations
                    </Button>
                </div>
            </div>
        </section>
        
        <section className="space-y-8">
          {Object.entries(movieListsToDisplay).map(([genre, movies]) => (
            movies.length > 0 && (
              <div key={genre}>
                <h2 className="text-2xl font-bold text-foreground mb-4">{genre}</h2>
                <Carousel
                  opts={{
                    align: "start",
                    loop: movies.length > 5,
                  }}
                  className="w-full"
                >
                  <CarouselContent>
                    {movies.map((movie) => (
                      <CarouselItem key={movie.id} className="basis-1/2 sm:basis-1/3 md:basis-1/4 lg:basis-1/5 xl:basis-1/6">
                          <MovieCard
                            movie={movie}
                            isSelected={selectedMovies.has(movie.id)}
                            onSelect={() => handleSelectMovie(movie)}
                          />
                      </CarouselItem>
                    ))}
                  </CarouselContent>
                  <CarouselPrevious />
                  <CarouselNext />
                </Carousel>
              </div>
            )
          ))}
          {allMovies.length === 0 && !isSearching && (
             <Card className="flex flex-col items-center justify-center text-center p-8 h-64 bg-card border-dashed border-border">
                <Film className="h-16 w-16 text-muted-foreground mb-4" />
                <p className="text-muted-foreground font-medium">No movies available. Try searching for one!</p>
             </Card>
          )}
        </section>
        
        <section id="recommendations-section" className="space-y-8">
            <div className="flex justify-between items-center">
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
                 <Carousel
                  opts={{
                    align: "start",
                    loop: recommendations.length > 5,
                  }}
                  className="w-full"
                >
                  <CarouselContent>
                    {recommendations.map((movie) => (
                      <CarouselItem key={movie.id} className="basis-1/2 sm:basis-1/3 md:basis-1/4 lg:basis-1/5 xl:basis-1/6">
                          <MovieCard
                            movie={movie}
                            isSelected={false}
                            onSelect={() => {}}
                          />
                      </CarouselItem>
                    ))}
                  </CarouselContent>
                  <CarouselPrevious />
                  <CarouselNext />
                </Carousel>
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
        Made with ❤️ by the ScreenScout Team
      </footer>
    </div>
  );
}
