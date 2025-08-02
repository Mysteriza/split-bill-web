// A person participating in the current bill-splitting session
export interface SessionParticipant {
  id: string;
  name: string;
}

// Discount details, can be used for items or globally
export interface DiscountDetails {
  type: 'percentage' | 'amount';
  value: number;
}

// An item from the receipt
export interface BillItem {
  amount: number;
  id: string;
  description: string;
  quantity: number;
  price: number; // Price per single quantity
  discount: DiscountDetails;
  sharedBy: string[]; // Array of SessionParticipant IDs
}

// Service Tax details
export interface ServiceTaxDetails {
  type: 'amount' | 'percentage';
  value: number;
}

// A single transaction for debt simplification
export interface Transaction {
  from: string; // Participant name
  to: string;   // Payer name
  amount: number;
}

// The final calculated summary
export interface Summary {
  discount(discount: any): unknown;
  totalBill: number; // Precise total before rounding
  grandTotal: number; // Total after rounding
  roundingDifference: number; // The tip or deficit from rounding
  totalItemExpenses: number; // Total after item discounts
  ppnAmount: number;
  serviceTaxAmount: number;
  deliveryFee: number;
  totalDiscount: number; // Sum of all item and global discounts
  participants: Array<{
    ppnPercentageShare: any;
    serviceTaxPercentageShare: number;
    discountShare(discountShare: any): unknown;
    id: string;
    name: string;
    subtotal: number; // Subtotal after item discounts
    // Detailed cost shares
    ppnShare: number;
    serviceTaxShare: number;
    deliveryFeeShare: number;
    globalDiscountShare: number;
    finalShare: number; // Subtotal + all shares before rounding
    totalToPay: number; // Final amount after rounding
  }>;
  transactions: Transaction[];
}