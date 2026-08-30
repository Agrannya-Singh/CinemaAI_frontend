"use client";

import { useState, useEffect, useRef } from "react";
import { Movie, searchMovies, getRecommendations, getMovies } from "@/lib/movies";
import { MovieCard } from "@/components/movie-card";
import { Loader2, Search, ChevronRight, ChevronLeft, Info, Plus, Check } from "lucide-react";

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
            <svg className="absolute top-0 left-0 w-8 h-8 text-cyan-500/40" viewBox="0 0 32 32" fill="none">
                <polyline points="0,16 0,0 16,0" stroke="currentColor" strokeWidth="1.5" />
            </svg>
            <svg className="absolute top-0 right-0 w-8 h-8 text-cyan-500/40" viewBox="0 0 32 32" fill="none">
                <polyline points="16,0 32,0 32,16" stroke="currentColor" strokeWidth="1.5" />
            </svg>
            <svg className="absolute bottom-0 left-0 w-8 h-8 text-cyan-500/40" viewBox="0 0 32 32" fill="none">
                <polyline points="0,16 0,32 16,32" stroke="currentColor" strokeWidth="1.5" />
            </svg>
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
        <div className="space-y-4 py-4 group/row relative z-20">
            <div className="flex items-center gap-3 px-6 md:px-12 z-10 relative">
                <h2 className="genre-heading text-lg md:text-xl font-mono font-bold text-cyan-100/90 uppercase tracking-wider">
                    {title}
                </h2>
                <ChevronRight className="w-4 h-4 text-cyan-500/60 opacity-0 group-hover/row:opacity-100 transition-opacity" />
            </div>
            <div className="relative group/slider">
                <button
                    onClick={() => scroll('left')}
                    className="absolute left-0 top-0 bottom-0 z-30 bg-gradient-to-r from-black/90 via-black/60 to-transparent w-12 md:w-16 flex items-center justify-center opacity-0 group-hover/slider:opacity-100 transition-opacity duration-300 hover:text-cyan-300"
                >
                    <ChevronLeft className="w-8 h-8 text-cyan-400 drop-shadow-[0_0_10px_rgba(6,182,212,0.8)]" />
                </button>

                <div
                    ref={rowRef}
                    className="flex gap-3 overflow-x-auto pb-6 pt-2 px-6 md:px-12 scrollbar-hide scroll-smooth snap-x relative z-20"
                    style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                >
                    {movies.map((movie) => (
                        <div key={movie.id} className="min-w-[140px] md:min-w-[180px] snap-start">
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
                    className="absolute right-0 top-0 bottom-0 z-30 bg-gradient-to-l from-black/90 via-black/60 to-transparent w-12 md:w-16 flex items-center justify-center opacity-0 group-hover/slider:opacity-100 transition-opacity duration-300 hover:text-cyan-300"
                >
                    <ChevronRight className="w-8 h-8 text-cyan-400 drop-shadow-[0_0_10px_rgba(6,182,212,0.8)]" />
                </button>
            </div>
        </div>
    );
}

export default function Home() {
    const [allMovies, setAllMovies] = useState<Movie[]>([]);
    const [groupedMovies, setGroupedMovies] = useState<{ [genre: string]: Movie[] }>({});
    const [featuredMovie, setFeaturedMovie] = useState<Movie | null>(null);

    const [query, setQuery] = useState("");
    const [results, setResults] = useState<Movie[]>([]);
    const [selectedMovies, setSelectedMovies] = useState<Movie[]>([]);
    const [mood, setMood] = useState("");
    const [recommendations, setRecommendations] = useState<{ ai_response: string, movies: Movie[] } | null>(null);

    const [loadingRecs, setLoadingRecs] = useState(false);
    const [searching, setSearching] = useState(false);
    const [loadingFeed, setLoadingFeed] = useState(true);

    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 50);
        };
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    useEffect(() => {
        async function fetchAll() {
            try {
                // Fetch 500 movies in parallel to populate the categories fully 
                // without hitting the backend's limit=100 constraint.
                const pages = [1, 2, 3, 4, 5];
                const responses = await Promise.all(pages.map(p => getMovies(p, 100)));
                const allFetched = responses.flatMap(res => res.data || []);
                
                setAllMovies(allFetched);
                processGenres(allFetched);
            } catch (e) {
                console.error("Failed to load DB", e);
            } finally {
                setLoadingFeed(false);
            }
        }
        fetchAll();
    }, []);

    const processGenres = (movies: Movie[]) => {
        const shuffledMovies = [...movies].sort(() => 0.5 - Math.random());
        const groups: { [key: string]: Movie[] } = {};

        const topRated = shuffledMovies.filter(m => (m.score || 0) >= 8.0).slice(0, 20);
        groups["Top Rated"] = topRated;

        if (topRated.length > 0) {
            const validFeatured = topRated.filter(m => m.poster_url && m.overview);
            if (validFeatured.length > 0) {
                setFeaturedMovie(validFeatured[Math.floor(Math.random() * Math.min(10, validFeatured.length))]);
            } else {
                setFeaturedMovie(topRated[0]);
            }
        }

        groups["Discover"] = shuffledMovies.slice(0, 20);

        shuffledMovies.forEach(movie => {
            if (movie.genres) {
                let genreList: string[] = [];
                if (typeof movie.genres === 'string') {
                    if (movie.genres.startsWith('[')) {
                        try {
                            const parsed = JSON.parse(movie.genres.replace(/'/g, '"'));
                            if (Array.isArray(parsed)) genreList = parsed;
                        } catch (e) {
                            genreList = movie.genres.replace(/[\[\]']/g, "").split(", ");
                        }
                    } else {
                        genreList = movie.genres.split(", ");
                    }
                }
                genreList.forEach(g => {
                    const genre = g.trim();
                    if (!groups[genre]) groups[genre] = [];
                    if (groups[genre].length < 20) {
                        groups[genre].push(movie);
                    }
                });
            }
        });

        setGroupedMovies(groups);
    };

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!query.trim()) return;
        setSearching(true);
        setRecommendations(null);
        const movies = await searchMovies(query);
        setResults(movies);
        setSearching(false);
    };

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

    const showRecommendations = !!recommendations;
    const showSearchResults = !showRecommendations && results.length > 0;
    const showFeed = !showRecommendations && !showSearchResults;
    const isMainFeedActive = !showRecommendations && !showSearchResults;

    const genreOrder = ["Top Rated", "Discover", "Action", "Science Fiction", "Adventure", "Crime", "Comedy", "Drama", "Thriller", "Horror", "Animation"];
    const isSelected = featuredMovie ? selectedMovies.some(m => m.id === featuredMovie.id) : false;

    return (
        <main className="min-h-screen bg-black text-white pb-20 overflow-x-hidden tron-grid-bg relative">
            
            {/* TRON Navigation Bar (Netflix Style) */}
            <nav className={`fixed top-0 left-0 right-0 z-50 px-6 md:px-12 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all duration-300 ${scrolled || !isMainFeedActive ? 'bg-black/95 border-b border-cyan-500/20 backdrop-blur-md shadow-[0_0_15px_rgba(6,182,212,0.15)]' : 'bg-gradient-to-b from-black/80 via-black/40 to-transparent'}`}>
                <div className="flex items-center gap-8">
                    <h1 className="text-xl md:text-2xl font-black uppercase tracking-[0.2em] font-mono cursor-pointer" onClick={() => { setResults([]); setRecommendations(null); setQuery(""); }}>
                        <span className="text-glow text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-cyan-300 to-cyan-400">SCREEN</span>
                        <span className="text-white/90 drop-shadow-[0_0_10px_rgba(255,255,255,0.4)]">SCOUT</span>
                    </h1>
                    <div className="hidden lg:flex items-center gap-6 text-xs font-mono text-cyan-100/70 uppercase tracking-widest">
                        <button className="hover:text-cyan-400 hover:text-glow transition-all" onClick={() => { setResults([]); setRecommendations(null); setQuery(""); }}>Home</button>
                        <button className="hover:text-cyan-400 hover:text-glow transition-all">Discover</button>
                    </div>
                </div>

                <div className="flex items-center gap-6 w-full md:w-auto">
                    <form onSubmit={handleSearch} className="flex relative w-full md:w-72 lg:w-96">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-cyan-500/50 w-4 h-4" />
                        <input
                            type="text"
                            placeholder="Search parameters..."
                            className="w-full bg-black/60 border border-cyan-500/30 py-2 pl-10 pr-12 text-sm font-mono focus:outline-none focus:border-cyan-400/80 focus:shadow-[0_0_10px_rgba(6,182,212,0.2)] transition-all placeholder:text-cyan-800/60 text-cyan-100"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                        />
                        <button
                            type="submit"
                            className="absolute right-0 top-0 bottom-0 px-3 bg-cyan-900/40 border-l border-cyan-500/30 text-cyan-400 hover:bg-cyan-400 hover:text-black transition-colors disabled:opacity-50"
                            disabled={searching}
                        >
                            {searching ? <Loader2 className="animate-spin w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                        </button>
                    </form>
                    <div className="hidden md:flex items-center justify-center w-8 h-8 rounded border border-cyan-500/30 bg-black text-cyan-400 font-mono text-xs shadow-[0_0_10px_rgba(6,182,212,0.2)] cursor-pointer hover:border-cyan-400/80 transition-colors">
                        U
                    </div>
                </div>
            </nav>

            {/* Netflix Style TRON Hero Section */}
            {featuredMovie && isMainFeedActive && (
                <div className="relative w-full h-[85vh] min-h-[600px] max-h-[900px] flex items-center md:items-end pb-24 md:pb-32 px-6 md:px-12 z-0 group overflow-hidden">
                    {/* Background Artwork */}
                    <div className="absolute inset-0 z-0 bg-black">
                        {/* We use the poster as the background, heavily blurred and dimmed */}
                        <img 
                            src={featuredMovie.poster_url || "https://placehold.co/1920x1080?text=No+Image"} 
                            alt={featuredMovie.title}
                            className="w-full h-full object-cover opacity-20 blur-xl scale-110" 
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-transparent"></div>
                        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/50 to-transparent"></div>
                        <div className="absolute inset-0 tron-grid-bg opacity-40 mix-blend-screen pointer-events-none"></div>
                    </div>

                    {/* Hero Content Grid */}
                    <div className="relative z-10 w-full max-w-[1600px] mx-auto flex flex-col md:flex-row items-center md:items-end justify-between gap-12 animate-in fade-in slide-in-from-bottom-8 duration-1000 mt-20 md:mt-0">
                        
                        {/* Left: Text Content */}
                        <div className="max-w-3xl space-y-6 w-full">
                            <div className="flex items-center gap-3">
                                <span className="text-cyan-400 text-[10px] font-mono font-bold tracking-[0.3em] uppercase border border-cyan-400/50 px-2 py-0.5 bg-cyan-950/50 shadow-[0_0_10px_rgba(6,182,212,0.3)]">
                                    Featured Input
                                </span>
                                {featuredMovie.score && (
                                    <span className="text-cyan-200/80 text-[10px] font-mono tracking-widest border border-cyan-500/20 px-2 py-0.5 bg-black/50">
                                        RATING: {featuredMovie.score.toFixed(1)}/10
                                    </span>
                                )}
                            </div>
                            <h2 className="text-5xl md:text-7xl lg:text-8xl font-black uppercase font-mono text-white text-glow leading-none drop-shadow-2xl tracking-tighter">
                                {featuredMovie.title}
                            </h2>
                            <p className="text-cyan-50/80 text-sm md:text-base font-mono max-w-2xl line-clamp-3 md:line-clamp-4 leading-relaxed drop-shadow-md border-l-2 border-cyan-500/30 pl-4">
                                {featuredMovie.overview}
                            </p>
                            
                            <div className="flex flex-wrap items-center gap-4 pt-4">
                                <button 
                                    onClick={() => toggleSelection(featuredMovie)} 
                                    className={`flex items-center gap-2 font-mono font-bold py-3 px-8 uppercase tracking-widest transition-all ${
                                        isSelected 
                                        ? 'bg-red-500/20 text-red-400 border border-red-500/50 hover:bg-red-500/30 shadow-[0_0_15px_rgba(239,68,68,0.3)]' 
                                        : 'btn-suggest border border-cyan-400/60 text-cyan-400 hover:text-black shadow-[0_0_15px_rgba(6,182,212,0.3)] bg-black/40 backdrop-blur-sm hover:bg-cyan-400'
                                    }`}
                                >
                                    {isSelected ? <Check className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                                    {isSelected ? 'Input Logged' : 'Log Input'}
                                </button>
                                
                                <a 
                                    href={`https://www.imdb.com/title/${featuredMovie.id}/`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 bg-black/60 border border-cyan-500/30 text-cyan-100 hover:text-cyan-400 font-mono font-bold py-3 px-8 uppercase tracking-widest transition-colors hover:border-cyan-400 hover:bg-black/80 backdrop-blur-sm shadow-[0_0_10px_rgba(0,0,0,0.5)]"
                                >
                                    <Info className="w-5 h-5" />
                                    Database Info
                                </a>
                            </div>
                        </div>

                        {/* Right: Sharp Poster Image (Desktop only) */}
                        <div className="hidden md:block shrink-0 relative mr-4 lg:mr-12 xl:mr-24 perspective-1000">
                            <div 
                                className="w-[240px] lg:w-[320px] xl:w-[360px] aspect-[2/3] relative transform group-hover:scale-[1.02] transition-all duration-700 shadow-[0_0_50px_rgba(6,182,212,0.25)] border border-cyan-500/40 bg-black"
                                style={{ transform: 'perspective(1000px) rotateY(-12deg)' }}
                            >
                                <img 
                                    src={featuredMovie.poster_url || "https://placehold.co/600x900?text=No+Image"} 
                                    alt={featuredMovie.title}
                                    className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity"
                                />
                                <CornerPolygons />
                                <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500/20 to-transparent pointer-events-none mix-blend-screen opacity-50"></div>
                            </div>
                        </div>

                    </div>
                </div>
            )}

            {/* Main Content Area */}
            <div className={`w-full space-y-10 relative z-20 ${isMainFeedActive ? '-mt-24 md:-mt-32' : 'pt-32 px-6 md:px-12 max-w-[1600px] mx-auto'}`}>

                {/* Selected Movies Dock (Visible only if items selected) */}
                {selectedMovies.length > 0 && (
                    <section className={`bg-black/95 p-6 border border-cyan-500/40 shadow-[0_0_30px_rgba(6,182,212,0.2)] relative overflow-hidden animate-in fade-in slide-in-from-bottom-8 ${isMainFeedActive ? 'mx-6 md:mx-12 mb-12' : 'mx-0 mb-12'}`}>
                        <CornerPolygons />
                        <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-cyan-500/10 via-cyan-400/80 to-cyan-500/10"></div>

                        <div className="flex items-center justify-between mb-5 relative z-10">
                            <div className="flex items-center gap-3">
                                <HexagonIcon className="w-5 h-5 text-cyan-400" />
                                <h2 className="text-base md:text-lg font-mono text-cyan-400 font-bold uppercase tracking-[0.2em] text-glow">
                                    Neural Link Sequence
                                </h2>
                                <span className="text-xs font-mono text-cyan-200 border border-cyan-400/40 px-2 py-0.5 bg-cyan-900/20">
                                    {selectedMovies.length} / 5
                                </span>
                            </div>
                            <button 
                                onClick={() => setSelectedMovies([])} 
                                className="text-xs font-mono text-red-500/80 hover:text-red-400 transition-colors uppercase tracking-widest border border-red-500/20 px-4 py-1.5 hover:border-red-400/50 bg-red-950/20 hover:bg-red-900/30"
                            >
                                Terminate
                            </button>
                        </div>
                        
                        <div className="flex gap-4 overflow-x-auto pb-4" style={{ scrollbarWidth: 'none' }}>
                            {selectedMovies.map(movie => (
                                <div key={movie.id} className="min-w-[100px] w-[100px] relative group">
                                    <div className="border border-cyan-500/30 overflow-hidden relative hover:border-cyan-400 transition-colors shadow-lg">
                                        <img
                                            src={movie.poster_url || "https://placehold.co/100x150?text=No+Image"}
                                            alt={movie.title}
                                            className="w-full h-auto aspect-[2/3] object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                                        />
                                    </div>
                                    <button
                                        onClick={() => toggleSelection(movie)}
                                        className="absolute -top-2 -right-2 bg-black border border-cyan-500 text-cyan-400 w-6 h-6 flex items-center justify-center text-xs font-mono hover:bg-red-500 hover:border-red-500 hover:text-white transition-colors z-20 shadow-md"
                                    >✕</button>
                                </div>
                            ))}
                        </div>

                        <DiamondDivider />

                        <div className="flex flex-col md:flex-row gap-4 items-end relative z-10 mt-4">
                            <div className="flex-1 w-full space-y-2">
                                <label className="text-[10px] md:text-xs font-mono text-cyan-400/70 uppercase tracking-[0.2em] ml-1 flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 bg-cyan-500 inline-block animate-pulse"></span>
                                    Modify Parameter Vector (Optional)
                                </label>
                                <input
                                    placeholder="e.g. 'More action, less dialogue'"
                                    className="w-full bg-black/80 border border-cyan-500/20 px-4 py-3 focus:outline-none focus:border-cyan-400 focus:shadow-[0_0_15px_rgba(6,182,212,0.2)] transition-all text-cyan-50 font-mono text-sm placeholder:text-cyan-800/40"
                                    value={mood}
                                    onChange={(e) => setMood(e.target.value)}
                                />
                            </div>
                            <button
                                onClick={handleRecommend}
                                disabled={loadingRecs}
                                className="btn-suggest w-full md:w-auto border border-cyan-400/80 text-cyan-300 font-mono font-bold py-3 px-12 transition-all disabled:opacity-50 flex items-center justify-center gap-3 uppercase tracking-[0.2em] text-sm hover:bg-cyan-400 hover:text-black shadow-[0_0_15px_rgba(6,182,212,0.2)]"
                            >
                                {loadingRecs ? <Loader2 className="animate-spin w-5 h-5" /> : (
                                    <span className="flex items-center gap-2">
                                        <svg viewBox="0 0 16 16" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.5">
                                            <polygon points="8,1 15,5.5 15,10.5 8,15 1,10.5 1,5.5" />
                                        </svg>
                                        Execute Sequence
                                    </span>
                                )}
                            </button>
                        </div>
                    </section>
                )}

                {/* 1. Recommendations Mode */}
                {showRecommendations && recommendations && (
                    <section className="space-y-10 animate-in fade-in pt-8">
                        <div className="bg-black/90 border border-cyan-500/30 shadow-[0_0_20px_rgba(6,182,212,0.15)] p-8 relative overflow-hidden">
                            <CornerPolygons />
                            <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-cyan-400 via-cyan-400/50 to-transparent shadow-[0_0_15px_rgba(6,182,212,1)]"></div>
                            
                            <div className="flex items-center gap-3 mb-4">
                                <HexagonIcon className="w-5 h-5 text-cyan-400" />
                                <h3 className="text-cyan-400 font-mono font-bold text-sm uppercase tracking-[0.3em] text-glow">
                                    System Output Analysis
                                </h3>
                            </div>
                            <p className="text-base md:text-lg leading-relaxed text-cyan-50/90 font-mono pl-8 border-l border-cyan-500/20">
                                {recommendations.ai_response}
                            </p>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6 px-6 md:px-12">
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
                    <section className="pt-8 px-6 md:px-12">
                        <div className="flex items-center gap-3 mb-8">
                            <Search className="w-6 h-6 text-cyan-400" />
                            <h2 className="text-2xl font-mono font-bold text-cyan-100 uppercase tracking-widest text-glow">
                                Search Parameters: <span className="text-cyan-400">"{query}"</span>
                            </h2>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
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
                    <section className="space-y-12 pb-20 pt-4">
                        {loadingFeed ? (
                            <div className="flex flex-col items-center justify-center py-32 gap-6">
                                <Loader2 className="animate-spin w-12 h-12 text-cyan-400" />
                                <p className="text-sm font-mono text-cyan-500/60 uppercase tracking-[0.3em] text-glow">Establishing Link</p>
                            </div>
                        ) : (
                            <>
                                {genreOrder.map(genre => groupedMovies[genre] && (
                                    <MovieRow
                                        key={genre}
                                        title={genre}
                                        movies={groupedMovies[genre]}
                                        selectedIds={selectedMovies.map(m => m.id)}
                                        onSelect={toggleSelection}
                                    />
                                ))}

                                {Object.keys(groupedMovies)
                                    .filter(g => !genreOrder.includes(g) && groupedMovies[g].length > 4)
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
