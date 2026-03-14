'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Plus, CalendarDays, X, Download, Upload } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CATEGORY_META } from '@/lib/category-meta';
import type { CategoryName } from '@/lib/category-meta';
import type { FormData } from './types';

import { useTransactions } from './hooks/useTransactions';
import { StatsBar } from './components/StatsBar';
import { CategoryBreakdown } from './components/CategoryBreakdown';
import { TransactionList } from './components/TransactionList';
import { AddTransactionModal } from './components/AddTransactionModal';
import { PaymentModal } from './components/PaymentModal';
import { ImportModal } from './components/ImportModal';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { getCards, type CardData } from '@/actions/cards';

/* =======================
   Derived category lists
======================= */

const categories = Object.entries(CATEGORY_META)
  .filter(([, v]) => v.type === 'expense')
  .map(([name, meta]) => ({
    name: name as CategoryName,
    icon: meta.icon,
    color: meta.color,
  }));

const incomeCategories = Object.entries(CATEGORY_META)
  .filter(([, v]) => v.type === 'income')
  .map(([name, meta]) => ({
    name: name as CategoryName,
    icon: meta.icon,
    color: meta.color,
  }));

/* =======================
   Helpers
======================= */

/** Format "2026-03" → "Mar 2026" */
function formatMonthLabel(ym: string) {
  const [y, m] = ym.split('-').map(Number);
  const d = new Date(y, m - 1);
  return d.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
}

