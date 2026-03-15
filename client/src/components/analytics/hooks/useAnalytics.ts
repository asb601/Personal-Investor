import { useMemo } from 'react';
import type { Transaction, AnalyticsData, CategoryStat, MonthData, DaySpend, DailySpendEntry } from '../types';
import { getDaysInMonth, getPrevMonth, getMonthOffset } from '../utils';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '../constants';
import { filterByMonth, sumByType, pctChange } from './transaction-math';

export function useAnalytics(
  transactions: Transaction[],
  selectedMonth: string,
  compareMonth: string | null,
): AnalyticsData {
  const monthTxns = useMemo(
    () => filterByMonth(transactions, selectedMonth),
    [transactions, selectedMonth],
  );

  const totalExpense = useMemo(() => sumByType(monthTxns, 'expense'), [monthTxns]);
  const totalIncome = useMemo(() => sumByType(monthTxns, 'income'), [monthTxns]);
  const netSavings = totalIncome - totalExpense;
  const savingsRate = totalIncome > 0 ? (netSavings / totalIncome) * 100 : 0;
  const daysInMonth = getDaysInMonth(selectedMonth);
  const avgDailySpend = daysInMonth > 0 ? totalExpense / daysInMonth : 0;

  /* previous-month % change (relative to selected month, not today) */
  const prev = useMemo(() => getPrevMonth(selectedMonth), [selectedMonth]);
  const prevTxns = useMemo(
    () => filterByMonth(transactions, prev),
    [transactions, prev],
  );
  const expenseChange = useMemo(
    () => pctChange(totalExpense, sumByType(prevTxns, 'expense')),
    [totalExpense, prevTxns],
  );
  const incomeChange = useMemo(
    () => pctChange(totalIncome, sumByType(prevTxns, 'income')),
    [totalIncome, prevTxns],
  );

  /* category breakdowns */
  const categoryBreakdown = useMemo<CategoryStat[]>(() => {
    return EXPENSE_CATEGORIES
      .map((c) => ({
        ...c,
        total: monthTxns
          .filter((t) => t.type === 'expense' && t.category === c.name)
          .reduce((s, t) => s + t.amount, 0),
        count: monthTxns.filter(
          (t) => t.type === 'expense' && t.category === c.name,
        ).length,
      }))
      .filter((c) => c.total > 0)
      .sort((a, b) => b.total - a.total);
  }, [monthTxns]);

  const incomeBreakdown = useMemo<CategoryStat[]>(() => {
    return INCOME_CATEGORIES
      .map((c) => ({
        ...c,
        total: monthTxns
          .filter((t) => t.type === 'income' && t.category === c.name)
          .reduce((s, t) => s + t.amount, 0),
        count: monthTxns.filter(
          (t) => t.type === 'income' && t.category === c.name,
        ).length,
      }))
      .filter((c) => c.total > 0)
      .sort((a, b) => b.total - a.total);
  }, [monthTxns]);

  /* top 5 spending days */
  const topSpendDays = useMemo<DaySpend[]>(() => {
    const days: Record<number, number> = {};
    for (let i = 1; i <= daysInMonth; i++) days[i] = 0;
    monthTxns
      .filter((t) => t.type === 'expense')
      .forEach((t) => {
        const d = new Date(t.date).getDate();
        days[d] = (days[d] || 0) + t.amount;
      });
    return Object.entries(days)
      .map(([day, amount]) => ({ day: Number(day), amount }))
      .filter((d) => d.amount > 0)
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);
  }, [monthTxns, daysInMonth]);

  /* day-wise spending for the full month */
  const dailySpending = useMemo<DailySpendEntry[]>(() => {
    const [y, m] = selectedMonth.split('-').map(Number);
    const result: DailySpendEntry[] = [];
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${selectedMonth}-${String(d).padStart(2, '0')}`;
      const dayTxns = monthTxns.filter((t) => new Date(t.date).getDate() === d);
      result.push({
        day: d,
        date: dateStr,
        expense: dayTxns.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0),
        income: dayTxns.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0),
      });
    }
    return result;
  }, [monthTxns, selectedMonth, daysInMonth]);

  /* 6-month trend */
  const monthlyTrend = useMemo<MonthData[]>(() => {
    return Array.from({ length: 6 }, (_, i) => {
      const ym = getMonthOffset(i - 5);
      const [y, m] = ym.split('-').map(Number);
      const txns = filterByMonth(transactions, ym);
      return {
        month: ym,
        label: new Date(y, m - 1).toLocaleDateString('en-IN', { month: 'short' }),
        expense: sumByType(txns, 'expense'),
        income: sumByType(txns, 'income'),
      };
    });
  }, [transactions]);

  const maxTrendValue = useMemo(
    () => Math.max(...monthlyTrend.flatMap((m) => [m.expense, m.income]), 1),
    [monthlyTrend],
  );

  /* top 5 largest expenses */
  const largestExpenses = useMemo(
    () =>
      [...monthTxns]
        .filter((t) => t.type === 'expense')
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 5),
    [monthTxns],
  );

  /* compare data */
  const compareData = useMemo(() => {
    if (!compareMonth) return null;
    const txns = filterByMonth(transactions, compareMonth);
    return { expense: sumByType(txns, 'expense'), income: sumByType(txns, 'income') };
  }, [transactions, compareMonth]);

  return {
    totalExpense,
    totalIncome,
    netSavings,
    savingsRate,
    avgDailySpend,
    txnCount: monthTxns.length,
    expenseChange,
    incomeChange,
    categoryBreakdown,
    incomeBreakdown,
    topSpendDays,
    dailySpending,
    monthlyTrend,
    maxTrendValue,
    largestExpenses,
    compareData,
  };
}
