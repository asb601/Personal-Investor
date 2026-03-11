'use client';

import { useState, useEffect } from 'react';
// session state is now managed by our FastAPI backend; read token/user from
// localStorage (or via the Auth context).
import { useAuth } from '@/lib/auth';
import { CATEGORY_ID_MAP } from '@/lib/category-map-id';
import type { CategoryName } from '@/lib/category-meta';
import { addTransaction, confirmTransaction } from '@/actions/transactions';
import { deleteTransaction } from '@/actions/delete-transaction';
import { getTransactions } from '@/actions/get-transactions';
import type { Expense, FormData } from '@/components/home-page/types';

export function useTransactions() {

  const { user } = useAuth();

  const [expenses, setExpenses] = useState<Expense[]>([]);

  /* =========================
     LOAD TRANSACTIONS
  ========================= */

  useEffect(() => {

    if (!user?.id) return;

    const loadTransactions = async () => {

      try {

        const data = await getTransactions();

        const mapped: Expense[] = data.map((t: any) => {

          const categoryName =
            (Object.keys(CATEGORY_ID_MAP).find(
              (key) =>
                CATEGORY_ID_MAP[key as CategoryName] === t.categoryId
            ) as CategoryName) ?? 'Food';

          // backend returns the date field as `date`, not `transactionDate`
          // (it comes from TransactionOut).  guard against invalid strings
          // so that new Date(...) doesn't blow up.
          let isoDate = '';
          if (t.date) {
            const d = new Date(t.date);
            if (!isNaN(d.getTime())) {
              isoDate = d.toISOString();
            }
          }

          return {

            id: t.id,

            amount: Number(t.amount),

            category: categoryName,

            note: t.note ?? '',

            date: isoDate,

            type: t.type as 'expense' | 'income',

            recurring: t.isRecurring ?? false,

            paymentMethod: t.paymentMethod ?? null,

            paymentId: t.paymentId ?? null,

            paymentStatus: t.paymentStatus ?? 'confirmed',

          };

        });

        setExpenses(mapped);

      } catch (error) {

        console.error('Failed to load transactions:', error);

      }

    };

    loadTransactions();

  }, [user?.id]);


  /* =========================
     ADD MANUAL TRANSACTION
  ========================= */

  const addExpense = async (
    formData: FormData,
    onSuccess: (expense: Expense) => void
  ) => {

    if (!user?.id) {
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
        paymentStatus: 'confirmed',
      });

      // convert server-provided date to ISO string safely
      const isoDate = (() => {
        const d = new Date(inserted.date);
        return isNaN(d.getTime()) ? '' : d.toISOString();
      })();

      const newExpense: Expense = {
        id: inserted.id,
        amount: Number(inserted.amount),
        category: formData.category,
        note: inserted.note ?? '',
        date: isoDate,
        type: inserted.type as 'expense' | 'income',
        recurring: inserted.isRecurring ?? false,
        paymentMethod: inserted.paymentMethod ?? null,
        paymentId: inserted.paymentId ?? null,
        paymentStatus: inserted.paymentStatus ?? 'confirmed',
      };

      setExpenses(prev => [newExpense, ...prev]);

      onSuccess(newExpense);

    } catch (error) {

      console.error('Insert failed:', error);

    }

  };


  /* =========================
     MARK UPI PAYMENT AS PAID
  ========================= */

  const markAsPaid = async (
    formData: FormData,
    selectedPaymentMethod: 'gpay' | 'phonepe' | 'paytm' | null
  ) => {

    if (!selectedPaymentMethod) {

      alert('Select payment method first');
      return;

    }

    try {

      const inserted = await addTransaction({
        categoryId: CATEGORY_ID_MAP[formData.category],
        amount: parseFloat(formData.amount),
        type: formData.type,
        note: formData.note,
        date: formData.date,
        paymentMethod: selectedPaymentMethod,
        paymentId: crypto.randomUUID(),
        isRecurring: Boolean(formData.recurring),
        paymentStatus: 'pending',
      });

      const newExpense: Expense = {
        id: inserted.id,
        amount: Number(inserted.amount),
        category: formData.category,
        note: inserted.note ?? '',
        date: ((): string => {
          const d = new Date(inserted.date);
          return isNaN(d.getTime()) ? '' : d.toISOString();
        })(),
        type: inserted.type as 'expense' | 'income',
        recurring: inserted.isRecurring ?? false,
        paymentMethod: inserted.paymentMethod ?? null,
        paymentId: inserted.paymentId ?? null,
        paymentStatus: inserted.paymentStatus ?? 'pending',
      };

      setExpenses(prev => [newExpense, ...prev]);

    } catch (error) {

      console.error('Mark as paid failed:', error);

    }

  };


  /* =========================
     DELETE
  ========================= */

  const deleteExpense = async (id: number) => {

    try {

      await deleteTransaction(id);

      setExpenses(prev =>
        prev.filter(e => e.id !== id)
      );

    } catch (error) {

      console.error('Delete failed:', error);

    }

  };


  /* =========================
     CONFIRM PAYMENT
  ========================= */

  const confirmExpense = async (id: number) => {
    try {
      await confirmTransaction(id);
      setExpenses(prev =>
        prev.map(e => e.id === id ? { ...e, paymentStatus: 'confirmed' as const } : e)
      );
    } catch (error) {
      console.error('Confirm failed:', error);
    }
  };


  /* =========================
     RETURN
  ========================= */

  return {

    expenses,

    addExpense,

    deleteExpense,

    markAsPaid,

    confirmExpense,

  };

}
