import type { Transaction } from '../types';

/** Filter transactions belonging to a given YYYY-MM month. */
export function filterByMonth(txns: Transaction[], ym: string): Transaction[] {
  const [year, month] = ym.split('-').map(Number);
  return txns.filter((t) => {
    if (!t.date) return false;
    const d = new Date(t.date);
    return d.getFullYear() === year && d.getMonth() + 1 === month;
  });
}

/** Sum transaction amounts for a given type. */
export function sumByType(txns: Transaction[], type: 'expense' | 'income'): number {
  return txns.filter((t) => t.type === type).reduce((s, t) => s + t.amount, 0);
}

/** Percentage change — returns 0 when previous is 0. */
export function pctChange(current: number, previous: number): number {
  return previous > 0 ? ((current - previous) / previous) * 100 : 0;
}
