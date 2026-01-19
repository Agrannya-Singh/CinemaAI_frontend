// src/lib/movies.ts

export interface Movie {
    id: string;
    title: string;
    overview: string;
    poster_url: string | null;
    score?: number;
}

export interface PaginationMeta {
    current_page: number;
    limit: number;
    total_items: number;
    total_pages: number;
}

export interface PaginatedMovies {
    data: Movie[];
    meta: PaginationMeta;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://semantic-recommendation-service.onrender.com';

// 1. Get All Movies (Paginated)
export async function getMovies(page: number = 1, limit: number = 24): Promise<PaginatedMovies> {
    try {
        const res = await fetch(`${API_BASE_URL}/movies?page=${page}&limit=${limit}`);
        if (!res.ok) throw new Error("Failed to fetch movies");
        return await res.json();
    } catch (error) {
        console.error("Fetch Movies Error:", error);
        return {
            data: [],
            meta: { current_page: 1, limit: 24, total_items: 0, total_pages: 0 }
        };
    }
}

// 2. Semantic Search (Uses /recommend endpoint as search engine)
export async function searchMovies(query: string): Promise<Movie[]> {
    if (!query) return [];
    try {
        const res = await fetch(`${API_BASE_URL}/recommend`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query, selected_movie_ids: [] }),
        });
        const data = await res.json();
        return data.movies || [];
    } catch (error) {
        console.error("Search Error:", error);
        return [];
    }
}

// 3. RAG Recommendation (Curate Button)
export async function getRecommendations(selectedMovies: Movie[], mood: string) {
    const selected_movie_ids = selectedMovies.map(m => m.id);
    // If mood is present, it becomes the query, otherwise we might just ask for similar movies
    // The backend expects a 'query' field. 
    const query = mood || "Recommend movies based on my selection.";

    try {
        const res = await fetch(`${API_BASE_URL}/recommend`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query, selected_movie_ids }),
        });

        const data = await res.json();
        return {
            ai_response: data.ai_reasoning || "Here are your recommendations.",
            movies: data.movies || []
        };
    } catch (error) {
        console.error("Recommendation Error:", error);
        return { ai_response: "AI is offline.", movies: [] };
    }
}
