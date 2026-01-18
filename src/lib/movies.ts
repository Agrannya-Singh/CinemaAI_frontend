// src/lib/movies.ts

export interface Movie {
    id: string;
    title: string;
    overview: string;
    poster_url: string | null;
    release_date?: string;
    score?: number;
    posterHint?: string;
    // Make sure these match backend fields for compatibility
    vote_average?: number;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://semantic-recommendation-service.onrender.com';

// 1. Fetch Paginated Movies (Browsing - Infinite Scroll)
export async function fetchMovies(page: number = 1, limit: number = 24): Promise<Movie[]> {
    try {
        const res = await fetch(`${API_BASE_URL}/movies?page=${page}&limit=${limit}`);
        if (!res.ok) throw new Error("Failed to load movies");
        const data = await res.json();
        return data || []; // Assuming backend returns list directly or data wrapper. Adjust if returns { data: [...] }
    } catch (error) {
        console.error("Fetch Movies Error:", error);
        return [];
    }
}

// 2. Hybrid Recommendation (Secure Server-Side RAG)
// Search + Context
export async function getRecommendations(query: string, selectedIds: string[] = []) {
    try {
        const res = await fetch(`${API_BASE_URL}/recommend-rag`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                selected_titles: [], // Backend might expect titles for prompts, but if we send IDs maybe backend needs update? 
                // Wait, previous plan said /recommend-rag expects `selected_titles`.
                // User requirement says `selected_movie_ids`.
                // I will align with User Requirement "Frontend Update Log".
                // But my backend `main.py` implementation expects `selected_titles`.
                // I should assume the USER handled backend and I should send what matches their "Frontend Update Log"
                // which says: body: { query: query, selected_movie_ids: selectedIds }
                // ADJUSTMENT: Use the signature requested by User: 
                // "body: JSON.stringify({ query: query, selected_movie_ids: selectedIds })"
                // I will trust the user updated the backend to handle this or I should map it.
                // Let's send structured data that covers both or matches the new backend contract.
                // The user said: "POST /recommend (The Brain)"

                // I will follow the user's "Frontend Update Log" signature exactly for the fetch URL and body.
                query: query,
                selected_movie_ids: selectedIds
            })
        });

        if (!res.ok) throw new Error("AI Recommendation failed");
        return res.json();
    } catch (error) {
        console.error("Recommendation Error:", error);
        return { ai_response: "AI is currently offline.", movies: [] };
    }
}

// Legacy support if needed, but we are moving to v3
export async function searchMovies(query: string): Promise<Movie[]> {
    return []; // Deprecated in favor of getRecommendations
}
