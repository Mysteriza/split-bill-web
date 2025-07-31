import type { Participant, Summary } from '@/types';

export function calculateSplit(
  participants: Participant[],
  taxAmount: number,
  deliveryFee: number,
  discount: number
): Summary | null {
  if (participants.length === 0) {
    return null;
  }

  const totalItemExpenses = participants.reduce(
    (total, p) => total + p.expenses.reduce((sum, exp) => sum + exp.amount, 0),
    0
  );

  const commonCosts = taxAmount + deliveryFee - discount;
  const totalBill = totalItemExpenses + commonCosts;
  
  if (totalBill < 0) {
      return null;
  }

  const commonCostsPerPerson = commonCosts / participants.length;

  const participantSummaries = participants.map(p => {
    const totalItems = p.expenses.reduce((sum, exp) => sum + exp.amount, 0);
    const totalToPay = totalItems + commonCostsPerPerson;
    return { name: p.name, totalItems, totalToPay };
  });


  return {
    totalBill,
    totalItemExpenses,
    commonCosts,
    participants: participantSummaries,
  };
}
