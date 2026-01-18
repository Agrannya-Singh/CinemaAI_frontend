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

// 2. RAG Recommendation (Used for the "Curate" Button)
// Note: Prompt assumes getRecommendations(selectedMovies: Movie[], mood: string)
export async function getRecommendations(selectedMovies: Movie[], mood: string) {
    // Prompt Engineering on the Client
    const titles = selectedMovies.map(m => m.title).join(", ");
    const prompt = `I liked ${titles}. ${mood ? `I want something ${mood}.` : ''} Recommend a similar movie.`;

    try {
        const res = await fetch(`${API_BASE_URL}/search`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query: prompt }),
        });

        const data = await res.json();
        return {
            ai_response: data.ai_agent_response, // The "Witty Explanation"
            movies: data.results
        };
    } catch (error) {
        console.error("Recommendation Error:", error);
        return { ai_response: "AI is offline.", movies: [] };
    }
}
