import type { SessionParticipant, BillItem, Summary, ServiceTaxDetails } from '@/types';

export function calculateSplit(
  participants: SessionParticipant[],
  items: BillItem[],
  ppnPercentage: number,
  serviceTax: ServiceTaxDetails,
  deliveryFee: number,
  discount: number
): Summary | null {
  if (participants.length === 0) {
    return null;
  }

  const participantSubtotals: { [key: string]: number } = {};
  participants.forEach(p => participantSubtotals[p.id] = 0);

  items.forEach(item => {
    if (item.sharedBy.length > 0) {
      const costPerPerson = item.amount / item.sharedBy.length;
      item.sharedBy.forEach(participantId => {
        if (participantSubtotals[participantId] !== undefined) {
          participantSubtotals[participantId] += costPerPerson;
        }
      });
    }
  });

  const totalItemExpenses = Object.values(participantSubtotals).reduce((sum, val) => sum + val, 0);

  if (totalItemExpenses === 0) {
     return {
        totalBill: Math.max(0, deliveryFee - discount),
        totalItemExpenses: 0,
        ppnAmount: 0,
        serviceTaxAmount: 0,
        deliveryFee,
        discount,
        participants: participants.map(p => ({ 
            id: p.id, name: p.name, subtotal: 0, 
            ppnShare: 0, serviceTaxShare: 0, deliveryFeeShare: 0, discountShare: 0,
            ppnPercentageShare: 0, serviceTaxPercentageShare: 0, 
            totalToPay: 0 
        })),
     };
  }

  const ppnAmount = (totalItemExpenses * ppnPercentage) / 100;
  
  let serviceTaxAmount = 0;
  if (serviceTax.type === 'percentage') {
    serviceTaxAmount = (totalItemExpenses * serviceTax.value) / 100;
  } else {
    serviceTaxAmount = serviceTax.value;
  }
  
  const totalBill = totalItemExpenses + ppnAmount + serviceTaxAmount + deliveryFee - discount;

  const participantSummaries = participants.map(p => {
    const subtotal = participantSubtotals[p.id];
    const proportion = totalItemExpenses > 0 ? subtotal / totalItemExpenses : 0;
    
    const ppnShare = proportion * ppnAmount;
    const serviceTaxShare = proportion * serviceTaxAmount;
    const deliveryFeeShare = proportion * deliveryFee;
    const discountShare = proportion * discount;

    const ppnPercentageShare = proportion * ppnPercentage;
    const serviceTaxPercentageShare = serviceTax.type === 'percentage' ? proportion * serviceTax.value : 0;

    const totalToPay = subtotal + ppnShare + serviceTaxShare + deliveryFeeShare - discountShare;

    return {
      id: p.id,
      name: p.name,
      subtotal,
      ppnShare,
      serviceTaxShare,
      deliveryFeeShare,
      discountShare,
      ppnPercentageShare,
      serviceTaxPercentageShare,
      totalToPay,
    };
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