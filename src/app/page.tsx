"use client";

import { useState, useEffect, useRef } from "react";
import { Movie, searchMovies, getRecommendations, getMovies } from "@/lib/movies";
import { MovieCard } from "@/components/movie-card";
import { Loader2, Sparkles, Search, TrendingUp, ChevronRight, ChevronLeft } from "lucide-react";

// --- Components ---

// Horizontal Scroll Row
function MovieRow({ title, movies, onSelect, selectedIds }: { title: string, movies: Movie[], onSelect: (m: Movie) => void, selectedIds: string[] }) {
    const rowRef = useRef<HTMLDivElement>(null);

    const scroll = (direction: 'left' | 'right') => {
        if (rowRef.current) {
            const { current } = rowRef;
            const scrollAmount = direction === 'left' ? -window.innerWidth / 2 : window.innerWidth / 2;
            current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
        }
    };

    if (movies.length === 0) return null;

    return (
        <div className="space-y-4 py-4 group/row">
            <h2 className="text-2xl font-bold text-gray-100 flex items-center gap-2 px-4 md:px-0">
                {title} <ChevronRight className="w-5 h-5 text-gray-500 opacity-0 group-hover/row:opacity-100 transition-opacity" />
            </h2>
            <div className="relative group/slider">
                <button
                    onClick={() => scroll('left')}
                    className="absolute left-0 top-0 bottom-0 z-10 bg-black/50 hover:bg-black/80 w-12 flex items-center justify-center opacity-0 group-hover/slider:opacity-100 transition-opacity duration-300"
                >
                    <ChevronLeft className="w-8 h-8" />
                </button>

                <div
                    ref={rowRef}
                    className="flex gap-4 overflow-x-auto pb-4 px-4 md:px-0 scrollbar-hide scroll-smooth snap-x"
                    style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                >
                    {movies.map((movie) => (
                        <div key={movie.id} className="min-w-[160px] md:min-w-[200px] snap-start">
                            <MovieCard
                                movie={movie}
                                isSelected={selectedIds.includes(movie.id)}
                                onSelect={onSelect}
                            />
                        </div>
                    ))}
                </div>

                <button
                    onClick={() => scroll('right')}
                    className="absolute right-0 top-0 bottom-0 z-10 bg-black/50 hover:bg-black/80 w-12 flex items-center justify-center opacity-0 group-hover/slider:opacity-100 transition-opacity duration-300"
                >
                    <ChevronRight className="w-8 h-8" />
                </button>
            </div>
        </div>
    );
}


