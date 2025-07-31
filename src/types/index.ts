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

export interface Summary {
  totalBill: number;
  totalItemExpenses: number;
  ppnAmount: number; // Baru
  serviceTaxAmount: number; // Baru
  deliveryFee: number;
  discount: number;
  participants: Array<{
    name: string;
    totalToPay: number;
    totalItems: number;
  }>;
}