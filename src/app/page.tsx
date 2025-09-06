
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
import { Badge } from '@/components/ui/badge';

export default function Home() {
  const { toast } = useToast();
  
  const [moviesToDisplay, setMoviesToDisplay] = useState<Movie[]>([]);
  const [isFetchingInitialMovies, setIsFetchingInitialMovies] = useState(true);

  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [selectedMovies, setSelectedMovies] = useState<Map<string, string>>(new Map()); // Map of ID to Title
  const [recommendations, setRecommendations] = useState<Movie[]>([]);
  const [isPending, startTransition] = useTransition();
  const [genres, setGenres] = useState<string[]>([]);
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null);

  const fetchAllMovies = useCallback(async (selectGenre: string | null = selectedGenre) => {
    setIsFetchingInitialMovies(true);
    try {
        const fetchedMovies = await getMovies();
        const uniqueGenres = new Set<string>();
        fetchedMovies.forEach(movie => {
            if (movie.genre) {
                movie.genre.split(',').forEach(g => {
                    const trimmed = g.trim().toLowerCase();
                    if (trimmed) uniqueGenres.add(trimmed);
                });
            }
        });
        setGenres(Array.from(uniqueGenres).sort());
        
        let moviesToShow = fetchedMovies;
        if (selectGenre) {
          moviesToShow = fetchedMovies.filter(m => m.genre.toLowerCase().includes(selectGenre.toLowerCase()));
        }
        setMoviesToDisplay(moviesToShow);

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
  }, [toast, selectedGenre]);

  useEffect(() => {
    fetchAllMovies();
  }, []);

 const handleSearch = useCallback(async (query: string) => {
    const trimmedQuery = query.trim();
    if (trimmedQuery.length === 0) {
        fetchAllMovies(null);
        return;
    }
    
    setIsSearching(true);
    try {
        const results = await searchMovies(trimmedQuery);
        
        if (results.length > 0) {
            // Add new movies to the display list if they aren't already there
            setMoviesToDisplay(prevMovies => {
                const existingIds = new Set(prevMovies.map(m => m.id));
                const newMovies = results.filter(r => !existingIds.has(r.id));
                return [...results, ...prevMovies.filter(pm => !results.some(r => r.id === pm.id))];
            });
            // After a successful search that adds a movie, refetch all movies
            // to ensure the genre list and main list are up to date.
            const isNewMovie = results.some(r => !moviesToDisplay.some(m => m.id === r.id));
            if (isNewMovie) {
                fetchAllMovies(null);
            }

        } else {
            toast({
                title: 'Search Result',
                description: 'Movie not found.',
            });
            fetchAllMovies(selectedGenre); 
        }
        setSelectedGenre(null); 
        
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
}, [toast, fetchAllMovies, selectedGenre, moviesToDisplay]);


  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      if (searchTerm) {
        handleSearch(searchTerm);
      } else if (!isFetchingInitialMovies) { // Avoid refetching if initial load isn't done
        fetchAllMovies(selectedGenre);
      }
    }, 500);

    return () => clearTimeout(debounceTimer);
  }, [searchTerm, handleSearch, selectedGenre, fetchAllMovies, isFetchingInitialMovies]);


  const handleSelectMovie = useCallback((movie: Movie) => {
    // Only allow selection if the movie is in the main displayed list
    if (moviesToDisplay.find(m => m.id === movie.id)) {
        setSelectedMovies(prev => {
            const newMap = new Map(prev);
            if (newMap.has(movie.id)) {
                newMap.delete(movie.id);
            } else {
                newMap.set(movie.id, movie.title);
            }
            return newMap;
        });
    } else {
        toast({
            title: "Movie Not Ready",
            description: "This movie is being added to the library. Please wait a moment and try again.",
            variant: "default"
        })
    }
  }, [moviesToDisplay, toast]);
  
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
  
  const handleGenreSelect = (genre: string | null) => {
    setSelectedGenre(genre);
    setSearchTerm(''); 
    fetchAllMovies(genre);
  };
  
  const filteredMoviesHeader = useMemo(() => {
    if (searchTerm.trim().length > 0 && !isSearching) {
      return 'Search Results';
    }
    if (selectedGenre) {
      return `Movies: ${selectedGenre.charAt(0).toUpperCase() + selectedGenre.slice(1)}`;
    }
    return 'All Available Movies';
  }, [searchTerm, selectedGenre, isSearching]);


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
                            placeholder="Search for any movie to add it..."
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
        
        <section>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
                <h2 className="text-3xl font-bold text-foreground mb-4 sm:mb-0">
                  {filteredMoviesHeader}
                  <Badge variant="secondary" className="ml-3 text-lg">{moviesToDisplay.length}</Badge>
                </h2>
                <div className="flex flex-wrap gap-2 justify-start sm:justify-end">
                  <Button 
                    variant={selectedGenre === null ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleGenreSelect(null)}
                    className="font-semibold"
                  >
                    All Genres
                  </Button>
                  {genres.map(genre => (
                    <Button 
                      key={genre}
                      variant={selectedGenre === genre ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => handleGenreSelect(genre)}
                      className="font-semibold capitalize"
                    >
                      {genre}
                    </Button>
                  ))}
                </div>
              </div>
              {isFetchingInitialMovies ? (
                <div className="flex flex-col justify-center items-center h-64 space-y-4">
                  <LoaderCircle className="h-16 w-16 animate-spin text-primary" />
                  <p className="text-muted-foreground font-medium text-center">
                    Waking up the movie database...<br />This may take up to a minute on the first load.
                  </p>
                </div>
              ) : (
                moviesToDisplay.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
                    {moviesToDisplay.map((movie) => (
                      <MovieCard
                        key={movie.id}
                        movie={movie}
                        isSelected={selectedMovies.has(movie.id)}
                        onSelect={() => handleSelectMovie(movie)}
                      />
                    ))}
                  </div>
                ) : (
                  <Card className="flex flex-col items-center justify-center text-center p-8 h-64 bg-card border-dashed border-border">
                    <Film className="h-16 w-16 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground font-medium">
                      {searchTerm ? 'No movies found for your search.' : (selectedGenre ? `No movies found in the ${selectedGenre} genre.` : 'No movies available.')}
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

    