export default function Home() {
    // Data State
    const [allMovies, setAllMovies] = useState<Movie[]>([]); // Full 950+ DB
    const [groupedMovies, setGroupedMovies] = useState<{ [genre: string]: Movie[] }>({});

    // UI State
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<Movie[]>([]); // Search Results
    const [selectedMovies, setSelectedMovies] = useState<Movie[]>([]);
    const [mood, setMood] = useState("");
    const [recommendations, setRecommendations] = useState<{ ai_response: string, movies: Movie[] } | null>(null);

    // Loading States
    const [loadingRecs, setLoadingRecs] = useState(false);
    const [searching, setSearching] = useState(false);
    const [loadingFeed, setLoadingFeed] = useState(true);

    // Initial Load (Fetch ALL)
    useEffect(() => {
        async function fetchAll() {
            try {
                // Fetch limit=1000 to get everything
                const data = await getMovies(1, 1000);
                setAllMovies(data.data);
                processGenres(data.data);
            } catch (e) {
                console.error("Failed to load DB", e);
            } finally {
                setLoadingFeed(false);
            }
        }
        fetchAll();
    }, []);

    // Genre Processing Logic
    const processGenres = (movies: Movie[]) => {
        // Shuffle movies to randomize the feed on every reload
        const shuffledMovies = [...movies].sort(() => 0.5 - Math.random());
        
        const groups: { [key: string]: Movie[] } = {};

        // 1. Top Rated Group
        groups["Top Rated"] = shuffledMovies.filter(m => (m.score || 0) >= 8.0).slice(0, 20);

        // 2. Discover (Random / Recent)
        groups["Discover"] = shuffledMovies.slice(0, 20);

        // 3. Genre Groups
        shuffledMovies.forEach(movie => {
            if (movie.genres) {
                // Handle different potential delimiters
                let genreList: string[] = [];
                if (typeof movie.genres === 'string') {
                    // Check if it's JSON array string or comma separated
                    if (movie.genres.startsWith('[')) {
                        try {
                            const parsed = JSON.parse(movie.genres.replace(/'/g, '"')); // Python list support
                            if (Array.isArray(parsed)) genreList = parsed;
                        } catch (e) {
                            // Fallback for simple string
                            genreList = movie.genres.replace(/[\[\]']/g, "").split(", ");
                        }
                    } else {
                        genreList = movie.genres.split(", ");
                    }
                }

                genreList.forEach(g => {
                    const genre = g.trim();
                    if (!groups[genre]) groups[genre] = [];
                    if (groups[genre].length < 20) { // Limit rows for performance
                        groups[genre].push(movie);
                    }
                });
            }
        });

        // Ensure we prioritize specific rows order
        setGroupedMovies(groups);
    };

    // Search Logic
    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!query.trim()) return;
        setSearching(true);
        setRecommendations(null);
        const movies = await searchMovies(query);
        setResults(movies);
        setSearching(false);
    };

    // Selection Logic
    const toggleSelection = (movie: Movie) => {
        if (selectedMovies.find(m => m.id === movie.id)) {
            setSelectedMovies(prev => prev.filter(m => m.id !== movie.id));
        } else {
            if (selectedMovies.length >= 5) {
                alert("You can select up to 5 movies.");
                return;
            }
            setSelectedMovies(prev => [...prev, movie]);
        }
    };

    // Recommendation Logic (Curate)
    const handleRecommend = async () => {
        if (selectedMovies.length === 0) {
            alert("Select at least one movie first!");
            return;
        }
        setLoadingRecs(true);
        setRecommendations(null);
        setResults([]);
        const data = await getRecommendations(selectedMovies, mood);
        setRecommendations(data);
        setLoadingRecs(false);
    };

    // Determine what to show
    const showRecommendations = !!recommendations;
    const showSearchResults = !showRecommendations && results.length > 0;
    const showFeed = !showRecommendations && !showSearchResults;

    const genreOrder = ["Top Rated", "Discover", "Action", "Science Fiction", "Adventure", "Crime", "Comedy", "Drama", "Thriller", "Horror", "Animation"];

    return (
        <main className="min-h-screen bg-black text-white p-8 pb-20 overflow-x-hidden">
            <div className="max-w-[1600px] mx-auto space-y-12">

                {/* Header */}
                <header className="text-center space-y-4 pt-10 px-4">
                    <h1 className="text-6xl font-black uppercase tracking-[0.2em] text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-cyan-200 drop-shadow-[0_0_15px_rgba(34,211,238,0.8)] font-mono">
                        Screen<span className="text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.8)]">Scout</span>
                    </h1>
                    <p className="text-xl text-gray-400">
                        Tell us what you like. We'll find what you love.
                    </p>
                </header>

                {/* Search Section */}
                <section className="max-w-2xl mx-auto px-4 z-20 relative">
                    <form onSubmit={handleSearch} className="flex gap-2 relative">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search by plot, vibe, or title..." // Updated placeholder
                                className="w-full bg-gray-900 border border-gray-800 rounded-full py-4 pl-12 pr-6 text-lg focus:outline-none focus:ring-2 focus:ring-purple-600 transition-all placeholder:text-gray-600 text-white"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                            />
                        </div>
                        <button
                            type="submit"
                            className="bg-white text-black font-bold rounded-full px-8 hover:bg-gray-200 transition-colors disabled:opacity-50"
                            disabled={searching}
                        >
                            {searching ? <Loader2 className="animate-spin" /> : "Search"}
                        </button>
                    </form>
                </section>

                {/* Selected Movies Bar */}
                {selectedMovies.length > 0 && (
                    <section className="bg-gray-900/50 p-6 rounded-2xl border border-gray-800 animate-in fade-in slide-in-from-bottom-4 mx-4">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-semibold flex items-center gap-2">
                                <Sparkles className="text-yellow-400" />
                                Your Inspiration ({selectedMovies.length}/5)
                            </h2>
                            <button onClick={() => setSelectedMovies([])} className="text-sm text-red-400 hover:text-red-300">Clear</button>
                        </div>
                        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800">
                            {selectedMovies.map(movie => (
                                <div key={movie.id} className="min-w-[100px] w-[100px] relative group">
                                    <img
                                        src={movie.poster_url || "https://placehold.co/100x150?text=No+Image"}
                                        alt={movie.title}
                                        className="rounded-md w-full h-auto aspect-[2/3] object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                                    />
                                    <button
                                        onClick={() => toggleSelection(movie)}
                                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs shadow-md hover:bg-red-600"
                                    >X</button>
                                </div>
                            ))}
                        </div>

                        {/* Mood Input & Action */}
                        <div className="mt-6 flex flex-col md:flex-row gap-4 items-end">
                            <div className="flex-1 w-full space-y-2">
                                <label className="text-sm text-gray-400 ml-1">Current Mood (Optional)</label>
                                <input
                                    placeholder="e.g. 'Something dark but funny' or 'I want to cry'"
                                    className="w-full bg-black/50 border border-gray-700 rounded-xl px-4 py-3 focus:outline-none focus:border-purple-500 transition-colors text-white"
                                    value={mood}
                                    onChange={(e) => setMood(e.target.value)}
                                />
                            </div>
                            <button
                                onClick={handleRecommend}
                                disabled={loadingRecs}
                                className="w-full md:w-auto bg-gradient-brand text-white font-bold py-3 px-8 rounded-xl shadow-lg hover:shadow-purple-900/50 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {loadingRecs ? <Loader2 className="animate-spin" /> : <><Sparkles className="w-5 h-5" /> Curate For Me</>}
                            </button>
                        </div>
                    </section>
                )}

                {/* 1. Recommendations Mode */}
                {showRecommendations && recommendations && (
                    <section className="space-y-8 animate-in fade-in px-4">
                        <div className="bg-gray-900/80 border border-purple-500/30 p-6 rounded-2xl">
                            <h3 className="text-purple-400 font-bold mb-2 text-sm uppercase tracking-wider">ScreenScout AI</h3>
                            <p className="text-lg leading-relaxed text-gray-200">
                                {recommendations.ai_response}
                            </p>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
                            {recommendations.movies.map(movie => (
                                <MovieCard
                                    key={movie.id}
                                    movie={movie}
                                    isSelected={selectedMovies.some(m => m.id === movie.id)}
                                    onSelect={toggleSelection}
                                />
                            ))}
                        </div>
                    </section>
                )}

                {/* 2. Search Results Mode */}
                {showSearchResults && (
                    <section className="px-4">
                        <h2 className="text-2xl font-bold mb-6 text-gray-400">Search Results</h2>
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
                            {results.map(movie => (
                                <MovieCard
                                    key={movie.id}
                                    movie={movie}
                                    isSelected={selectedMovies.some(m => m.id === movie.id)}
                                    onSelect={toggleSelection}
                                />
                            ))}
                        </div>
                    </section>
                )}

                {/* 3. Browse Mode (Netflix Style) */}
                {showFeed && (
                    <section className="space-y-12 pb-20 pl-4">
                        {loadingFeed ? (
                            <div className="flex justify-center py-40">
                                <Loader2 className="animate-spin w-12 h-12 text-purple-600" />
                            </div>
                        ) : (
                            <>
                                {/* Render Prioritized IDs first */}
                                {genreOrder.map(genre => groupedMovies[genre] && (
                                    <MovieRow
                                        key={genre}
                                        title={genre}
                                        movies={groupedMovies[genre]}
                                        selectedIds={selectedMovies.map(m => m.id)}
                                        onSelect={toggleSelection}
                                    />
                                ))}

                                {/* Render Remaining Genres */}
                                {Object.keys(groupedMovies)
                                    .filter(g => !genreOrder.includes(g) && groupedMovies[g].length > 4) // Filter out tiny categories
                                    .sort()
                                    .map(genre => (
                                        <MovieRow
                                            key={genre}
                                            title={genre}
                                            movies={groupedMovies[genre]}
                                            selectedIds={selectedMovies.map(m => m.id)}
                                            onSelect={toggleSelection}
                                        />
                                    ))
                                }
                            </>
                        )}
                    </section>
                )}

            </div>
        </main>
    );
}
