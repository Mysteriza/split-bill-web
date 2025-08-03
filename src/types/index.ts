// src/types/index.ts

import { z } from 'zod';

// Base Types (No changes)
export type DiscountDetails = {
  type: 'percentage' | 'amount';
  value: number;
};

export type ServiceTaxDetails = {
  type: 'percentage' | 'amount';
  value: number;
};

export interface SessionParticipant {
  id: string;
  name: string;
}

export interface BillItem {
  id: string;
  description: string;
  price: number;
  quantity: number;
  discount: DiscountDetails;
  sharedBy: string[];
}

export interface SummaryParticipant extends SessionParticipant {
  subtotal: number;
  ppnShare: number;
  serviceTaxShare: number;
  deliveryFeeShare: number;
  globalDiscountShare: number;
  totalToPay: number;
}

export interface Summary {
  participants: SummaryParticipant[];
  transactions: { from: string; to: string; amount: number }[];
  totalItemExpenses: number;
  ppnAmount: number;
  serviceTaxAmount: number;
  deliveryFee: number;
  totalDiscount: number;
  grandTotal: number;
  totalBill: number;
  roundingDifference: number;
}

// --- START: Zod Schema and SessionState Type ---

// Zod schema defines the validation rules for the imported JSON file.
const participantSchema = z.object({
  id: z.string(),
  name: z.string(),
});

const billItemSchema = z.object({
  id: z.string(),
  description: z.string(),
  price: z.number(),
  quantity: z.number().int(),
  discount: z.object({
    type: z.enum(['percentage', 'amount']),
    value: z.number(),
  }),
  sharedBy: z.array(z.string()),
});

export const sessionStateSchema = z.object({
  sessionParticipants: z.array(participantSchema),
  items: z.array(billItemSchema),
  ppn: z.string(),
  serviceTaxType: z.enum(['amount', 'percentage']),
  serviceTaxValue: z.string(),
  deliveryFee: z.string(),
  globalDiscountType: z.enum(['amount', 'percentage']),
  globalDiscountValue: z.string(),
  rounding: z.number(),
  payerId: z.string().optional().nullable(),
});

// This is the TypeScript type derived from the Zod schema.
export type SessionState = z.infer<typeof sessionStateSchema>;
// --- END: Zod Schema and SessionState Type ---