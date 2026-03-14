import { useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { randomUUID } from 'expo-crypto';
import { useAuth } from '@/lib/auth';
import { CATEGORY_ID_MAP } from '@/lib/category-map-id';
import type { CategoryName } from '@/lib/category-meta';
import { addTransaction, confirmTransaction } from '@/actions/transactions';
import { deleteTransaction } from '@/actions/delete-transaction';
import { getTransactions } from '@/actions/get-transactions';
import type { Expense, FormData } from '@/components/home-page/types';

function resolveCategoryName(categoryId: number) {
  const entry = Object.entries(CATEGORY_ID_MAP).find(([, value]) => value === categoryId);
  return (entry?.[0] as CategoryName) ?? 'Food';
}

export function useTransactions() {
  const { user } = useAuth();
  const [expenses, setExpenses] = useState<Expense[]>([]);

  useEffect(() => {
    if (!user?.id) return;

    let mounted = true;

    async function loadTransactions() {
      try {
        const data = await getTransactions();
        if (!mounted) return;

        const mapped: Expense[] = data.map((transaction: any) => {
          const category = resolveCategoryName(transaction.categoryId);
          const safeDate = (() => {
            const parsed = new Date(transaction.date ?? transaction.transactionDate ?? '');
            return Number.isNaN(parsed.getTime()) ? '' : parsed.toISOString();
          })();

          return {
            id: transaction.id,
            amount: Number(transaction.amount),
            category,
            note: transaction.note ?? '',
            date: safeDate,
            type: transaction.type as 'expense' | 'income',
            recurring: transaction.isRecurring ?? false,
            paymentMethod: transaction.paymentMethod ?? null,
            paymentId: transaction.paymentId ?? null,
            paymentStatus: transaction.paymentStatus ?? 'confirmed',
          };
        });

        setExpenses(mapped);
      } catch (error) {
        console.error('Failed to load transactions', error);
      }
    }

    loadTransactions();

    return () => {
      mounted = false;
    };
  }, [user?.id]);

  const addExpense = async (formData: FormData, onSuccess: (expense: Expense) => void) => {
    if (!user?.id) {
      Alert.alert('Authentication required', 'Please log in to continue.');
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

      const parsedDate = new Date(inserted.date);
      const isoDate = Number.isNaN(parsedDate.getTime()) ? '' : parsedDate.toISOString();

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
      console.error('Insert failed', error);
      Alert.alert('Unable to add transaction');
    }
  };

  const markAsPaid = async (
    formData: FormData,
    selectedPaymentMethod: 'gpay' | 'phonepe' | 'paytm' | null
  ) => {
    if (!selectedPaymentMethod) {
      Alert.alert('Payment method required', 'Choose a payment method first.');
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
        paymentId: await randomUUID(),
        isRecurring: Boolean(formData.recurring),
        paymentStatus: 'pending',
      });

      const parsedDate = new Date(inserted.date);
      const isoDate = Number.isNaN(parsedDate.getTime()) ? '' : parsedDate.toISOString();

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
        paymentStatus: inserted.paymentStatus ?? 'pending',
      };

      setExpenses(prev => [newExpense, ...prev]);
    } catch (error) {
      console.error('Mark as paid failed', error);
      Alert.alert('Unable to mark as paid');
    }
  };

  const deleteExpense = async (id: number) => {
    try {
      await deleteTransaction(id);
      setExpenses(prev => prev.filter(expense => expense.id !== id));
    } catch (error) {
      console.error('Delete failed', error);
      Alert.alert('Unable to delete transaction');
    }
  };

  const confirmExpense = async (id: number) => {
    try {
      await confirmTransaction(id);
      setExpenses(prev =>
        prev.map(expense =>
          expense.id === id ? { ...expense, paymentStatus: 'confirmed' } : expense
        )
      );
    } catch (error) {
      console.error('Confirm failed', error);
      Alert.alert('Unable to confirm payment');
    }
  };

  return {
    expenses,
    addExpense,
    deleteExpense,
    markAsPaid,
    confirmExpense,
  };
}
