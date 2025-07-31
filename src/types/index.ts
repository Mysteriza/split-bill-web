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

export interface Transaction {
  from: string;
  to: string;
  amount: number;
}

export interface Summary {
  totalBill: number;
  totalItemExpenses: number;
  commonCosts: number;
  participants: Array<{
    name: string;
    totalToPay: number;
    totalItems: number;
  }>;
}
