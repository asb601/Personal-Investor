'use client';

import { useState } from 'react';
import { PieChart } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CategoryStat } from '../types';
import { formatCurrency } from '../utils';

type Props = {
  expenseBreakdown: CategoryStat[];
  incomeBreakdown: CategoryStat[];
  totalExpense: number;
  totalIncome: number;
};

export function CategoryBreakdown({
  expenseBreakdown,
  incomeBreakdown,
  totalExpense,
  totalIncome,
}: Props) {
  const [tab, setTab] = useState<'expense' | 'income'>('expense');
  const items = tab === 'expense' ? expenseBreakdown : incomeBreakdown;
  const total = tab === 'expense' ? totalExpense : totalIncome;

  return (
    <div className="bg-card rounded-lg p-4 sm:p-6 mb-6 border border-border shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold flex items-center gap-2">
          <PieChart className="w-5 h-5 text-primary" />
          Category Breakdown
        </h2>

        <div className="inline-flex rounded-lg border border-border overflow-hidden">
          {(['expense', 'income'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                'px-3 py-1.5 text-xs font-medium transition-colors capitalize',
                tab === t
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary/50 text-muted-foreground hover:text-foreground hover:bg-accent',
              )}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {items.length === 0 ? (
        <p className="text-muted-foreground text-sm py-8 text-center">
          No {tab === 'expense' ? 'expenses' : 'income'} this month
        </p>
      ) : (
        <div className="space-y-4">
          {items.map((cat) => {
            const pct = total > 0 ? (cat.total / total) * 100 : 0;
            return (
              <div key={cat.name}>
                <div className="flex justify-between mb-1.5">
                  <div className="flex gap-2 items-center">
                    <span className="text-lg">{cat.icon}</span>
                    <span className="text-sm font-medium">{cat.name}</span>
                    <span className="text-[11px] text-muted-foreground">
                      ({cat.count})
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      {pct.toFixed(1)}%
                    </span>
                    <span
                      className={cn(
                        'font-mono text-sm font-semibold',
                        tab === 'income' && 'text-emerald-400',
                      )}
                    >
                      {formatCurrency(cat.total)}
                    </span>
                  </div>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${pct}%`, background: cat.color }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
