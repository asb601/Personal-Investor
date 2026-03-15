import { cn } from '@/lib/utils';
import { CATEGORY_META } from '@/lib/category-meta';
import type { DailySpendEntry, Transaction } from '../types';
import { formatCurrency } from '../utils';

type Props = {
  data: DailySpendEntry[];
  transactions: Transaction[];
  selectedMonth: string;
  avgDailySpend: number;
};

export function DailyBreakdown({ data, transactions, selectedMonth, avgDailySpend }: Props) {
  const [y, m] = selectedMonth.split('-').map(Number);

  const today = new Date();
  const isCurrentMonth = today.getFullYear() === y && today.getMonth() + 1 === m;
  const currentDay = isCurrentMonth ? today.getDate() : null;

  // Only show days that have transactions, sorted newest first
  const activeDays = data
    .filter((d) => d.expense > 0 || d.income > 0)
    .sort((a, b) => b.day - a.day);

  const totalDays = activeDays.length;
  const highestDay = activeDays.length > 0
    ? activeDays.reduce((max, d) => (d.expense > max.expense ? d : max), activeDays[0])
    : null;

  if (activeDays.length === 0) {
    return (
      <div className="bg-card rounded-lg p-6 border border-border shadow-sm">
        <p className="text-muted-foreground text-sm text-center py-8">
          No transactions this month
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Summary strip */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground mb-1">
        <span>{totalDays} active day{totalDays !== 1 ? 's' : ''}</span>
        <span className="w-1 h-1 rounded-full bg-border" />
        <span>Avg {formatCurrency(Math.round(avgDailySpend))}/day</span>
        {highestDay && (
          <>
            <span className="w-1 h-1 rounded-full bg-border" />
            <span>
              Peak: Day {highestDay.day} ({formatCurrency(highestDay.expense)})
            </span>
          </>
        )}
      </div>

      {activeDays.map((entry) => {
        const dateObj = new Date(y, m - 1, entry.day);
        const dayName = dateObj.toLocaleDateString('en-IN', { weekday: 'short' });
        const dateStr = dateObj.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
        const isToday = currentDay === entry.day;
        const isAboveAvg = entry.expense > avgDailySpend;

        // Get all transactions for this day
        const dayExpenseTxns = transactions.filter((t) => {
          const txDate = new Date(t.date);
          return txDate.getDate() === entry.day && t.type === 'expense';
        });
        const dayIncomeTxns = transactions.filter((t) => {
          const txDate = new Date(t.date);
          return txDate.getDate() === entry.day && t.type === 'income';
        });
        const totalTxns = dayExpenseTxns.length + dayIncomeTxns.length;
        const categories = [...new Set(dayExpenseTxns.map((t) => t.category))];

        return (
          <div
            key={entry.day}
            className={cn(
              'bg-card rounded-lg border border-border p-4 flex items-center gap-4 transition-colors',
              isToday && 'border-primary/40 bg-primary/5',
            )}
          >
            {/* Date block */}
            <div
              className={cn(
                'flex flex-col items-center justify-center w-12 h-12 rounded-lg shrink-0',
                isToday ? 'bg-primary text-primary-foreground' : 'bg-muted',
              )}
            >
              <span className="text-lg font-bold leading-none">{entry.day}</span>
              <span className="text-[10px] font-medium uppercase leading-tight mt-0.5">
                {dayName}
              </span>
            </div>

            {/* Middle — categories */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">{dateStr}</p>
              <div className="flex items-center gap-1 mt-1 flex-wrap">
                {categories.slice(0, 4).map((cat) => {
                  const meta = CATEGORY_META[cat];
                  return (
                    <span
                      key={cat}
                      className="text-xs bg-muted px-1.5 py-0.5 rounded-md"
                      title={cat}
                    >
                      {meta?.icon} {cat}
                    </span>
                  );
                })}
                {categories.length > 4 && (
                  <span className="text-xs text-muted-foreground">
                    +{categories.length - 4}
                  </span>
                )}
              </div>
            </div>

            {/* Amount */}
            <div className="text-right shrink-0">
              {entry.expense > 0 && (
                <p
                  className={cn(
                    'text-sm font-semibold font-mono',
                    isAboveAvg ? 'text-red-500' : 'text-foreground',
                  )}
                >
                  −{formatCurrency(entry.expense)}
                </p>
              )}
              {entry.income > 0 && (
                <p className="text-sm font-semibold font-mono text-emerald-500">
                  +{formatCurrency(entry.income)}
                </p>
              )}
              <p className="text-[10px] text-muted-foreground mt-0.5">
                {totalTxns} txn{totalTxns !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
