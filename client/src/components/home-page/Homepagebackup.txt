'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Wallet,
  Plus,
  X,
  TrendingDown,
  Tag,
  FileText,
  PieChart,
  ChevronDown
} from 'lucide-react';

import { CATEGORY_META } from '@/lib/category-meta';
import type { CategoryName } from '@/lib/category-meta';
import { CATEGORY_ID_MAP } from '@/lib/category-map-id';
import { addTransaction } from '@/actions/transactions';
import { deleteTransaction } from '@/actions/delete-transaction';
import { getTransactions } from '@/actions/get-transactions';
import { useSession } from 'next-auth/react';

/* =======================
   Types
======================= */

type Expense = {
  id: number;
  amount: number;
  category: CategoryName;
  note?: string;
  date: string;
  type: 'expense' | 'income';
  recurring?: boolean;
};

type FormData = {
  amount: string;
  category: CategoryName;
  note: string;
  date: string;
  type: 'expense' | 'income';
  recurring?: boolean;
};

/* =======================
   Component
======================= */

export default function HomePage() {
const { data: session } = useSession();
const [expenses, setExpenses] = useState<Expense[]>([]);
const [showAddModal, setShowAddModal] = useState(false);
const [filter, setFilter] = useState<'all' | CategoryName>('all');
const [showMenu, setShowMenu] = useState(false);
const menuRef = useRef<HTMLDivElement>(null);
const [showPaymentModal, setShowPaymentModal] = useState(false);
const [selectedPaymentMethod, setSelectedPaymentMethod] =
  useState<"gpay" | "phonepe" | "paytm" | null>(null);


const [selectedMonth, setSelectedMonth] = useState(() => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
});


  const [formData, setFormData] = useState<FormData>({
    amount: '',
    category: 'Food',
    note: '',
    date: new Date().toISOString().split('T')[0],
    type: 'expense',
  });

  /* =======================
     Load Transactions
  ======================= */

        useEffect(() => {
            if (!session?.user?.id) return;
    const loadTransactions = async () => {
      try {
        const data = await getTransactions(session.user.id);

        const mapped: Expense[] = data.map((t: any) => {
          const categoryName =
            (Object.keys(CATEGORY_ID_MAP).find(
              key =>
                CATEGORY_ID_MAP[key as CategoryName] === t.categoryId
            ) as CategoryName) ?? 'Food';

          return {
            id: t.id,
            amount: Number(t.amount),
            category: categoryName,
            note: t.note ?? '',
            date: new Date(t.transactionDate).toISOString(),
            type: t.type,
            recurring: t.isRecurring ?? false,
          };
        });

        setExpenses(mapped);
      } catch (error) {
        console.error('Failed to load transactions:', error);
      }
    };

    loadTransactions();
  }, [session?.user?.id]);

  useEffect(() => {
  function handleClickOutside(event: MouseEvent) {
    if (
      menuRef.current &&
      !menuRef.current.contains(event.target as Node)
    ) {
      setShowMenu(false);
    }
  }

  if (showMenu) {
    document.addEventListener("mousedown", handleClickOutside);
  }

  return () => {
    document.removeEventListener("mousedown", handleClickOutside);
  };
}, [showMenu]);

  /* =======================
     Derived Categories
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
   PAYMENT GATEWAY (RAZORPAY)
======================= */

