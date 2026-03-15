import type { ReactNode } from 'react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { cn } from '@/lib/utils';

type Props = {
  label: string;
  value: string;
  icon: ReactNode;
  change?: number;
  subtitle?: string;
  accent?: 'default' | 'emerald' | 'destructive';
  invertChange?: boolean;
};

export function StatCard({
  label,
  value,
  icon,
  change,
  subtitle,
  accent = 'default',
  invertChange = false,
}: Props) {
  const valueColor =
    accent === 'emerald'
      ? 'text-emerald-400'
      : accent === 'destructive'
        ? 'text-destructive'
        : '';

  const hasChange = change !== undefined && change !== 0;
  const isPositive = invertChange ? change! < 0 : change! > 0;

  return (
    <div className="bg-card rounded-lg p-4 sm:p-6 border border-border shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs uppercase tracking-wider text-muted-foreground">
          {label}
        </span>
        <div className="p-1.5 rounded-md bg-muted text-muted-foreground">{icon}</div>
      </div>

      <div className={cn('text-xl sm:text-3xl font-bold font-mono', valueColor)}>
        {value}
      </div>

      {hasChange && (
        <div
          className={cn(
            'text-xs font-medium flex items-center gap-0.5 mt-1',
            isPositive ? 'text-emerald-400' : 'text-destructive',
          )}
        >
          {isPositive ? (
            <ArrowUpRight className="w-3 h-3" />
          ) : (
            <ArrowDownRight className="w-3 h-3" />
          )}
          {Math.abs(change!).toFixed(1)}% vs last month
        </div>
      )}

      {subtitle && (
        <div className="text-xs text-muted-foreground mt-1">{subtitle}</div>
      )}
    </div>
  );
}
