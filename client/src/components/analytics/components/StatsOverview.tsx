import { TrendingUp, TrendingDown, Wallet, Clock } from 'lucide-react';
import { StatCard } from './StatCard';
import { formatCurrency } from '../utils';

type Props = {
  totalIncome: number;
  totalExpense: number;
  netSavings: number;
  savingsRate: number;
  avgDailySpend: number;
  txnCount: number;
  incomeChange: number;
  expenseChange: number;
};

export function StatsOverview({
  totalIncome,
  totalExpense,
  netSavings,
  savingsRate,
  avgDailySpend,
  txnCount,
  incomeChange,
  expenseChange,
}: Props) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <StatCard
        label="Income"
        value={formatCurrency(totalIncome)}
        icon={<TrendingUp className="w-4 h-4" />}
        change={incomeChange}
        accent="emerald"
      />
      <StatCard
        label="Expenses"
        value={formatCurrency(totalExpense)}
        icon={<TrendingDown className="w-4 h-4" />}
        change={expenseChange}
        invertChange
      />
      <StatCard
        label="Savings"
        value={formatCurrency(netSavings)}
        icon={<Wallet className="w-4 h-4" />}
        subtitle={`${savingsRate.toFixed(1)}% rate`}
        accent={netSavings >= 0 ? 'emerald' : 'destructive'}
      />
      <StatCard
        label="Avg Daily Spend"
        value={formatCurrency(Math.round(avgDailySpend))}
        icon={<Clock className="w-4 h-4" />}
        subtitle={`${txnCount} transactions`}
      />
    </div>
  );
}
