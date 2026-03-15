'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { getTransactions } from '@/actions/get-transactions';
import { CATEGORY_ID_MAP } from '@/lib/category-map-id';
import type { CategoryName } from '@/lib/category-meta';
import type { Transaction } from '../types';

export function useTransactionLoader() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;

    const load = async () => {
      setLoading(true);
      try {
        const data = await getTransactions();
        const mapped: Transaction[] = data.map((t: any) => {
          const category =
            (Object.keys(CATEGORY_ID_MAP).find(
              (k) => CATEGORY_ID_MAP[k as CategoryName] === t.categoryId,
            ) as CategoryName) ?? 'Food';

          let date = '';
          if (t.date) {
            const d = new Date(t.date);
            if (!isNaN(d.getTime())) date = d.toISOString();
          }

          return {
            id: t.id,
            amount: Number(t.amount),
            category,
            note: t.note ?? '',
            date,
            type: t.type as 'expense' | 'income',
            paymentStatus: t.paymentStatus ?? 'confirmed',
            cardId: t.cardId ?? null,
          };
        });
        setTransactions(mapped);
      } catch (err) {
        console.error('Failed to load transactions:', err);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [user?.id]);

  return { transactions, loading };
}
