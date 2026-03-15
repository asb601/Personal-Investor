import { Target } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { DaySpend } from '../types';
import { formatCurrency } from '../utils';

type Props = {
  days: DaySpend[];
  selectedMonth: string;
};

export function TopSpendDays({ days, selectedMonth }: Props) {
  const [y, m] = selectedMonth.split('-').map(Number);

  return (
    <div className="bg-card rounded-lg p-4 sm:p-6 border border-border shadow-sm">
      <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
        <Target className="w-5 h-5 text-primary" />
        Top Spending Days
      </h2>

      {days.length === 0 ? (
        <p className="text-muted-foreground text-sm py-8 text-center">
          No spending data
        </p>
      ) : (
        <div className="space-y-3">
          {days.map((d, i) => {
            const dateObj = new Date(y, m - 1, d.day);
            const dayName = dateObj.toLocaleDateString('en-IN', { weekday: 'short' });
            const dateStr = dateObj.toLocaleDateString('en-IN', {
              day: 'numeric',
              month: 'short',
            });

            return (
              <div key={d.day} className="flex items-center gap-3">
                <div
                  className={cn(
                    'w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold shrink-0',
                    i === 0
                      ? 'bg-primary/15 text-primary'
                      : 'bg-muted text-muted-foreground',
                  )}
                >
                  {i + 1}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">
                      {dateStr}{' '}
                      <span className="text-muted-foreground text-xs">({dayName})</span>
                    </span>
                    <span className="font-mono text-sm font-semibold">
                      {formatCurrency(d.amount)}
                    </span>
                  </div>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden mt-1.5">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${(d.amount / days[0].amount) * 100}%`,
                        background: 'var(--chart-3)',
                      }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
