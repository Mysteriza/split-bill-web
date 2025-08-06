import { z } from 'zod';

// Base Types
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

// --- START: Added isPaid property ---
export interface Transaction {
  from: string;
  to: string;
  amount: number;
  isPaid?: boolean; // Optional property to track payment status
}
// --- END: Added isPaid property ---

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
  transactions: Transaction[]; // Now uses the updated Transaction interface
  totalItemExpenses: number;
  ppnAmount: number;
  serviceTaxAmount: number;
  deliveryFee: number;
  totalDiscount: number;
  grandTotal: number;
  totalBill: number;
  roundingDifference: number;
}

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

export type SessionState = z.infer<typeof sessionStateSchema>;