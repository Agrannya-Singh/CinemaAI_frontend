'use server';

/**
 * @fileOverview Personalizes movie recommendations based on user's initial selections.
 *
 * - personalizeRecommendations - A function that personalizes movie recommendations.
 * - PersonalizeRecommendationsInput - The input type for the personalizeRecommendations function.
 * - PersonalizeRecommendationsOutput - The return type for the personalizeRecommendations function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const PersonalizeRecommendationsInputSchema = z.object({
  movieIds: z.array(z.string()).describe('An array of movie IDs selected by the user.'),
  genrePreferences: z.string().describe('The preferred genres of the user, as a comma separated string.'),
});
export type PersonalizeRecommendationsInput = z.infer<
  typeof PersonalizeRecommendationsInputSchema
>;

const PersonalizeRecommendationsOutputSchema = z.object({
  personalizedRecommendations: z
    .array(z.string())
    .describe('An array of personalized movie recommendations (movie IDs).'),
});
export type PersonalizeRecommendationsOutput = z.infer<
  typeof PersonalizeRecommendationsOutputSchema
>;

export async function personalizeRecommendations(
  input: PersonalizeRecommendationsInput
): Promise<PersonalizeRecommendationsOutput> {
  return personalizeRecommendationsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'personalizeRecommendationsPrompt',
  input: {
    schema: PersonalizeRecommendationsInputSchema,
  },
  output: {
    schema: PersonalizeRecommendationsOutputSchema,
  },
  prompt: `You are a movie expert. Given a list of movie IDs that the user has selected and their genre preferences, you will return a list of personalized movie recommendations (movie IDs).

  User's selected movie IDs: {{{movieIds}}}
  User's preferred genres: {{{genrePreferences}}}

  Return only movie IDs in the personalizedRecommendations array. Do not provide any explanation.
  `,
});

const personalizeRecommendationsFlow = ai.defineFlow(
  {
    name: 'personalizeRecommendationsFlow',
    inputSchema: PersonalizeRecommendationsInputSchema,
    outputSchema: PersonalizeRecommendationsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
