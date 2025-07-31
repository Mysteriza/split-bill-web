import type { Participant, Summary, Transaction } from '@/types';

export function calculateSplit(
  participants: Participant[],
  taxAmount: number,
  deliveryFee: number,
  discount: number
): Summary | null {
  if (participants.length === 0) {
    return null;
  }

  const participantSummaries = participants.map(p => {
    const totalSpent = p.expenses.reduce((sum, exp) => sum + exp.amount, 0);
    return { id: p.id, name: p.name, totalSpent };
  });

  const totalExpenses = participantSummaries.reduce((sum, p) => sum + p.totalSpent, 0);
  
  const totalBill = totalExpenses + taxAmount + deliveryFee - discount;

  if (totalBill < 0) {
      // Or handle this case as you see fit
      return null;
  }

  const sharePerPerson = totalBill / participants.length;

  const balances = participantSummaries.map(p => ({
    ...p,
    balance: p.totalSpent - sharePerPerson,
  }));

  const payers = balances.filter(p => p.balance < 0).map(p => ({ ...p, name: p.name, balance: -p.balance })).sort((a, b) => b.balance - a.balance);
  const receivers = balances.filter(p => p.balance > 0).sort((a, b) => b.balance - a.balance);
  const transactions: Transaction[] = [];

  let payerIndex = 0;
  let receiverIndex = 0;

  while (payerIndex < payers.length && receiverIndex < receivers.length) {
    const payer = payers[payerIndex];
    const receiver = receivers[receiverIndex];
    const amount = Math.min(payer.balance, receiver.balance);

    // To avoid creating transactions for negligible amounts due to floating point inaccuracies
    if (amount > 0.01) {
        transactions.push({
          from: payer.name,
          to: receiver.name,
          amount: amount,
        });

        payer.balance -= amount;
        receiver.balance -= amount;
    }

    if (payer.balance < 0.01) {
      payerIndex++;
    }
    if (receiver.balance < 0.01) {
      receiverIndex++;
    }
  }

  return {
    totalBill,
    totalExpenses,
    sharePerPerson,
    participants: balances.map(p => ({ name: p.name, totalSpent: p.totalSpent, balance: p.totalSpent - sharePerPerson })),
    transactions,
  };
}