const handlePay = (method: "gpay" | "phonepe" | "paytm") => {

  if (!formData.amount) {
    alert("Enter amount first");
    return;
  }

  setSelectedPaymentMethod(method);

  const upiId = "merchant@upi";
  const name = "Merchant";
  const amount = formData.amount;
  const note = formData.note || formData.category;

  const upiLink =
    `upi://pay?pa=${upiId}&pn=${name}&am=${amount}&cu=INR&tn=${note}`;

  setShowPaymentModal(false);

  window.location.href = upiLink;

};



  /* =======================
     Actions
  ======================= */

  const addExpense = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!session?.user?.id) {
      alert('Not authenticated');
      return;
    }

    try {
      const inserted = await addTransaction({
        categoryId: CATEGORY_ID_MAP[formData.category],
        amount: parseFloat(formData.amount),
        type: formData.type,
        note: formData.note,
        date: formData.date,
        isRecurring: Boolean(formData.recurring),

      });

      const newExpense: Expense = {
        id: inserted.id,
        amount: Number(inserted.amount),
        category: formData.category,
        note: inserted.note ?? '',
        date: new Date(inserted.transactionDate).toISOString(),
        type: inserted.type as "expense" | "income",
        recurring: inserted.isRecurring ?? false,
      };

      setExpenses(prev => [newExpense, ...prev]);

      setFormData({
        amount: '',
        category: 'Food',
        note: '',
        date: new Date().toISOString().split('T')[0],
        type: formData.type,
      });

      setShowAddModal(false);
    } catch (error) {
      console.error('Insert failed:', error);
    }
  };

  const deleteExpense = async (id: number) => {
    try {
      await deleteTransaction(id);
      setExpenses(prev => prev.filter(e => e.id !== id));
    } catch (error) {
      console.error('Delete failed:', error);
    }
  };