/** Format "2026-03-14" → "14 Mar 2026" */
function formatDateLabel(ymd: string) {
  const [y, m, d] = ymd.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

/* =======================
   Component
======================= */

export default function HomePage() {
  const { expenses, addExpense, deleteExpense, markAsPaid, confirmExpense, bulkImport } = useTransactions();

  const [cards, setCards] = useState<CardData[]>([]);
  useEffect(() => {
    getCards().then(setCards).catch(console.error);
  }, []);

  const [showAddModal, setShowAddModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [filter, setFilter] = useState<'all' | CategoryName>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'expense' | 'income'>('all');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<
    'gpay' | 'phonepe' | 'paytm' | null
  >(null);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [calendarOpen, setCalendarOpen] = useState(false);

  const [formData, setFormData] = useState<FormData>({
    amount: '',
    category: 'Food',
    note: '',
    date: new Date().toISOString().split('T')[0],
    type: 'expense',
  });

  /* =======================
     Filtered expenses (date or month)
  ======================= */

  const filteredExpenses = useMemo(() => {
    let result = expenses;

    // Date or month filter
    if (selectedDate) {
      const [year, month, day] = selectedDate.split('-').map(Number);
      result = result.filter((e) => {
        if (!e.date) return false;
        const d = new Date(e.date);
        return d.getFullYear() === year && d.getMonth() + 1 === month && d.getDate() === day;
      });
    } else {
      const [year, month] = selectedMonth.split('-').map(Number);
      result = result.filter((e) => {
        if (!e.date) return false;
        const d = new Date(e.date);
        return d.getFullYear() === year && d.getMonth() + 1 === month;
      });
    }

    // Type filter
    if (typeFilter !== 'all') {
      result = result.filter((e) => e.type === typeFilter);
    }

    return result;
  }, [expenses, selectedMonth, selectedDate, typeFilter]);

  /* =======================
     Calculations (from filtered set)
  ======================= */

  const totalExpenses = filteredExpenses
    .filter((e) => e.type === 'expense')
    .reduce((s, e) => s + e.amount, 0);

  const totalIncome = filteredExpenses
    .filter((e) => e.type === 'income')
    .reduce((s, e) => s + e.amount, 0);

  const leftInWallet = totalIncome - totalExpenses;

  const categoryTotals = categories
    .map((cat) => ({
      ...cat,
      total: filteredExpenses
        .filter((e) => e.type === 'expense' && e.category === cat.name)
        .reduce((sum, e) => sum + e.amount, 0),
    }))
    .filter((c) => c.total > 0);

  /* =======================
     Handlers
  ======================= */

  const handleAddExpense = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    await addExpense(formData, () => {
      setFormData({
        amount: '',
        category: 'Food',
        note: '',
        date: new Date().toISOString().split('T')[0],
        type: formData.type,
      });
      setShowAddModal(false);
    });
  };

  const handlePay = async (method: 'gpay' | 'phonepe' | 'paytm') => {
    if (!formData.amount) {
      alert('Enter amount first');
      return;
    }

    setSelectedPaymentMethod(method);

    await markAsPaid(formData, method);

    setFormData({
      amount: '',
      category: 'Food',
      note: '',
      date: new Date().toISOString().split('T')[0],
      type: formData.type,
    });
    setShowPaymentModal(false);
    setShowAddModal(false);
  };

  /* =======================
     Export CSV
  ======================= */

  const handleExport = () => {
    const rows = filteredExpenses.map((e) => ({
      Date: e.date ? new Date(e.date).toLocaleDateString('en-IN') : '',
      Type: e.type,
      Category: e.category,
      Amount: e.amount,
      Note: e.note ?? '',
      Status: e.paymentStatus,
    }));
    const header = Object.keys(rows[0] ?? {}).join(',');
    const csv = [
      header,
      ...rows.map((r) => Object.values(r).map((v) => `"${v}"`).join(',')),
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transactions-${selectedDate ?? selectedMonth}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  /* =======================
     Render
  ======================= */

  return (
    <div className="px-4 sm:px-6 py-4 sm:py-6">

        {/* ===== Toolbar ===== */}
        <div className="flex items-center justify-between mb-5 gap-2 flex-wrap">
          {/* Left group — date picker + type toggle */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Date / Month picker */}
            <div className="inline-flex items-center gap-1">
              <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                <PopoverTrigger asChild>
                  <button
                    className={cn(
                      'inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-sm font-medium transition-colors',
                      'bg-secondary/50 hover:bg-accent text-foreground'
                    )}
                  >
                    <CalendarDays className="w-4 h-4 text-muted-foreground" />
                    {selectedDate ? formatDateLabel(selectedDate) : formatMonthLabel(selectedMonth)}
                  </button>
                </PopoverTrigger>
                <PopoverContent align="start" className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={(() => {
                      if (selectedDate) {
                        const [y, m, d] = selectedDate.split('-').map(Number);
                        return new Date(y, m - 1, d);
                      }
                      return undefined;
                    })()}
                    onSelect={(date) => {
                      if (date) {
                        const ym = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                        const ymd = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
                        setSelectedMonth(ym);
                        setSelectedDate(ymd);
                        setCalendarOpen(false);
                      }
                    }}
                    disabled={{ after: new Date() }}
                    defaultMonth={(() => {
                      const [y, m] = selectedMonth.split('-').map(Number);
                      return new Date(y, m - 1);
                    })()}
                  />
                </PopoverContent>
              </Popover>

              {selectedDate && (
                <button
                  onClick={() => setSelectedDate(null)}
                  className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                  title="Show full month"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Type toggle — All / Expense / Income */}
            <div className="inline-flex rounded-lg border border-border overflow-hidden">
              {(['all', 'expense', 'income'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTypeFilter(t)}
                  className={cn(
                    'px-3 py-2 text-xs font-medium transition-colors capitalize',
                    typeFilter === t
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary/50 text-muted-foreground hover:text-foreground hover:bg-accent'
                  )}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Right group — Export, Import, Add */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleExport}
              disabled={filteredExpenses.length === 0}
              className="p-2 rounded-lg border border-border bg-secondary/50 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              title="Export CSV"
            >
              <Download className="w-4 h-4" />
            </button>

            <button
              onClick={() => setShowImportModal(true)}
              className="p-2 rounded-lg border border-border bg-secondary/50 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              title="Import bank statement"
            >
              <Upload className="w-4 h-4" />
            </button>

            <button
              onClick={() => setShowAddModal(true)}
              className="bg-primary text-primary-foreground px-4 py-2 sm:px-5 sm:py-2.5 rounded-lg text-sm font-medium flex items-center gap-2 hover:opacity-90 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Add Expense</span>
              <span className="sm:hidden">Add</span>
            </button>
          </div>
        </div>

        <StatsBar
          totalIncome={totalIncome}
          totalExpenses={totalExpenses}
          leftInWallet={leftInWallet}
          categoryTotals={categoryTotals}
        />

        <CategoryBreakdown
          categoryTotals={categoryTotals}
          totalExpenses={totalExpenses}
        />

        <TransactionList
          expenses={filteredExpenses}
          filter={filter}
          setFilter={setFilter}
          categories={categories}
          onDelete={deleteExpense}
          onConfirm={confirmExpense}
        />

      {showAddModal && (
        <AddTransactionModal
          formData={formData}
          setFormData={setFormData}
          onSubmit={handleAddExpense}
          onClose={() => setShowAddModal(false)}
          onPayNow={() => setShowPaymentModal(true)}
          categories={categories}
          incomeCategories={incomeCategories}
          cards={cards}
        />
      )}

      {showPaymentModal && (
        <PaymentModal
          amount={formData.amount}
          onPay={handlePay}
          onClose={() => setShowPaymentModal(false)}
        />
      )}

      {showImportModal && (
        <ImportModal
          onClose={() => setShowImportModal(false)}
          onImport={bulkImport}
        />
      )}

    </div>
  );
}