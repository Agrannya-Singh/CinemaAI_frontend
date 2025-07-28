import { z } from 'zod';

// Define Zod schemas for input and output for personalizeRecommendations flow.
export const PersonalizeRecommendationsInputSchema = z.object({
  movieIds: z.array(z.string()).describe('An array of movie IMDb IDs selected by the user.'),
  genrePreferences: z.string().describe('The preferred genres of the user, as a comma separated string.'),
});
export type PersonalizeRecommendationsInput = z.infer<typeof PersonalizeRecommendationsInputSchema>;

export const PersonalizeRecommendationsOutputSchema = z.object({
  personalizedRecommendations: z
    .array(z.string())
    .describe('An array of personalized movie recommendations (movie IDs).'),
});
export type PersonalizeRecommendationsOutput = z.infer<typeof PersonalizeRecommendationsOutputSchema>;
