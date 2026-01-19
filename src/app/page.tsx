"use client";

import { useState, useEffect } from "react";
import { Movie, searchMovies, getRecommendations, getMovies } from "@/lib/movies";
import { MovieCard } from "@/components/movie-card";
import { Loader2, Sparkles, Search, TrendingUp } from "lucide-react";

export default function Home() {
    // State
    const [query, setQuery] = useState("");
    const [movies, setMovies] = useState<Movie[]>([]); // Initial Feed
    const [results, setResults] = useState<Movie[]>([]); // Search Results
    const [selectedMovies, setSelectedMovies] = useState<Movie[]>([]);
    const [mood, setMood] = useState("");
    const [recommendations, setRecommendations] = useState<{ ai_response: string, movies: Movie[] } | null>(null);

    // Loading States
    const [loadingRecs, setLoadingRecs] = useState(false);
    const [searching, setSearching] = useState(false);
    const [loadingFeed, setLoadingFeed] = useState(true);

    // Initial Load (Trending Movies)
    useEffect(() => {
        async function fetchInitialMovies() {
            try {
                const data = await getMovies(1, 24);
                setMovies(data.data);
            } catch (e) {
                console.error("Failed to load feed", e);
            } finally {
                setLoadingFeed(false);
            }
        }
        fetchInitialMovies();
    }, []);

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
        setResults([]); // Clear search results to focus on recs
        // If mood is empty, we pass it as is.
        const data = await getRecommendations(selectedMovies, mood);
        setRecommendations(data);
        setLoadingRecs(false);
    };

    // Determine what to show
    const showRecommendations = !!recommendations;
    const showSearchResults = !showRecommendations && results.length > 0;
    const showFeed = !showRecommendations && !showSearchResults;

    return (
        <main className="min-h-screen bg-black text-white p-8 pb-20">
            <div className="max-w-6xl mx-auto space-y-12">

                {/* Header */}
                <header className="text-center space-y-4 pt-10">
                    <h1 className="text-5xl font-extrabold tracking-tighter">
                        Screen<span className="bg-gradient-brand">Scout</span>
                    </h1>
                    <p className="text-xl text-gray-400">
                        Tell us what you like. We'll find what you love.
                    </p>
                </header>

                {/* Search Section */}
                <section className="max-w-2xl mx-auto">
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
                    <section className="bg-gray-900/50 p-6 rounded-2xl border border-gray-800 animate-in fade-in slide-in-from-bottom-4">
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
                    <section className="space-y-8 animate-in fade-in">
                        <div className="bg-gray-900/80 border border-purple-500/30 p-6 rounded-2xl">
                            <h3 className="text-purple-400 font-bold mb-2 text-sm uppercase tracking-wider">ScreenScout AI</h3>
                            <p className="text-lg leading-relaxed text-gray-200">
                                {recommendations.ai_response}
                            </p>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
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
                    <section>
                        <h2 className="text-2xl font-bold mb-6 text-gray-400">Search Results</h2>
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
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

                {/* 3. Trending Feed Mode (Default) */}
                {showFeed && (
                    <section>
                        <h2 className="text-2xl font-bold mb-6 text-gray-400 flex items-center gap-2">
                            <TrendingUp className="text-purple-500" /> Trending & Top Rated
                        </h2>
                        {loadingFeed ? (
                            <div className="flex justify-center py-20">
                                <Loader2 className="animate-spin w-10 h-10 text-purple-600" />
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
                                {movies.map(movie => (
                                    <MovieCard
                                        key={movie.id}
                                        movie={movie}
                                        isSelected={selectedMovies.some(m => m.id === movie.id)}
                                        onSelect={toggleSelection}
                                    />
                                ))}
                            </div>
                        )}
                    </section>
                )}

            </div>
        </main>
    );
}
