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
    /* Backdrop */
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      {/* Bottom sheet on mobile, centered modal on desktop */}
      <form
        onSubmit={onSubmit}
        className="bg-card w-full sm:max-w-md rounded-t-2xl sm:rounded-xl border border-border shadow-xl flex flex-col max-h-[92dvh] sm:max-h-[88vh]"
      >

        {/* Drag handle — mobile only */}
        <div className="flex justify-center pt-3 pb-1 sm:hidden shrink-0">
          <div className="w-10 h-1 rounded-full bg-border" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-3 pb-3 border-b border-border shrink-0">
          <h2 className="text-base font-bold">Add Transaction</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 hover:bg-accent rounded-lg transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="overflow-y-auto flex-1 px-5 py-4 space-y-4">

          {/* Row 1: Amount */}
          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block">Amount</label>
            <input
              type="number"
              required
              step="0.01"
              placeholder="₹ 0.00"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              className="w-full bg-secondary border border-border rounded-lg px-3 py-2.5 text-base font-mono focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* Row 2: Type toggle */}
          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block">Type</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, type: 'expense', category: 'Food' })}
                className={`py-2 rounded-lg border text-sm font-medium transition ${
                  formData.type === 'expense'
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-secondary border-border'
                }`}
              >
                Expense
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, type: 'income', category: 'Regular Income' })}
                className={`py-2 rounded-lg border text-sm font-medium transition ${
                  formData.type === 'income'
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-secondary border-border'
                }`}
              >
                Income
              </button>
            </div>
          </div>

          {/* Row 3: Category — horizontal scroll */}
          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block">Category</label>
            <div className="flex gap-2 overflow-x-auto pb-1 -mx-5 px-5"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {(formData.type === 'expense' ? categories : incomeCategories).map((cat) => (
                <button
                  key={cat.name}
                  type="button"
                  onClick={() => setFormData({ ...formData, category: cat.name })}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border whitespace-nowrap text-sm font-medium shrink-0 transition ${
                    formData.category === cat.name
                      ? 'text-white border-transparent'
                      : 'bg-secondary border-border text-foreground'
                  }`}
                  style={formData.category === cat.name ? { background: cat.color } : {}}
                >
                  <span className="text-base">{cat.icon}</span>
                  <span>{cat.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Row 4: Date + Note side by side */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">Date</label>
              <input
                type="date"
                required
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full bg-secondary border border-border rounded-lg px-3 py-2.5 text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">Note</label>
              <input
                type="text"
                placeholder="Optional"
                value={formData.note}
                onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                className="w-full bg-secondary border border-border rounded-lg px-3 py-2.5 text-sm"
              />
            </div>
          </div>

        </div>

        {/* Sticky footer — always visible */}
        <div className="px-5 py-4 border-t border-border grid grid-cols-2 gap-3 shrink-0">
          <button
            type="button"
            onClick={onPayNow}
            className="bg-emerald-500 text-white py-3 rounded-xl font-semibold text-sm hover:opacity-90 transition"
          >
            Pay Now
          </button>
          <button
            type="submit"
            className="bg-primary text-primary-foreground py-3 rounded-xl font-semibold text-sm hover:opacity-90 transition"
          >
            Add Manually
          </button>
        </div>

      </form>
    </div>
  );
}