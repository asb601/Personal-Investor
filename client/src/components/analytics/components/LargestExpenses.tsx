import { ArrowUpRight } from 'lucide-react';
import { CATEGORY_META } from '@/lib/category-meta';
import type { Transaction } from '../types';
import { formatCurrency } from '../utils';

type Props = {
  expenses: Transaction[];
};

export function LargestExpenses({ expenses }: Props) {
  return (
    <div className="bg-card rounded-lg p-4 sm:p-6 border border-border shadow-sm">
      <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
        <ArrowUpRight className="w-5 h-5 text-primary" />
        Largest Expenses
      </h2>

      {expenses.length === 0 ? (
        <p className="text-muted-foreground text-sm py-8 text-center">
          No expenses this month
        </p>
      ) : (
        <div className="space-y-3">
          {expenses.map((t) => {
            const meta = CATEGORY_META[t.category];
            return (
              <div
                key={t.id}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent/40 transition-colors"
              >
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center text-lg border-2 shrink-0"
                  style={{
                    background: `color-mix(in oklch, ${meta.color} 15%, transparent)`,
                    borderColor: meta.color,
                  }}
                >
                  {meta.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">
                    {t.note || t.category}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(t.date).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                    })}
                  </div>
                </div>
                <span className="font-mono text-sm font-bold">
                  {formatCurrency(t.amount)}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
