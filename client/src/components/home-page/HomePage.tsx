'use client';

import React, { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { CATEGORY_META } from '@/lib/category-meta';
import type { CategoryName } from '@/lib/category-meta';
import type { FormData } from './types';

import { useTransactions } from './hooks/useTransactions';
import { Header } from './components/Header';
import { StatsBar } from './components/StatsBar';
import { CategoryBreakdown } from './components/CategoryBreakdown';
import { TransactionList } from './components/TransactionList';
import { AddTransactionModal } from './components/AddTransactionModal';
import { PaymentModal } from './components/PaymentModal';

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
   Component
======================= */

export default function HomePage() {
  const { status } = useSession();
  const router = useRouter();
  const { expenses, addExpense, deleteExpense, markAsPaid } = useTransactions();

  const [showAddModal, setShowAddModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [filter, setFilter] = useState<'all' | CategoryName>('all');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<
    'gpay' | 'phonepe' | 'paytm' | null
  >(null);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  const [formData, setFormData] = useState<FormData>({
    amount: '',
    category: 'Food',
    note: '',
    date: new Date().toISOString().split('T')[0],
    type: 'expense',
  });

  /* =======================
     Session Guard
  ======================= */

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/login');
    }
  }, [status, router]);

  if (status === 'loading' || status === 'unauthenticated') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  /* =======================
     Calculations
  ======================= */

  const totalExpenses = expenses
    .filter((e) => e.type === 'expense')
    .reduce((s, e) => s + e.amount, 0);

  const totalIncome = expenses
    .filter((e) => e.type === 'income')
    .reduce((s, e) => s + e.amount, 0);

  const leftInWallet = totalIncome - totalExpenses;

  const categoryTotals = categories
    .map((cat) => ({
      ...cat,
      total: expenses
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

  const upiId = 'merchant@upi';
  const name = 'Merchant';
  const amount = formData.amount;
  const note = formData.note || formData.category;

  await markAsPaid(formData, method);

  const upiLinks = {
    gpay: `tez://upi/pay?pa=${upiId}&pn=${name}&am=${amount}&cu=INR&tn=${note}`,
    phonepe: `phonepe://pay?pa=${upiId}&pn=${name}&am=${amount}&cu=INR&tn=${note}`,
    paytm: `paytmmp://pay?pa=${upiId}&pn=${name}&am=${amount}&cu=INR&tn=${note}`,
  };

  window.location.href = upiLinks[method];
};

  /* =======================
     Render
  ======================= */

  return (
    <div className="min-h-screen bg-background text-foreground pb-24 sm:pb-0">

      <Header />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">

        {/* Desktop Dashboard Header */}
        <div className="hidden sm:flex justify-between items-center mb-6">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-semibold">Dashboard</h2>
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-secondary border border-border rounded-md px-3 py-2 text-sm"
            />
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="bg-primary text-primary-foreground px-6 py-3 rounded-lg font-semibold flex items-center gap-2 hover:opacity-90 transition-all shadow-sm"
          >
            <Plus className="w-5 h-5" />
            Add Expense
          </button>
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
          expenses={expenses}
          filter={filter}
          setFilter={setFilter}
          categories={categories}
          onDelete={deleteExpense}
        />

      </div>

      {/* Mobile FAB */}
      <button
        onClick={() => setShowAddModal(true)}
        className="fixed bottom-6 right-6 sm:hidden bg-primary text-primary-foreground w-14 h-14 rounded-full flex items-center justify-center shadow-lg z-50"
      >
        <Plus className="w-6 h-6" />
      </button>

      {showAddModal && (
        <AddTransactionModal
          formData={formData}
          setFormData={setFormData}
          onSubmit={handleAddExpense}
          onClose={() => setShowAddModal(false)}
          onPayNow={() => setShowPaymentModal(true)}
          categories={categories}
          incomeCategories={incomeCategories}
        />
      )}

      {showPaymentModal && (
        <PaymentModal
          onPay={handlePay}
          onClose={() => setShowPaymentModal(false)}
        />
      )}

    </div>
  );
}