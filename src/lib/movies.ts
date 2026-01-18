// src/lib/movies.ts

export interface Movie {
    id: string;
    title: string;
    overview: string;
    poster_url: string | null; // Changed from 'poster' to match backend
    release_date?: string;     // New field
    score?: number;            // New field (Match confidence)
    posterHint?: string;       // Optional legacy support
}

const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://semantic-recommendation-service.onrender.com';

// 1. Semantic Search (Used for the Search Bar)
export async function searchMovies(query: string): Promise<Movie[]> {
    if (!query) return [];
    try {
        const res = await fetch(`${API_BASE_URL}/search`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query }),
        });
        const data = await res.json();
        return data.results || [];
    } catch (error) {
        console.error("Search Error:", error);
        return [];
    }
}

// 2. RAG Recommendation (Secure Server-Side)
export async function getRecommendations(selectedMovies: Movie[], mood: string) {
    try {
        const res = await fetch(`${API_BASE_URL}/recommend-rag`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                selected_titles: selectedMovies.map(m => m.title),
                mood: mood
            }),
        });

        if (!res.ok) throw new Error("Backend RAG Error");

        const data = await res.json();

        // Backend returns structured data. 'data.results' are the movies.
        return {
            ai_response: data.ai_agent_response || "Here are some picks for you!",
            movies: data.results || []
        };
    } catch (error) {
        console.error("Recommendation Error:", error);
        return { ai_response: "AI is currently offline or unconfigured.", movies: [] };
    }
}
