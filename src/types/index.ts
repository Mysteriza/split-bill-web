export interface Expense {
  id: string;
  description: string;
  amount: number;
}

export interface Participant {
  id: string;
  name: string;
  expenses: Expense[];
}

export interface TaxDetails {
  type: 'amount' | 'percentage';
  value: number;
}

export interface Summary {
  totalBill: number;
  totalItemExpenses: number;
  taxAmount: number;
  deliveryFee: number;
  discount: number;
  participants: Array<{
    name: string;
    totalToPay: number;
    totalItems: number;
  }>;
}