'use client';

import { ChevronLeft, ChevronRight, CalendarDays, Calendar, BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatMonthLabel, getCurrentMonth, getPrevMonth } from '../utils';

export type ViewMode = 'monthly' | 'daily';

type Props = {
  selectedMonth: string;
  onMonthChange: (month: string) => void;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
};

function getNextMonth(ym: string): string {
  const [y, m] = ym.split('-').map(Number);
  const d = new Date(y, m);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export function AnalyticsToolbar({ selectedMonth, onMonthChange, viewMode, onViewModeChange }: Props) {
  const currentMonth = getCurrentMonth();
  const isCurrentMonth = selectedMonth === currentMonth;

  return (
    <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
      {/* Month navigation */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => onMonthChange(getPrevMonth(selectedMonth))}
          className={cn(
            'p-2 rounded-lg border border-border transition-colors',
            'bg-secondary/50 hover:bg-accent text-foreground',
          )}
          aria-label="Previous month"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border bg-secondary/50 text-sm font-medium min-w-[140px] justify-center">
          <CalendarDays className="w-4 h-4 text-muted-foreground" />
          {formatMonthLabel(selectedMonth)}
        </div>

        <button
          onClick={() => !isCurrentMonth && onMonthChange(getNextMonth(selectedMonth))}
          disabled={isCurrentMonth}
          className={cn(
            'p-2 rounded-lg border border-border transition-colors',
            isCurrentMonth
              ? 'opacity-40 cursor-not-allowed bg-secondary/30'
              : 'bg-secondary/50 hover:bg-accent text-foreground',
          )}
          aria-label="Next month"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* View mode toggle */}
      <div className="flex items-center gap-1 p-1 bg-muted/50 rounded-lg">
        <button
          onClick={() => onViewModeChange('monthly')}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all',
            viewMode === 'monthly'
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground',
          )}
        >
          <BarChart3 className="w-3.5 h-3.5" />
          Monthly
        </button>
        <button
          onClick={() => onViewModeChange('daily')}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all',
            viewMode === 'daily'
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground',
          )}
        >
          <Calendar className="w-3.5 h-3.5" />
          Daily
        </button>
      </div>
    </div>
  );
}
