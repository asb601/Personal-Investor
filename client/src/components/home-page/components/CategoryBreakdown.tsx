import { PieChart } from 'lucide-react';
import type { CategoryName } from '@/lib/category-meta';

type CategoryTotal = {
  name: CategoryName;
  icon: string;
  color: string;
  total: number;
};

type Props = {
  categoryTotals: CategoryTotal[];
  totalExpenses: number;
};

export function CategoryBreakdown({ categoryTotals, totalExpenses }: Props) {
  if (categoryTotals.length === 0) return null;

  return (
    <div className="bg-card rounded-lg p-4 sm:p-6 mb-8 border border-border shadow-sm">
      <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
        <PieChart className="w-5 h-5 text-primary" />
        Category Breakdown
      </h2>

      <div className="space-y-4">
        {categoryTotals.map((cat) => {
          const percentage = (cat.total / totalExpenses) * 100;

          return (
            <div key={cat.name}>
              <div className="flex justify-between mb-2">
                <div className="flex gap-2 items-center">
                  <span className="text-xl">{cat.icon}</span>
                  <span>{cat.name}</span>
                </div>
                <span className="font-mono">
                  ₹{cat.total.toLocaleString('en-IN')}
                </span>
              </div>

              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${percentage}%`,
                    background: cat.color,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}