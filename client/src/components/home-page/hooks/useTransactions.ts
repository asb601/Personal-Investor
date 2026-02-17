'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { CATEGORY_ID_MAP } from '@/lib/category-map-id';
import { CATEGORY_META } from '@/lib/category-meta';
import type { CategoryName } from '@/lib/category-meta';
import { addTransaction } from '@/actions/transactions';
import { deleteTransaction } from '@/actions/delete-transaction';
import { getTransactions } from '@/actions/get-transactions';
import type { Expense, FormData } from '@/components/home-page/types';

export function useTransactions() {
  const { data: session } = useSession();
  const [expenses, setExpenses] = useState<Expense[]>([]);

  useEffect(() => {
    if (!session?.user?.id) return;

    const loadTransactions = async () => {
      try {
        const data = await getTransactions(session.user.id);

        const mapped: Expense[] = data.map((t: any) => {
          const categoryName =
            (Object.keys(CATEGORY_ID_MAP).find(
              (key) =>
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

  const addExpense = async (
    formData: FormData,
    onSuccess: (expense: Expense) => void
  ) => {
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
        type: inserted.type as 'expense' | 'income',
        recurring: inserted.isRecurring ?? false,
      };

      setExpenses((prev) => [newExpense, ...prev]);
      onSuccess(newExpense);
    } catch (error) {
      console.error('Insert failed:', error);
    }
  };

  const deleteExpense = async (id: number) => {
    try {
      await deleteTransaction(id);
      setExpenses((prev) => prev.filter((e) => e.id !== id));
    } catch (error) {
      console.error('Delete failed:', error);
    }
  };

  const markAsPaid = async (
    formData: FormData,
    selectedPaymentMethod: 'gpay' | 'phonepe' | 'paytm' | null
  ) => {
    if (!selectedPaymentMethod) {
      alert('Complete payment first');
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
      note: inserted.note ?? '',
      date: new Date(inserted.transactionDate).toISOString(),
      type: inserted.type as 'expense' | 'income',
    };

    setExpenses((prev) => [newExpense, ...prev]);
  };

  return { expenses, addExpense, deleteExpense, markAsPaid };
}