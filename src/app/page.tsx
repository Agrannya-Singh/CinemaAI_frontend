"use client";

import { useState, useEffect, useRef } from "react";
import { Movie, fetchMovies, getRecommendations } from "@/lib/movies";
import { MovieCard } from "@/components/movie-card";
import { Loader2, Sparkles, Search } from "lucide-react";
import { useInView } from "react-intersection-observer"; // We need to install this or implement manual observer

// Since I cannot install new packages without permission and 'react-intersection-observer' might not be there,
// I will implement a manual IntersectionObserver hook or simple verify if the package exists.
// The user prompt mentioned "Use an Intersection Observer", it didn't strictly say "use react-intersection-observer package".
// I'll use standard Web API IntersectionObserver to be safe and dependency-free.

export default function Home() {
    const [movies, setMovies] = useState<Movie[]>([]);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [page, setPage] = useState(1);
    const [isSearching, setIsSearching] = useState(false);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [aiReasoning, setAiReasoning] = useState("");

    // Ref for infinite scroll
    const loaderRef = useRef<HTMLDivElement>(null);

    // 1. Initial Load & Infinite Scroll
    useEffect(() => {
        // Determine if we should load more
        // Only load if NOT searching and NOT loading
        if (!isSearching && !loading) {
            loadMoreMovies();
        }
    }, []); // Initial load

    const loadMoreMovies = async () => {
        if (loading) return;
        setLoading(true);
        try {
            const newMovies = await fetchMovies(page);
            if (newMovies.length > 0) {
                setMovies(prev => [...prev, ...newMovies]);
                setPage(prev => prev + 1);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    // Intersection Observer for Infinite Scroll
    useEffect(() => {
        const observer = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting && !isSearching && !loading) {
                loadMoreMovies();
            }
        }, { threshold: 1.0 });

        if (loaderRef.current) {
            observer.observe(loaderRef.current);
        }

        return () => observer.disconnect();
    }, [page, isSearching, loading]);


    // 3. Toggle Selection
    const toggleSelection = (movie: Movie) => {
        setSelectedIds(prev =>
            prev.includes(movie.id)
                ? prev.filter(id => id !== movie.id)
                : [...prev, movie.id]
        );
    };

    // Search / Hybrid Recommendation
    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!searchQuery.trim() && selectedIds.length === 0) return;

        setIsSearching(true);
        setLoading(true);
        // Reset movies to show results only? Or append? usually replace for search results.
        setMovies([]);

        try {
            const result = await getRecommendations(searchQuery, selectedIds);
            setAiReasoning(result.ai_response || result.ai_reasoning);
            setMovies(result.movies || []);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const clearSearch = () => {
        setIsSearching(false);
        setSearchQuery("");
        setAiReasoning("");
        setMovies([]);
        setPage(1);
        loadMoreMovies(); // Reload feed
    };

    return (
        <main className="min-h-screen bg-black text-white p-8 pb-20">
            <div className="max-w-7xl mx-auto space-y-8">

                {/* Header & Sticky Search */}
                <header className="sticky top-0 z-50 bg-black/80 backdrop-blur-md py-4 space-y-4 border-b border-gray-800">
                    <div className="flex items-center justify-between">
                        <h1 className="text-3xl font-extrabold tracking-tighter" onClick={clearSearch} role="button">
                            Screen<span className="bg-gradient-brand">Scout</span>
                        </h1>

                        {/* Context Badge */}
                        <div className="flex items-center gap-4">
                            {selectedIds.length > 0 && (
                                <div className="bg-green-900/50 text-green-400 px-3 py-1 rounded-full text-xs font-bold border border-green-700 animate-in fade-in">
                                    {selectedIds.length} Context Selected
                                </div>
                            )}
                        </div>
                    </div>

                    <form onSubmit={handleSearch} className="relative max-w-2xl mx-auto">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder={selectedIds.length > 0 ? "Find something like these, but..." : "Describe your perfect movie..."}
                            className="w-full bg-gray-900 border border-gray-700 rounded-full py-3 pl-12 pr-12 text-white focus:ring-2 focus:ring-purple-600 focus:outline-none transition-all placeholder:text-gray-500"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        <button
                            type="submit"
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-gradient-brand rounded-full text-white hover:opacity-90 transition-opacity disabled:opacity-50"
                            disabled={loading}
                        >
                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                        </button>
                    </form>
                </header>

                {/* AI Reasoning (Only in Search Mode) */}
                {isSearching && aiReasoning && (
                    <section className="bg-gray-900/80 border border-purple-500/30 p-6 rounded-2xl animate-in slide-in-from-top-4">
                        <h3 className="text-purple-400 font-bold mb-2 text-sm uppercase tracking-wider flex items-center gap-2">
                            <Sparkles className="w-4 h-4" /> ScreenScout AI
                        </h3>
                        <p className="text-lg leading-relaxed text-gray-200">
                            {aiReasoning}
                        </p>
                        <button onClick={clearSearch} className="mt-4 text-xs text-gray-500 hover:text-white underline">
                            Back to Feed
                        </button>
                    </section>
                )}

                {/* Movie Grid */}
                <section className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
                    {movies.map((movie, idx) => (
                        <MovieCard
                            key={`${movie.id}-${idx}`} // Use index fallback if IDs duplicate in infinite scroll
                            movie={movie}
                            isSelected={selectedIds.includes(movie.id)}
                            onSelect={toggleSelection}
                        />
                    ))}
                </section>

                {/* Infinite Scroll Loader */}
                {!isSearching && (
                    <div ref={loaderRef} className="py-10 flex justify-center w-full">
                        {loading && <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />}
                    </div>
                )}
            </div>
        </main>
    );
}
