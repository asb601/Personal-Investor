import type { CategoryName } from '@/lib/category-meta';

export type Transaction = {
  id: number;
  amount: number;
  category: CategoryName;
  note?: string;
  date: string;
  type: 'expense' | 'income';
  paymentStatus: string;
  cardId?: number | null;
};

export type CategoryStat = {
  name: CategoryName;
  icon: string;
  color: string;
  total: number;
  count: number;
};

export type MonthData = {
  month: string;
  label: string;
  expense: number;
  income: number;
};

export type DaySpend = {
  day: number;
  amount: number;
};

export type DailySpendEntry = {
  day: number;
  date: string;
  expense: number;
  income: number;
};

export type CompareData = {
  expense: number;
  income: number;
};

export type AnalyticsData = {
  totalExpense: number;
  totalIncome: number;
  netSavings: number;
  savingsRate: number;
  avgDailySpend: number;
  txnCount: number;
  expenseChange: number;
  incomeChange: number;
  categoryBreakdown: CategoryStat[];
  incomeBreakdown: CategoryStat[];
  topSpendDays: DaySpend[];
  dailySpending: DailySpendEntry[];
  monthlyTrend: MonthData[];
  maxTrendValue: number;
  largestExpenses: Transaction[];
  compareData: CompareData | null;
};
