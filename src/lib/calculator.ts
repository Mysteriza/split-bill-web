import type { SessionParticipant, BillItem, Summary, ServiceTaxDetails, DiscountDetails, Transaction } from '@/types';

export function calculateSplit(
  participants: SessionParticipant[],
  items: BillItem[],
  ppnPercentage: number,
  serviceTax: ServiceTaxDetails,
  deliveryFee: number,
  globalDiscount: DiscountDetails,
  rounding: number,
  payerId?: string
): Summary | null {
  if (participants.length === 0) return null;

  const participantSubtotals: Map<string, number> = new Map(participants.map(p => [p.id, 0]));
  let totalItemDiscount = 0;

  items.forEach(item => {
    const itemTotalBeforeDiscount = item.price * item.quantity;
    let itemDiscountAmount = 0;
    if (item.discount.type === 'percentage') {
      itemDiscountAmount = itemTotalBeforeDiscount * (item.discount.value / 100);
    } else {
      itemDiscountAmount = item.discount.value;
    }
    const itemTotalAfterDiscount = itemTotalBeforeDiscount - itemDiscountAmount;
    totalItemDiscount += itemDiscountAmount;
    
    if (item.sharedBy.length > 0) {
      const costPerPerson = itemTotalAfterDiscount / item.sharedBy.length;
      item.sharedBy.forEach(pId => {
        participantSubtotals.set(pId, (participantSubtotals.get(pId) || 0) + costPerPerson);
      });
    }
  });

  const totalItemExpenses = Array.from(participantSubtotals.values()).reduce((sum, val) => sum + val, 0);
  
  let globalDiscountAmount = 0;
  if (globalDiscount.type === 'percentage') {
    globalDiscountAmount = totalItemExpenses * (globalDiscount.value / 100);
  } else {
    globalDiscountAmount = globalDiscount.value;
  }
  const totalDiscount = totalItemDiscount + globalDiscountAmount;

  const baseForTax = totalItemExpenses;
  const ppnAmount = (baseForTax * ppnPercentage) / 100;
  
  let serviceTaxAmount = 0;
  if (serviceTax.type === 'percentage') {
    serviceTaxAmount = (baseForTax * serviceTax.value) / 100;
  } else {
    serviceTaxAmount = serviceTax.value;
  }
  
  const totalBill = totalItemExpenses + ppnAmount + serviceTaxAmount + deliveryFee - globalDiscountAmount;

  const participantSummaries = participants.map(p => {
    const subtotal = participantSubtotals.get(p.id) || 0;
    const proportion = totalItemExpenses > 0 ? subtotal / totalItemExpenses : 0;
    
    const ppnShare = proportion * ppnAmount;
    const serviceTaxShare = proportion * serviceTaxAmount;
    const deliveryFeeShare = proportion * deliveryFee;
    const globalDiscountShare = proportion * globalDiscountAmount;

    const finalShare = subtotal + ppnShare + serviceTaxShare + deliveryFeeShare - globalDiscountShare;
    
    let totalToPay = finalShare;
    if (rounding > 0 && finalShare > 0) {
      totalToPay = Math.ceil(finalShare / rounding) * rounding;
    }

    const ppnPercentageShare = ppnAmount > 0 ? ppnShare / ppnAmount : 0;
    const serviceTaxPercentageShare = serviceTaxAmount > 0 ? serviceTaxShare / serviceTaxAmount : 0;

    return { 
      id: p.id, 
      name: p.name, 
      subtotal, 
      ppnShare, 
      serviceTaxShare, 
      deliveryFeeShare, 
      globalDiscountShare, 
      finalShare, 
      totalToPay, 
      ppnPercentageShare, 
      serviceTaxPercentageShare 
    };
  });

  const grandTotal = participantSummaries.reduce((sum, p) => sum + p.totalToPay, 0);
  const roundingDifference = grandTotal - totalBill;

  let transactions: Transaction[] = [];
  if (payerId && participants.length > 1 && payerId !== 'none') {
      const payer = participants.find(p => p.id === payerId);
      if (payer) {
          transactions = participantSummaries
              .filter(p => p.id !== payerId && p.totalToPay > 0)
              .map(p => ({ from: p.name, to: payer.name, amount: p.totalToPay }));
      }
  }

  return { totalBill, grandTotal, roundingDifference, totalItemExpenses, ppnAmount, serviceTaxAmount, deliveryFee, totalDiscount, participants: participantSummaries, transactions };
}