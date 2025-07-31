'use server';
/**
 * @fileOverview Provides functionality to suggest the best way to round Rupiah amounts for simplified transactions.
 *
 * - suggestRupiahRounding - A function that suggests the best way to round a given Rupiah amount.
 * - SuggestRupiahRoundingInput - The input type for the suggestRupiahRounding function.
 * - SuggestRupiahRoundingOutput - The return type for the suggestRupiahRounding function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestRupiahRoundingInputSchema = z.object({
  amount: z.number().describe('The amount in Rupiah to be rounded.'),
});
export type SuggestRupiahRoundingInput = z.infer<typeof SuggestRupiahRoundingInputSchema>;

const SuggestRupiahRoundingOutputSchema = z.object({
  suggestion: z.string().describe('The suggested rounded amount and reasoning.'),
});
export type SuggestRupiahRoundingOutput = z.infer<typeof SuggestRupiahRoundingOutputSchema>;

export async function suggestRupiahRounding(input: SuggestRupiahRoundingInput): Promise<SuggestRupiahRoundingOutput> {
  return suggestRupiahRoundingFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestRupiahRoundingPrompt',
  input: {schema: SuggestRupiahRoundingInputSchema},
  output: {schema: SuggestRupiahRoundingOutputSchema},
  prompt: `Anda adalah asisten keuangan yang membantu pengguna membulatkan jumlah Rupiah untuk transaksi yang lebih sederhana.

  Berikan saran pembulatan terbaik untuk jumlah berikut, beserta alasannya. Jumlah: Rp {{amount}}`,
});

const suggestRupiahRoundingFlow = ai.defineFlow(
  {
    name: 'suggestRupiahRoundingFlow',
    inputSchema: SuggestRupiahRoundingInputSchema,
    outputSchema: SuggestRupiahRoundingOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
