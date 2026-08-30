"use client";

import { useState, useEffect, useRef } from "react";
import { Movie, searchMovies, getRecommendations, getMovies } from "@/lib/movies";
import { MovieCard } from "@/components/movie-card";
import { Loader2, Search, ChevronRight, ChevronLeft } from "lucide-react";

// --- SVG Decorative Components ---

function HexagonIcon({ className = "" }: { className?: string }) {
    return (
        <svg viewBox="0 0 24 24" fill="none" className={className}>
            <polygon
                points="12,2 22,8.5 22,15.5 12,22 2,15.5 2,8.5"
                stroke="currentColor"
                strokeWidth="1"
                fill="none"
            />
        </svg>
    );
}

function CornerPolygons() {
    return (
        <>
            {/* Top-left */}
            <svg className="absolute top-0 left-0 w-8 h-8 text-cyan-500/40" viewBox="0 0 32 32" fill="none">
                <polyline points="0,16 0,0 16,0" stroke="currentColor" strokeWidth="1.5" />
            </svg>
            {/* Top-right */}
            <svg className="absolute top-0 right-0 w-8 h-8 text-cyan-500/40" viewBox="0 0 32 32" fill="none">
                <polyline points="16,0 32,0 32,16" stroke="currentColor" strokeWidth="1.5" />
            </svg>
            {/* Bottom-left */}
            <svg className="absolute bottom-0 left-0 w-8 h-8 text-cyan-500/40" viewBox="0 0 32 32" fill="none">
                <polyline points="0,16 0,32 16,32" stroke="currentColor" strokeWidth="1.5" />
            </svg>
            {/* Bottom-right */}
            <svg className="absolute bottom-0 right-0 w-8 h-8 text-cyan-500/40" viewBox="0 0 32 32" fill="none">
                <polyline points="16,32 32,32 32,16" stroke="currentColor" strokeWidth="1.5" />
            </svg>
        </>
    );
}

function DiamondDivider() {
    return (
        <div className="flex items-center justify-center gap-3 py-2">
            <div className="flex-1 h-px bg-gradient-to-r from-transparent to-cyan-500/20"></div>
            <svg viewBox="0 0 12 12" className="w-3 h-3 text-cyan-500/40">
                <polygon points="6,0 12,6 6,12 0,6" fill="currentColor" />
            </svg>
            <div className="flex-1 h-px bg-gradient-to-l from-transparent to-cyan-500/20"></div>
        </div>
    );
}

