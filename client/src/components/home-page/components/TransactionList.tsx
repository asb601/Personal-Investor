import { X } from 'lucide-react';
import { CATEGORY_META } from '@/lib/category-meta';
import type { CategoryName } from '@/lib/category-meta';
import type { Expense } from '../types';

type CategoryMeta = {
  name: CategoryName;
  icon: string;
  color: string;
};

type Props = {
  expenses: Expense[];
  filter: 'all' | CategoryName;
  setFilter: (f: 'all' | CategoryName) => void;
  categories: CategoryMeta[];
  onDelete: (id: number) => void;
};

export function TransactionList({
  expenses,
  filter,
  setFilter,
  categories,
  onDelete,
}: Props) {
  const filteredExpenses =
    filter === 'all'
      ? expenses
      : expenses.filter((e) => e.category === filter);

  const getCategoryData = (category: CategoryName) => {
    const meta = CATEGORY_META[category];
    return { icon: meta.icon, color: meta.color };
  };

  return (
    <>
      {/* ===== Filters ===== */}
      <div className="flex gap-2 flex-wrap mb-6">
        <button
          onClick={() => setFilter('all')}
          className={`px-3 py-2 rounded-md text-sm ${
            filter === 'all'
              ? 'bg-primary text-primary-foreground'
              : 'bg-secondary text-secondary-foreground'
          }`}
        >
          All
        </button>

        {categories.map((cat) => (
          <button
            key={cat.name}
            onClick={() => setFilter(cat.name)}
            className={`px-3 py-2 rounded-md text-sm ${
              filter === cat.name
                ? 'text-white'
                : 'bg-secondary text-secondary-foreground'
            }`}
            style={filter === cat.name ? { background: cat.color } : {}}
          >
            {cat.icon} {cat.name}
          </button>
        ))}
      </div>

      {/* ===== Transaction Cards ===== */}
      <div className="space-y-3">
        {filteredExpenses.map((expense) => {
          const catData = getCategoryData(expense.category);

          return (
            <div
              key={expense.id}
              className="bg-card rounded-lg p-4 border border-border shadow-sm flex justify-between items-center"
            >
              <div className="flex gap-3 items-center">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center border-2"
                  style={{
                    background: `color-mix(in oklch, ${catData.color} 15%, transparent)`,
                    borderColor: catData.color,
                  }}
                >
                  {catData.icon}
                </div>

                <div>
                  <div className="font-semibold">{expense.category}</div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(expense.date).toLocaleDateString('en-IN')}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div
                  className={`font-bold font-mono text-lg ${
                    expense.type === 'income'
                      ? 'text-emerald-400'
                      : 'text-destructive'
                  }`}
                >
                  {expense.type === 'income' ? '+' : '-'}₹
                  {expense.amount.toLocaleString('en-IN')}
                </div>

                <button
                  onClick={() => onDelete(expense.id)}
                  className="p-2 rounded-lg hover:bg-destructive/10 transition"
                >
                  <X className="w-4 h-4 text-destructive" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}