/* =======================
   MARKS PAID TRANSACTIONS - TO BE IMPLEMENTED
======================= */
const markAsPaid = async () => {

  if (!selectedPaymentMethod) {
    alert("Complete payment first");
    return;
  }

  const inserted = await addTransaction({

    categoryId: CATEGORY_ID_MAP[formData.category],

    amount: parseFloat(formData.amount),

    type: formData.type,

    note: formData.note,

    date: formData.date,

    paymentMethod: selectedPaymentMethod,

  });

  const newExpense: Expense = {

    id: inserted.id,

    amount: Number(inserted.amount),

    category: formData.category,

    note: inserted.note ?? "",

    date: new Date(inserted.transactionDate).toISOString(),

    type: inserted.type as "expense" | "income",

  };

  setExpenses(prev => [newExpense, ...prev]);

  setShowAddModal(false);

};

  /* =======================
     Calculations
  ======================= */

  const totalExpenses = expenses
    .filter(e => e.type === 'expense')
    .reduce((s, e) => s + e.amount, 0);

  const totalIncome = expenses
    .filter(e => e.type === 'income')
    .reduce((s, e) => s + e.amount, 0);

  const leftInWallet = totalIncome - totalExpenses;

  const filteredExpenses =
    filter === 'all'
      ? expenses
      : expenses.filter(e => e.category === filter);

  const categoryTotals = categories
    .map(cat => ({
      ...cat,
      total: expenses
        .filter(
          e =>
            e.type === 'expense' &&
            e.category === cat.name
        )
        .reduce((sum, e) => sum + e.amount, 0),
    }))
    .filter(c => c.total > 0);

  const getCategoryData = (category: CategoryName) => {
    const meta = CATEGORY_META[category];
    return {
      icon: meta.icon,
      color: meta.color,
    };
  };

  

  return (
  <div className="min-h-screen bg-background text-foreground pb-24 sm:pb-0">

    {/* ================= HEADER ================= */}
    <div className="sticky top-0 z-20 bg-card/95 border-b border-border backdrop-blur-sm">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">

        {/* Logo Section */}
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary text-primary-foreground rounded-lg flex items-center justify-center shadow-md">
            <Wallet className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div>
            <h1 className="text-lg sm:text-2xl font-bold">Expense Wallet</h1>
            <p className="text-xs sm:text-sm text-muted-foreground font-mono hidden sm:block">
              Track every rupee
            </p>
          </div>
        </div>

       {/* Profile + Dropdown */}
        <div ref={menuRef} className="relative flex items-center gap-2">

        {/* Profile Image */}
        <img
            src={session?.user?.image ?? "/avatar.png"}
            alt="profile"
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-full border border-border"
        />

        {/* Chevron Button */}
        <button
            onClick={() => setShowMenu(prev => !prev)}
            className="p-1 rounded-md hover:bg-accent transition-colors"
        >
            <ChevronDown
            className={`w-4 h-4 text-muted-foreground transition-transform ${
                showMenu ? "rotate-180" : ""
            }`}
            />
        </button>

        {/* Dropdown */}
        {showMenu && (
            <div className="absolute right-0 top-12 w-44 bg-card border border-border rounded-lg shadow-lg z-50 animate-in fade-in zoom-in-95 duration-150">

            <button
                onClick={() => setShowMenu(false)}
                className="w-full text-left px-4 py-2 text-sm hover:bg-accent"
            >
                This Month
            </button>

            <button
                onClick={() => setShowMenu(false)}
                className="w-full text-left px-4 py-2 text-sm hover:bg-accent"
            >
                Settings
            </button>

            <button
                onClick={() => setShowMenu(false)}
                className="w-full text-left px-4 py-2 text-sm hover:bg-accent text-destructive"
            >
                Logout
            </button>

            </div>
        )}
        </div>

      </div>
    </div>

    {/* ================= MAIN ================= */}
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">

     {/* Desktop Dashboard Header */}
        <div className="hidden sm:flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
            <h2 className="text-lg font-semibold">Dashboard</h2>

            {/* Month Selector */}
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


      {/* ================= STATS ================= */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        
        {/* Income */}
        <div className="bg-card rounded-lg p-4 sm:p-6 border border-border shadow-sm">
          <span className="text-xs uppercase tracking-wider text-muted-foreground">
            Income
          </span>
          <div className="text-xl sm:text-3xl font-bold font-mono text-emerald-400 mt-2">
            ₹{totalIncome.toLocaleString('en-IN')}
          </div>
        </div>

        {/* Spent */}
        <div className="bg-card rounded-lg p-4 sm:p-6 border border-border shadow-sm">
          <span className="text-xs uppercase tracking-wider text-muted-foreground">
            Total Spent
          </span>
          <div className="text-xl sm:text-3xl font-bold font-mono mt-2">
            ₹{totalExpenses.toLocaleString('en-IN')}
          </div>
        </div>

        {/* Balance */}
        <div className="bg-card rounded-lg p-4 sm:p-6 border border-border shadow-sm">
          <span className="text-xs uppercase tracking-wider text-muted-foreground">
            Balance
          </span>
          <div className={`text-xl sm:text-3xl font-bold font-mono mt-2 ${
            leftInWallet >= 0 ? 'text-emerald-400' : 'text-destructive'
          }`}>
            ₹{leftInWallet.toLocaleString('en-IN')}
          </div>
        </div>

        {/* Top Category */}
        <div className="bg-card rounded-lg p-4 sm:p-6 border border-border shadow-sm">
          <span className="text-xs uppercase tracking-wider text-muted-foreground">
            Top Category
          </span>
          <div className="text-lg sm:text-2xl font-semibold mt-2">
            {categoryTotals.length > 0
              ? categoryTotals.reduce((max, cat) =>
                  cat.total > max.total ? cat : max,
                categoryTotals[0]).name
              : "None"}
          </div>
        </div>
      </div>

      {/* ================= CATEGORY BREAKDOWN ================= */}
      {categoryTotals.length > 0 && (
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
      )}

      {/* ================= FILTERS ================= */}
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
            style={
              filter === cat.name
                ? { background: cat.color }
                : {}
            }
          >
            {cat.icon} {cat.name}
          </button>
        ))}
      </div>

      {/* ================= TRANSACTIONS ================= */}
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

            {/* Amount */}
            <div
                className={`font-bold font-mono text-lg ${
                expense.type === "income"
                    ? "text-emerald-400"
                    : "text-destructive"
                }`}
            >
                {expense.type === "income" ? "+" : "-"}₹
                {expense.amount.toLocaleString("en-IN")}
            </div>

            {/* Delete Button */}
            <button
                onClick={() => deleteExpense(expense.id)}
                className="p-2 rounded-lg hover:bg-destructive/10 transition"
            >
                <X className="w-4 h-4 text-destructive" />
            </button>

            </div>

            </div>
          );
        })}
      </div>
    </div>

    {/* ================= MOBILE FAB ================= */}
    <button
      onClick={() => setShowAddModal(true)}
      className="fixed bottom-6 right-6 sm:hidden bg-primary text-primary-foreground w-14 h-14 rounded-full flex items-center justify-center shadow-lg z-50"
    >
      <Plus className="w-6 h-6" />
    </button>
    
    {/* ================= ADD EXPENSE MODAL ================= */}
{showAddModal && (
  <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">

    <div className="bg-card rounded-xl p-6 sm:p-8 max-w-md w-full border border-border shadow-xl">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl sm:text-2xl font-bold">
          Add Transaction
        </h2>

        <button
          onClick={() => setShowAddModal(false)}
          className="p-2 hover:bg-accent rounded-lg transition"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Form */}
      <form onSubmit={addExpense} className="space-y-5">

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
              setFormData({
                ...formData,
                amount: e.target.value,
              })
            }
            className="w-full bg-secondary border border-border rounded-lg px-4 py-3 text-lg font-mono focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        {/* Type toggle */}
        <div>
          <label className="text-sm text-muted-foreground mb-2 block">
            Type
          </label>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() =>
                setFormData({
                  ...formData,
                  type: "expense",
                  category: "Food",
                })
              }
              className={`flex-1 py-2 rounded-lg border transition ${
                formData.type === "expense"
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-secondary border-border"
              }`}
            >
              Expense
            </button>

            <button
              type="button"
              onClick={() =>
                setFormData({
                  ...formData,
                  type: "income",
                  category: "Regular Income",
                })
              }
              className={`flex-1 py-2 rounded-lg border transition ${
                formData.type === "income"
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-secondary border-border"
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
            {(formData.type === "expense"
              ? categories
              : incomeCategories
            ).map((cat) => (
              <button
                key={cat.name}
                type="button"
                onClick={() =>
                  setFormData({
                    ...formData,
                    category: cat.name,
                  })
                }
                className={`p-3 rounded-lg border flex items-center gap-2 transition ${
                  formData.category === cat.name
                    ? "text-white border-transparent"
                    : "bg-secondary border-border"
                }`}
                style={
                  formData.category === cat.name
                    ? { background: cat.color }
                    : {}
                }
              >
                <span className="text-lg">
                  {cat.icon}
                </span>

                <span className="text-sm font-medium">
                  {cat.name}
                </span>
              </button>
            ))}
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
              setFormData({
                ...formData,
                date: e.target.value,
              })
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
              setFormData({
                ...formData,
                note: e.target.value,
              })
            }
            className="w-full bg-secondary border border-border rounded-lg px-4 py-3"
          />
        </div>

        {/* Submit */}
        <button
          type="submit"
          className="w-full bg-primary text-primary-foreground py-3 rounded-lg font-semibold hover:opacity-90 transition"
        >
         Add Manually</button>

    <div className="flex gap-3">


 <button
  type="button"
  onClick={() => setShowPaymentModal(true)}
  className="flex-1 bg-emerald-500 text-white py-3 rounded-md font-semibold"
>
  Pay Now
</button>


</div>

      </form>

    </div>
    
  </div>
)}
{showPaymentModal && (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">

    <div className="bg-card p-6 rounded-xl w-full max-w-sm">

      <h2 className="text-lg font-bold mb-4">
        Choose Payment Method
      </h2>

      <div className="space-y-3">

        <button
          onClick={() => handlePay("gpay")}
          className="w-full bg-white text-black py-3 rounded-lg font-semibold"
        >
          Pay via GPay
        </button>

        <button
          onClick={() => handlePay("phonepe")}
          className="w-full bg-purple-600 text-white py-3 rounded-lg font-semibold"
        >
          Pay via PhonePe
        </button>

        <button
          onClick={() => handlePay("paytm")}
          className="w-full bg-blue-500 text-white py-3 rounded-lg font-semibold"
        >
          Pay via Paytm
        </button>

      </div>

      {/* THIS IS IMPORTANT */}
      <button
        onClick={markAsPaid}
        className="mt-4 w-full bg-emerald-500 text-white py-3 rounded-lg font-semibold"
      >
        Mark as Paid
      </button>

      <button
        onClick={() => setShowPaymentModal(false)}
        className="mt-2 w-full border py-2 rounded-lg"
      >
        Cancel
      </button>

    </div>

  </div>
)}



  </div>
);

}