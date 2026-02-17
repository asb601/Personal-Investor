import type { CategoryName } from '@/lib/category-meta';

export type Expense = {
  id: number;
  amount: number;
  category: CategoryName;
  note?: string;
  date: string;
  type: 'expense' | 'income';
  recurring?: boolean;
};

export type FormData = {
  amount: string;
  category: CategoryName;
  note: string;
  date: string;
  type: 'expense' | 'income';
  recurring?: boolean;
};