export interface SessionParticipant {
  id: string;
  name: string;
}

export interface BillItem {
  id: string;
  description: string;
  amount: number;
  sharedBy: string[];
}

export interface ServiceTaxDetails {
  type: 'amount' | 'percentage';
  value: number;
}

export interface Summary {
  totalBill: number;
  totalItemExpenses: number;
  ppnAmount: number;
  serviceTaxAmount: number;
  deliveryFee: number;
  discount: number;
  participants: Array<{
    id: string;
    name: string;
    subtotal: number;
    // Detailed cost shares in Rupiah
    ppnShare: number;
    serviceTaxShare: number;
    deliveryFeeShare: number;
    discountShare: number;
    // Detailed cost shares in percentage
    ppnPercentageShare: number;
    serviceTaxPercentageShare: number;
    totalToPay: number;
  }>;
}