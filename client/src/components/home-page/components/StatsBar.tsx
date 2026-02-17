import type { Expense } from '../types';
import type { CategoryName } from '@/lib/category-meta';
import { CATEGORY_META } from '@/lib/category-meta';

type CategoryTotal = {
  name: CategoryName;
  icon: string;
  color: string;
  total: number;
};

type Props = {
  totalIncome: number;
  totalExpenses: number;
  leftInWallet: number;
  categoryTotals: CategoryTotal[];
};

export function StatsBar({
  totalIncome,
  totalExpenses,
  leftInWallet,
  categoryTotals,
}: Props) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">

      {/* Income */}
      <div className="bg-card rounded-lg p-4 sm:p-6 border border-border shadow-sm">
        <span className="text-xs uppercase tracking-wider text-muted-foreground">
          Income
        </span>
        <div className="text-xl sm:text-3xl font-bold font-mono text-emerald-400 mt-2">
          ₹{totalIncome.toLocaleString('en-IN')}
        </div>
      </div>

      {/* Total Spent */}
      <div className="bg-card rounded-lg p-4 sm:p-6 border border-border shadow-sm">
        <span className="text-xs uppercase tracking-wider text-muted-foreground">
          Total Spent
        </span>
        <div className="text-xl sm:text-3xl font-bold font-mono mt-2">
          ₹{totalExpenses.toLocaleString('en-IN')}
        </div>
      </div>

      {/* Balance */}
      <div className="bg-card rounded-lg p-4 sm:p-6 border border-border shadow-sm">
        <span className="text-xs uppercase tracking-wider text-muted-foreground">
          Balance
        </span>
        <div
          className={`text-xl sm:text-3xl font-bold font-mono mt-2 ${
            leftInWallet >= 0 ? 'text-emerald-400' : 'text-destructive'
          }`}
        >
          ₹{leftInWallet.toLocaleString('en-IN')}
        </div>
      </div>

      {/* Top Category */}
      <div className="bg-card rounded-lg p-4 sm:p-6 border border-border shadow-sm">
        <span className="text-xs uppercase tracking-wider text-muted-foreground">
          Top Category
        </span>
        <div className="text-lg sm:text-2xl font-semibold mt-2">
          {categoryTotals.length > 0
            ? categoryTotals.reduce((max, cat) =>
                cat.total > max.total ? cat : max,
              categoryTotals[0]).name
            : 'None'}
        </div>
      </div>

    </div>
  );
}