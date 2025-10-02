'use client';

import { useState, useMemo, useCallback, useTransition, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
// Assuming Movie type has an optional genres array: genres?: string[]
import { Movie, getMovies, searchMovies, transformApiMovie } from '@/lib/movies';
import { MovieCard } from '@/components/movie-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { Search, Film, LoaderCircle, Download, Clapperboard } from 'lucide-react';
import type { ApiMovie } from '@/lib/movies';
import Autoplay from "embla-carousel-autoplay"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"
import { TooltipProvider } from '@/components/ui/tooltip';

type GroupedMovies = {
  [genre: string]: Movie[];
}

// FIX: Moved utility function outside the component to prevent re-creation on every render.
const getUniqueMovies = (movies: Movie[]): Movie[] => {
  const uniqueIds = new Set<string>();
  return movies.filter(movie => {
      if (!movie.id || uniqueIds.has(movie.id)) {
          return false;
      }
      uniqueIds.add(movie.id);
      return true;
  });
};

export default function Home() {
  const { toast } = useToast();
  const { user, signOut } = useAuth();
  
  const [allMovies, setAllMovies] = useState<Movie[]>([]);
  const [groupedMovies, setGroupedMovies] = useState<GroupedMovies>({});

  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<Movie[]>([]);
  const [selectedMovies, setSelectedMovies] = useState<Map<string, string>>(new Map());
  const [recommendations, setRecommendations] = useState<Movie[]>([]);
  const [isPending, startTransition] = useTransition();

  const autoplayPlugin = useRef(
    Autoplay({ delay: 2500, stopOnInteraction: true })
  );

  const fetchAllMovies = useCallback(async () => {
    try {
        const fetchedMovies = await getMovies();
        if (!fetchedMovies) throw new Error("API returned no movies.");

        const uniqueMovies = getUniqueMovies(fetchedMovies);
        setAllMovies(uniqueMovies);

        // REFACTOR: Dynamic grouping based on actual movie genres instead of hardcoding.
        const groups: GroupedMovies = {
          'Top Rated': [...uniqueMovies]
            .sort((a, b) => b.vote_average - a.vote_average)
            .filter(movie => movie.vote_average >= 7.5)
            .slice(0, 20),
          'Recently Added': [...uniqueMovies]
            .sort((a, b) => 
                // Handle potentially missing dates gracefully
                new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
            )
            .slice(0, 20),
        };
        
        // Dynamically create a group for each genre
        uniqueMovies.forEach(movie => {
            // Assuming movie.genres is an array of strings like ['Action', 'Adventure']
            (movie.genres || ['General']).forEach(genre => {
                if (!groups[genre]) {
                    groups[genre] = [];
                }
                groups[genre].push(movie);
            });
        });
        
        setGroupedMovies(groups);

    } catch (error) {
        console.error("Failed to fetch movies:", error);
        toast({
            title: 'Error',
            description: 'Could not fetch movies. Please try refreshing the page.',
            variant: 'destructive',
        });
    }
  }, [toast]); // Dependency array is correct

  useEffect(() => {
    fetchAllMovies();
  }, [fetchAllMovies]);

  // FIX: Decoupled search logic from main movie fetching
  const handleSearch = useCallback(async (query: string) => {
    const trimmedQuery = query.trim();
    if (trimmedQuery.length < 2) {
      setSearchResults([]);
      return;
    }
    
    setIsSearching(true);
    try {
        const results = await searchMovies(trimmedQuery);
        
        // FIX: Display all search results, not just new ones.
        setSearchResults(results);

        // OPTIMIZATION: Add new movies from search to the main list in the background
        const newMovies = results.filter(
          (movie) => !allMovies.some((m) => m.id === movie.id)
        );

        if (newMovies.length > 0) {
          setAllMovies((prevMovies) => getUniqueMovies([...prevMovies, ...newMovies]));
        }

        if (results.length === 0) {
            toast({
                title: 'No Results',
                description: `Could not find any movies matching "${trimmedQuery}".`,
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
  }, [toast, allMovies]); // allMovies dependency is needed to check for new movies

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      handleSearch(searchTerm);
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
        title: 'Selection Required',
        description: 'Please select at least one movie to get recommendations.',
        variant: 'destructive',
      });
      return;
    }

    startTransition(async () => {
      try {
        const response = await fetch('/api/recommend', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            movie_ids: Array.from(selectedMovies.keys()),
            num_recommendations: 10,
          }),
        });

        if (!response.ok) {
           const errorData = await response.json();
           throw new Error(errorData.detail || 'Failed to fetch recommendations');
        }

        const recommendedApiMovies: ApiMovie[] = await response.json();
        const recommendedMovieData = recommendedApiMovies
          .map(transformApiMovie)
          .filter((movie): movie is Movie => movie !== null)
          // Also filter out movies that are already in the selection
          .filter(movie => !selectedMovies.has(movie.id));

        setRecommendations(recommendedMovieData);
        document.getElementById('recommendations-section')?.scrollIntoView({ behavior: 'smooth' });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
        console.error('Error getting recommendations:', error);
        toast({
          title: 'Recommendation Error',
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
  
  // Conditionally render carousels for a better UX
  const renderCarousel = (title: string, movies: Movie[]) => (
    movies.length > 0 && (
      <div key={title}>
        <h2 className="text-2xl font-bold text-foreground mb-4">{title}</h2>
        <Carousel
          plugins={[autoplayPlugin.current]}
          opts={{ align: "start", loop: movies.length > 5 }}
          className="w-full"
          onMouseEnter={autoplayPlugin.current.stop}
          onMouseLeave={autoplayPlugin.current.reset}
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
  );

  return (
    <TooltipProvider delayDuration={300}>
      <div className="flex flex-col min-h-screen bg-background text-foreground">
        <header className="sticky top-0 z-20 w-full bg-gradient-to-b from-background to-transparent backdrop-blur-sm">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-20">
            <Link href="/" className="flex items-center space-x-4">
              <Clapperboard className="h-10 w-10 text-primary" />
              <h1 className="text-3xl md:text-4xl font-bold tracking-tighter">
                ScreenScout
              </h1>
            </Link>
            <div className="flex items-center space-x-4">
              {user ? (
                <>
                  <Button variant="outline" asChild>
                    <Link href="/dashboard">Dashboard</Link>
                  </Button>
                  <Button onClick={signOut}>Sign Out</Button>
                </>
              ) : (
                <>
                  <Button variant="outline" asChild>
                    <Link href="/login">Sign In</Link>
                  </Button>
                  <Button asChild>
                    <Link href="/signup">Sign Up</Link>
                  </Button>
                </>
              )}
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
                          <ul className="space-y-2 p-1">
                              {Array.from(selectedMovies.entries()).map(([id, title]) => (
                                <li key={id} className="text-sm text-foreground font-medium p-2 bg-background/50 rounded-md truncate">{title}</li>
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
                          {isPending ? (
                            <LoaderCircle className="mr-2 h-5 w-5 animate-spin" />
                          ) : (
                            'Get AI Recommendations'
                          )}
                      </Button>
                  </div>
              </div>
          </section>
          
          <section className="space-y-8">
            {/* REFACTOR: Display search results separately at the top without hiding other categories */}
            {searchTerm.trim().length > 0 && !isSearching && (
              searchResults.length > 0
                ? renderCarousel('Search Results', searchResults)
                : (
                  <Card className="flex flex-col items-center justify-center text-center p-8 h-48 bg-card border-dashed border-border">
                    <Film className="h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground font-medium">No movies found for "{searchTerm}"</p>
                    <p className="text-sm text-muted-foreground">Try a different search term.</p>
                  </Card>
                )
            )}
            
            {Object.entries(groupedMovies).map(([genre, movies]) => renderCarousel(genre, movies))}
            
            {allMovies.length === 0 && !isSearching && (
              <Card className="flex flex-col items-center justify-center text-center p-8 h-64 bg-card border-dashed border-border">
                  <Film className="h-16 w-16 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground font-medium">Loading movies or none available.</p>
              </Card>
            )}
          </section>
          
          <section id="recommendations-section" className="space-y-8 scroll-mt-24">
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
                    plugins={[autoplayPlugin.current]}
                    opts={{ align: "start", loop: recommendations.length > 5 }}
                    className="w-full"
                    onMouseEnter={autoplayPlugin.current.stop}
                    onMouseLeave={autoplayPlugin.current.reset}
                  >
                    <CarouselContent>
                      {recommendations.map((movie) => (
                        <CarouselItem key={movie.id} className="basis-1/2 sm:basis-1/3 md:basis-1/4 lg:basis-1/5 xl:basis-1/6">
                            <MovieCard
                              movie={movie}
                              isSelected={false}
                              // Allow selecting a recommendation to refine further
                              onSelect={() => handleSelectMovie(movie)}
                              isRecommendation={true}
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
                          Select some movies and click "Get AI Recommendations" to see your personalized results here.
                      </p>
                  </Card>
              )}
          </section>
        </main>
        <footer className="text-center p-6 text-muted-foreground border-t border-border mt-12">
           Developed and Maintained by Agrannya-Singh
        </footer>
      </div>
    </TooltipProvider>
  );
}