import { BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { MonthData } from '../types';

type Props = {
  trend: MonthData[];
  maxValue: number;
  selectedMonth: string;
  onMonthSelect: (month: string) => void;
};

export function MonthlyTrend({ trend, maxValue, selectedMonth, onMonthSelect }: Props) {
  return (
    <div className="bg-card rounded-lg p-4 sm:p-6 mb-6 border border-border shadow-sm">
      <h2 className="text-lg font-bold mb-5 flex items-center gap-2">
        <BarChart3 className="w-5 h-5 text-primary" />
        Monthly Trend
      </h2>

      <div className="flex items-end gap-3 sm:gap-6 h-48">
        {trend.map((m) => {
          const expH = (m.expense / maxValue) * 100;
          const incH = (m.income / maxValue) * 100;
          const active = m.month === selectedMonth;

          return (
            <div
              key={m.month}
              className="flex-1 flex flex-col items-center gap-1 cursor-pointer group"
              onClick={() => onMonthSelect(m.month)}
            >
              <div className="flex items-end gap-1 w-full h-40">
                <div
                  className="flex-1 rounded-t-md transition-all duration-500 group-hover:opacity-80"
                  style={{
                    height: `${Math.max(incH, 2)}%`,
                    background: 'var(--chart-1)',
                    opacity: active ? 1 : 0.4,
                  }}
                />
                <div
                  className="flex-1 rounded-t-md transition-all duration-500 group-hover:opacity-80"
                  style={{
                    height: `${Math.max(expH, 2)}%`,
                    background: 'var(--chart-3)',
                    opacity: active ? 1 : 0.4,
                  }}
                />
              </div>

              <span
                className={cn(
                  'text-[11px] font-medium mt-1',
                  active ? 'text-primary' : 'text-muted-foreground',
                )}
              >
                {m.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm" style={{ background: 'var(--chart-1)' }} />
          Income
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm" style={{ background: 'var(--chart-3)' }} />
          Expenses
        </div>
      </div>
    </div>
  );
}
