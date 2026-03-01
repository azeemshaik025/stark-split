import type { Debt, Expense } from "@/types";

export interface SettlementInput {
  from_user: string;
  to_user: string;
  amount: number;
}

/**
 * Minimum cashflow algorithm to compute optimized debts.
 * Returns the minimum number of transactions to settle all balances.
 * Accounts for confirmed settlements: reduces debt when from_user paid to_user.
 */
export function calculateDebts(
  expenses: Expense[],
  memberIds: string[],
  settlements: SettlementInput[] = []
): Debt[] {
  if (!memberIds.length) return [];

  // 1. Calculate net balance for each member from expenses
  const balances: Record<string, number> = {};
  memberIds.forEach((m) => (balances[m] = 0));

  expenses.forEach((expense) => {
    const { paid_by, amount, split_type, split_details } = expense;

    if (split_type === "equal") {
      // If split_details has keys, split only among those members; else among all
      const splitMembers = split_details && Object.keys(split_details).length > 0
        ? Object.keys(split_details)
        : memberIds;
      const perPerson = splitMembers.length > 0 ? amount / splitMembers.length : 0;
      balances[paid_by] = (balances[paid_by] ?? 0) + amount;
      splitMembers.forEach((m) => {
        balances[m] = (balances[m] ?? 0) - perPerson;
      });
    } else if (split_type === "exact" && split_details) {
      balances[paid_by] = (balances[paid_by] ?? 0) + amount;
      Object.entries(split_details).forEach(([uid, share]) => {
        balances[uid] = (balances[uid] ?? 0) - share;
      });
    } else if (split_type === "percentage" && split_details) {
      balances[paid_by] = (balances[paid_by] ?? 0) + amount;
      Object.entries(split_details).forEach(([uid, pct]) => {
        balances[uid] = (balances[uid] ?? 0) - (amount * pct) / 100;
      });
    }
  });

  // 1b. Apply confirmed settlements: from_user paid to_user → reduces debt
  settlements.forEach((s) => {
    const amt = Number(s.amount);
    if (amt > 0) {
      balances[s.from_user] = (balances[s.from_user] ?? 0) + amt;
      balances[s.to_user] = (balances[s.to_user] ?? 0) - amt;
    }
  });

  // 2. Separate creditors and debtors
  const creditors: { id: string; amount: number }[] = [];
  const debtors: { id: string; amount: number }[] = [];

  // Use 1e-18 so WBTC (8 decimals) and STRK (18 decimals) preserve values like 10e-8
  const DUST = 1e-18;
  Object.entries(balances).forEach(([id, amount]) => {
    if (amount > DUST) creditors.push({ id, amount });
    else if (amount < -DUST) debtors.push({ id, amount: Math.abs(amount) });
  });

  creditors.sort((a, b) => b.amount - a.amount);
  debtors.sort((a, b) => b.amount - a.amount);

  // 3. Greedy matching (minimize transactions)
  const debts: Debt[] = [];
  let i = 0;
  let j = 0;

  // Use 18 decimals to preserve STRK (18) and WBTC (8) precision
  const DECIMALS = 18;
  while (i < creditors.length && j < debtors.length) {
    const settle = Math.min(creditors[i].amount, debtors[j].amount);

    debts.push({
      from: debtors[j].id,
      to: creditors[i].id,
      amount: Number(settle.toFixed(DECIMALS)),
    });

    creditors[i].amount -= settle;
    debtors[j].amount -= settle;

    if (creditors[i].amount < DUST) i++;
    if (debtors[j].amount < DUST) j++;
  }

  return debts;
}

/**
 * Get the net balance of a specific user across all debts.
 * Positive = owed to user; Negative = user owes others.
 */
export function getUserNetBalance(
  debts: Debt[],
  userId: string
): number {
  let net = 0;
  debts.forEach((d) => {
    if (d.to === userId) net += d.amount;
    if (d.from === userId) net -= d.amount;
  });
  return Number(net.toFixed(18));
}

/**
 * Filter debts relevant to a specific user.
 */
export function getDebtsForUser(debts: Debt[], userId: string): Debt[] {
  return debts.filter((d) => d.from === userId || d.to === userId);
}
