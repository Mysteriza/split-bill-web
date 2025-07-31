import type { Participant, Summary } from '@/types';

export function calculateSplit(
  participants: Participant[],
  ppnPercentage: number, // Baru
  serviceTaxPercentage: number, // Baru
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

  const ppnAmount = (totalItemExpenses * ppnPercentage) / 100;
  const serviceTaxAmount = (totalItemExpenses * serviceTaxPercentage) / 100;
  
  const commonCosts = ppnAmount + serviceTaxAmount + deliveryFee - discount;
  const totalBill = totalItemExpenses + commonCosts;
  
  if (totalBill < 0) {
      return null;
  }

  const commonCostsPerPerson = participants.length > 0 ? commonCosts / participants.length : 0;

  const participantSummaries = participants.map(p => {
    const totalItems = p.expenses.reduce((sum, exp) => sum + exp.amount, 0);
    const totalToPay = totalItems + commonCostsPerPerson;
    return { name: p.name, totalItems, totalToPay };
  });

  return {
    totalBill,
    totalItemExpenses,
    ppnAmount,
    serviceTaxAmount,
    deliveryFee,
    discount,
    participants: participantSummaries,
  };
}