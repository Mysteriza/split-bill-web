"use server";

import { suggestRupiahRounding } from "@/ai/flows/suggest-rupiah-rounding";

export async function getRoundingSuggestion(amount: number) {
  try {
    const result = await suggestRupiahRounding({ amount });
    return result.suggestion;
  } catch (error) {
    console.error("Error getting rounding suggestion:", error);
    return "Maaf, terjadi kesalahan saat mengambil saran.";
  }
}