// --- Horizontal Scroll Row ---
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
            <div className="flex items-center gap-3 px-4 md:px-0">
                <HexagonIcon className="w-5 h-5 text-cyan-500/60" />
                <h2 className="genre-heading text-xl font-mono font-semibold text-cyan-100/90 uppercase tracking-wider">
                    {title}
                </h2>
                <ChevronRight className="w-4 h-4 text-cyan-500/30 opacity-0 group-hover/row:opacity-100 transition-opacity" />
            </div>
            <div className="relative group/slider">
                <button
                    onClick={() => scroll('left')}
                    className="absolute left-0 top-0 bottom-0 z-10 bg-gradient-to-r from-black/90 to-transparent w-14 flex items-center justify-center opacity-0 group-hover/slider:opacity-100 transition-opacity duration-300"
                >
                    <ChevronLeft className="w-6 h-6 text-cyan-400" />
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
                    className="absolute right-0 top-0 bottom-0 z-10 bg-gradient-to-l from-black/90 to-transparent w-14 flex items-center justify-center opacity-0 group-hover/slider:opacity-100 transition-opacity duration-300"
                >
                    <ChevronRight className="w-6 h-6 text-cyan-400" />
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
        <main className="min-h-screen bg-black text-white pb-20 overflow-x-hidden tron-grid-bg relative">
            
            <div className="max-w-[1600px] mx-auto space-y-10 px-6 md:px-8 relative z-10">

                {/* Header */}
                <header className="text-center pt-14 pb-6 px-4 relative">
                    {/* Decorative hexagon behind logo */}
                    <div className="absolute top-8 left-1/2 -translate-x-1/2 opacity-[0.04]">
                        <svg viewBox="0 0 200 200" className="w-64 h-64 text-cyan-400">
                            <polygon points="100,10 185,55 185,145 100,190 15,145 15,55" stroke="currentColor" strokeWidth="0.5" fill="none" />
                            <polygon points="100,30 165,65 165,135 100,170 35,135 35,65" stroke="currentColor" strokeWidth="0.5" fill="none" />
                            <polygon points="100,50 145,75 145,125 100,150 55,125 55,75" stroke="currentColor" strokeWidth="0.5" fill="none" />
                        </svg>
                    </div>
                    <h1 className="text-5xl md:text-6xl font-black uppercase tracking-[0.25em] font-mono relative z-10">
                        <span className="text-glow text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-cyan-300 to-cyan-400">SCREEN</span>
                        <span className="text-white/90 drop-shadow-[0_0_20px_rgba(255,255,255,0.4)]">SCOUT</span>
                    </h1>
                    <p className="text-sm font-mono text-cyan-500/50 uppercase tracking-[0.3em] mt-3">
                        // semantic film discovery engine
                    </p>
                    <DiamondDivider />
                </header>

                {/* Search Section */}
                <section className="max-w-2xl mx-auto px-4 z-20 relative">
                    <form onSubmit={handleSearch} className="flex gap-3 relative">
                        <div className="relative flex-1">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-cyan-500/50 w-5 h-5" />
                            <input
                                type="text"
                                placeholder="Search by plot, vibe, or title..."
                                className="w-full bg-black/80 border border-cyan-500/20 py-3.5 pl-12 pr-6 text-base font-mono focus:outline-none focus:border-cyan-400/60 focus:shadow-[0_0_15px_rgba(6,182,212,0.15)] transition-all placeholder:text-cyan-800/40 text-cyan-100 glow-pulse"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                            />
                        </div>
                        <button
                            type="submit"
                            className="bg-transparent border border-cyan-500/40 text-cyan-400 font-mono font-semibold px-6 hover:bg-cyan-400 hover:text-black transition-all disabled:opacity-50 uppercase tracking-wider text-sm"
                            disabled={searching}
                        >
                            {searching ? <Loader2 className="animate-spin w-5 h-5" /> : "Scan"}
                        </button>
                    </form>
                </section>

                {/* Selected Movies Panel */}
                {selectedMovies.length > 0 && (
                    <section className="bg-black/95 p-6 border border-cyan-500/20 mx-4 relative animate-in fade-in slide-in-from-bottom-4 overflow-hidden">
                        <CornerPolygons />
                        
                        {/* Top scan line */}
                        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-cyan-400/40 to-transparent"></div>

                        <div className="flex items-center justify-between mb-5 relative z-10">
                            <div className="flex items-center gap-3">
                                <HexagonIcon className="w-5 h-5 text-cyan-400/70" />
                                <h2 className="text-base font-mono text-cyan-400 font-semibold uppercase tracking-[0.15em]">
                                    Selected Inputs
                                </h2>
                                <span className="text-xs font-mono text-cyan-500/50 border border-cyan-500/20 px-2 py-0.5">
                                    {selectedMovies.length} / 5
                                </span>
                            </div>
                            <button 
                                onClick={() => setSelectedMovies([])} 
                                className="text-xs font-mono text-cyan-600/60 hover:text-red-400 transition-colors uppercase tracking-wider border border-cyan-500/10 px-3 py-1 hover:border-red-400/30"
                            >
                                Clear
                            </button>
                        </div>
                        
                        <div className="flex gap-4 overflow-x-auto pb-4" style={{ scrollbarWidth: 'none' }}>
                            {selectedMovies.map(movie => (
                                <div key={movie.id} className="min-w-[90px] w-[90px] relative group">
                                    <div className="border border-cyan-500/20 overflow-hidden relative hover:border-cyan-400/50 transition-colors">
                                        <img
                                            src={movie.poster_url || "https://placehold.co/100x150?text=No+Image"}
                                            alt={movie.title}
                                            className="w-full h-auto aspect-[2/3] object-cover opacity-75 group-hover:opacity-100 transition-opacity"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </div>
                                    <button
                                        onClick={() => toggleSelection(movie)}
                                        className="absolute -top-1.5 -right-1.5 bg-black border border-cyan-500/50 text-cyan-400 w-5 h-5 flex items-center justify-center text-[10px] font-mono hover:bg-red-500 hover:border-red-500 hover:text-white transition-colors"
                                    >✕</button>
                                    <p className="text-[10px] font-mono text-cyan-500/50 truncate mt-1.5">{movie.title}</p>
                                </div>
                            ))}
                        </div>

                        <DiamondDivider />

                        {/* Mood Input & Action */}
                        <div className="flex flex-col md:flex-row gap-4 items-end relative z-10 mt-2">
                            <div className="flex-1 w-full space-y-2">
                                <label className="text-[10px] font-mono text-cyan-500/40 uppercase tracking-[0.2em] ml-1">
                                    Mood Vector <span className="text-cyan-700/40">(optional)</span>
                                </label>
                                <input
                                    placeholder="e.g. 'Something dark but funny' or 'I want to cry'"
                                    className="w-full bg-black/60 border border-cyan-500/15 px-4 py-3 focus:outline-none focus:border-cyan-400/40 focus:shadow-[0_0_10px_rgba(6,182,212,0.1)] transition-all text-cyan-100/90 font-mono text-sm placeholder:text-cyan-800/30"
                                    value={mood}
                                    onChange={(e) => setMood(e.target.value)}
                                />
                            </div>
                            <button
                                onClick={handleRecommend}
                                disabled={loadingRecs}
                                className="btn-suggest w-full md:w-auto border border-cyan-400/60 text-cyan-400 font-mono font-bold py-3 px-12 transition-all disabled:opacity-50 flex items-center justify-center gap-3 uppercase tracking-[0.2em] text-sm hover:bg-cyan-400 hover:text-black"
                            >
                                {loadingRecs ? <Loader2 className="animate-spin w-5 h-5" /> : (
                                    <span className="flex items-center gap-2">
                                        <svg viewBox="0 0 16 16" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.5">
                                            <polygon points="8,1 15,5.5 15,10.5 8,15 1,10.5 1,5.5" />
                                        </svg>
                                        Suggest
                                    </span>
                                )}
                            </button>
                        </div>
                    </section>
                )}

                {/* 1. Recommendations Mode */}
                {showRecommendations && recommendations && (
                    <section className="space-y-8 animate-in fade-in px-4">
                        <div className="bg-black/95 border border-cyan-500/20 p-6 relative overflow-hidden">
                            <CornerPolygons />
                            <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-cyan-400/80 via-cyan-400/20 to-transparent"></div>
                            
                            <div className="flex items-center gap-2 mb-3">
                                <HexagonIcon className="w-4 h-4 text-cyan-500/60" />
                                <h3 className="text-cyan-400/80 font-mono font-semibold text-xs uppercase tracking-[0.2em]">
                                    Analysis Output
                                </h3>
                            </div>
                            <p className="text-sm leading-relaxed text-cyan-100/70 font-mono pl-6 border-l border-cyan-500/10">
                                {recommendations.ai_response}
                            </p>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-5">
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
                        <div className="flex items-center gap-3 mb-6">
                            <HexagonIcon className="w-5 h-5 text-cyan-500/60" />
                            <h2 className="genre-heading text-xl font-mono font-semibold text-cyan-100/90 uppercase tracking-wider">
                                Search Results
                            </h2>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-5">
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
                    <section className="space-y-10 pb-20">
                        {loadingFeed ? (
                            <div className="flex flex-col items-center justify-center py-40 gap-4">
                                <Loader2 className="animate-spin w-10 h-10 text-cyan-400" />
                                <p className="text-xs font-mono text-cyan-500/40 uppercase tracking-widest">Loading</p>
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
