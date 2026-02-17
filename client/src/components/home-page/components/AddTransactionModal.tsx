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
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="bg-card rounded-xl p-6 sm:p-8 max-w-md w-full border border-border shadow-xl">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl sm:text-2xl font-bold">Add Transaction</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-accent rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={onSubmit} className="space-y-5">

          {/* Amount */}
          <div>
            <label className="text-sm text-muted-foreground mb-2 block">
              Amount
            </label>
            <input
              type="number"
              required
              step="0.01"
              placeholder="₹ 0.00"
              value={formData.amount}
              onChange={(e) =>
                setFormData({ ...formData, amount: e.target.value })
              }
              className="w-full bg-secondary border border-border rounded-lg px-4 py-3 text-lg font-mono focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* Type Toggle */}
          <div>
            <label className="text-sm text-muted-foreground mb-2 block">
              Type
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() =>
                  setFormData({ ...formData, type: 'expense', category: 'Food' })
                }
                className={`flex-1 py-2 rounded-lg border transition ${
                  formData.type === 'expense'
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-secondary border-border'
                }`}
              >
                Expense
              </button>

              <button
                type="button"
                onClick={() =>
                  setFormData({
                    ...formData,
                    type: 'income',
                    category: 'Regular Income',
                  })
                }
                className={`flex-1 py-2 rounded-lg border transition ${
                  formData.type === 'income'
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-secondary border-border'
                }`}
              >
                Income
              </button>
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="text-sm text-muted-foreground mb-2 block">
              Category
            </label>
            <div className="grid grid-cols-2 gap-2">
              {(formData.type === 'expense' ? categories : incomeCategories).map(
                (cat) => (
                  <button
                    key={cat.name}
                    type="button"
                    onClick={() =>
                      setFormData({ ...formData, category: cat.name })
                    }
                    className={`p-3 rounded-lg border flex items-center gap-2 transition ${
                      formData.category === cat.name
                        ? 'text-white border-transparent'
                        : 'bg-secondary border-border'
                    }`}
                    style={
                      formData.category === cat.name
                        ? { background: cat.color }
                        : {}
                    }
                  >
                    <span className="text-lg">{cat.icon}</span>
                    <span className="text-sm font-medium">{cat.name}</span>
                  </button>
                )
              )}
            </div>
          </div>

          {/* Date */}
          <div>
            <label className="text-sm text-muted-foreground mb-2 block">
              Date
            </label>
            <input
              type="date"
              required
              value={formData.date}
              onChange={(e) =>
                setFormData({ ...formData, date: e.target.value })
              }
              className="w-full bg-secondary border border-border rounded-lg px-4 py-3"
            />
          </div>

          {/* Note */}
          <div>
            <label className="text-sm text-muted-foreground mb-2 block">
              Note
            </label>
            <input
              type="text"
              placeholder="Optional note"
              value={formData.note}
              onChange={(e) =>
                setFormData({ ...formData, note: e.target.value })
              }
              className="w-full bg-secondary border border-border rounded-lg px-4 py-3"
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            className="w-full bg-primary text-primary-foreground py-3 rounded-lg font-semibold hover:opacity-90 transition"
          >
            Add Manually
          </button>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onPayNow}
              className="flex-1 bg-emerald-500 text-white py-3 rounded-md font-semibold"
            >
              Pay Now
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}