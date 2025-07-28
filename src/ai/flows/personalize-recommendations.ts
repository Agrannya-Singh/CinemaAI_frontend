'use server';

/**
 * @fileOverview Personalizes movie recommendations based on user's initial selections
 * by calling an external API.
 *
 * - personalizeRecommendations - A function that personalizes movie recommendations.
 */

import type { ApiMovie } from '@/lib/movies';
import type { PersonalizeRecommendationsInput, PersonalizeRecommendationsOutput } from '@/lib/types';

const API_BASE_URL = 'https://cinemaai-backend.onrender.com';

/**
 * Fetches movie recommendations from the external FastAPI backend.
 * @param input The user's selected movies and genre preferences.
 * @returns A list of recommended movie IDs.
 */
export async function personalizeRecommendations(
  input: PersonalizeRecommendationsInput
): Promise<PersonalizeRecommendationsOutput> {
  // The backend API for recommendations doesn't use genre preferences,
  // but we keep it in the function signature for potential future use.
  
  try {
    const response = await fetch(`${API_BASE_URL}/recommend`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        movie_ids: input.movieIds,
        num_recommendations: 10, // Fetch 10 recommendations
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error('Failed to fetch recommendations:', response.status, errorBody);
      throw new Error(`Failed to fetch recommendations. Status: ${response.status}`);
    }

    const recommendedApiMovies: ApiMovie[] = await response.json();
    const recommendedMovieIds = recommendedApiMovies.map((movie) => movie.id);

    return {
      personalizedRecommendations: recommendedMovieIds,
    };
  } catch (error) {
    console.error('Error in personalizeRecommendations:', error);
    // Return an empty array in case of an error to prevent crashing the client.
    return { personalizedRecommendations: [] };
  }
}
