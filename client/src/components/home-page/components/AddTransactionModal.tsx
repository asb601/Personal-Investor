import { X } from 'lucide-react';
import type { FormData } from '../types';
import type { CategoryName } from '@/lib/category-meta';

type CategoryMeta = {
  name: CategoryName;
  icon: string;
  color: string;
};

type Props = {
  formData: FormData;
  setFormData: React.Dispatch<React.SetStateAction<FormData>>;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  onClose: () => void;
  onPayNow: () => void;
  categories: CategoryMeta[];
  incomeCategories: CategoryMeta[];
};

export function AddTransactionModal({
  formData,
  setFormData,
  onSubmit,
  onClose,
  onPayNow,
  categories,
  incomeCategories,
}: Props) {
  return (
    <div
      className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <form
        onSubmit={onSubmit}
        className="bg-card w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl border border-border shadow-xl"
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-2.5 sm:hidden">
          <div className="w-8 h-1 rounded-full bg-border" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-4 pt-2 pb-2 border-b border-border">
          <h2 className="text-sm font-semibold text-muted-foreground">New Transaction</h2>
          <button type="button" onClick={onClose} className="p-1 hover:bg-accent rounded-md transition">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-4 py-3 space-y-3">

          {/* Amount — big and prominent */}
          <input
            type="number"
            required
            step="0.01"
            placeholder="₹ 0.00"
            value={formData.amount}
            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
            className="w-full bg-secondary border border-border rounded-xl px-4 py-3 text-2xl font-bold font-mono focus:outline-none focus:ring-2 focus:ring-primary"
          />

          {/* Type — small segmented control */}
          <div className="flex bg-secondary rounded-lg p-0.5 gap-0.5">
            <button
              type="button"
              onClick={() => setFormData({ ...formData, type: 'expense', category: 'Food' })}
              className={`flex-1 py-1.5 rounded-md text-xs font-semibold transition ${
                formData.type === 'expense'
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground'
              }`}
            >
              Expense
            </button>
            <button
              type="button"
              onClick={() => setFormData({ ...formData, type: 'income', category: 'Regular Income' })}
              className={`flex-1 py-1.5 rounded-md text-xs font-semibold transition ${
                formData.type === 'income'
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground'
              }`}
            >
              Income
            </button>
          </div>

          {/* Category — compact horizontal scroll */}
          <div
            className="flex gap-1.5 overflow-x-auto -mx-4 px-4"
            style={{ scrollbarWidth: 'none' }}
          >
            {(formData.type === 'expense' ? categories : incomeCategories).map((cat) => (
              <button
                key={cat.name}
                type="button"
                onClick={() => setFormData({ ...formData, category: cat.name })}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-full border text-xs font-medium shrink-0 transition ${
                  formData.category === cat.name
                    ? 'text-white border-transparent'
                    : 'bg-secondary border-border text-foreground'
                }`}
                style={formData.category === cat.name ? { background: cat.color } : {}}
              >
                <span className="text-sm">{cat.icon}</span>
                <span>{cat.name}</span>
              </button>
            ))}
          </div>

          {/* Date + Note — inline row */}
          <div className="flex gap-2">
            <input
              type="date"
              required
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className="flex-1 bg-secondary border border-border rounded-lg px-3 py-2 text-xs"
            />
            <input
              type="text"
              placeholder="Note (optional)"
              value={formData.note}
              onChange={(e) => setFormData({ ...formData, note: e.target.value })}
              className="flex-1 bg-secondary border border-border rounded-lg px-3 py-2 text-xs"
            />
          </div>

        </div>

        {/* Footer buttons */}
        <div className="px-4 pb-6 pt-1 flex gap-2">
          <button
            type="button"
            onClick={onPayNow}
            className="flex-1 bg-emerald-500 text-white py-2.5 rounded-xl font-semibold text-sm"
          >
            Pay Now
          </button>
          <button
            type="submit"
            className="flex-1 bg-primary text-primary-foreground py-2.5 rounded-xl font-semibold text-sm"
          >
            Add Manually
          </button>
        </div>

      </form>
    </div>
  );
}