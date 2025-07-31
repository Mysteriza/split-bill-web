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
  totalExpenses: number;
  sharePerPerson: number;
  participants: Array<{
    name: string;
    totalSpent: number;
    balance: number;
  }>;
  transactions: Transaction[];
}
