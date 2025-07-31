import type { Participant, Summary, TaxDetails } from '@/types';

export function calculateSplit(
  participants: Participant[],
  tax: TaxDetails,
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

  let taxAmount = 0;
  if (tax.type === 'percentage') {
    taxAmount = (totalItemExpenses * tax.value) / 100;
  } else {
    taxAmount = tax.value;
  }
  
  const commonCosts = taxAmount + deliveryFee - discount;
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
    commonCosts,
    taxAmount,
    deliveryFee,
    discount,
    participants: participantSummaries,
  };
}
