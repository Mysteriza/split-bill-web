// src/types/index.ts

// Keep your existing types like SessionParticipant, BillItem, etc.

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
  totalBill: number;
  grandTotal: number;
  roundingDifference: number;
}

// --- START: ADD THIS NEW TYPE ---
// This defines the structure for the JSON export/import feature.
export interface SessionState {
  sessionParticipants: SessionParticipant[];
  items: BillItem[];
  ppn: string;
  serviceTaxType: 'amount' | 'percentage';
  serviceTaxValue: string;
  deliveryFee: string;
  globalDiscountType: 'amount' | 'percentage';
  globalDiscountValue: string;
  rounding: number;
  payerId: string | undefined;
}
// --- END: ADD THIS NEW TYPE ---