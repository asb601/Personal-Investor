import type { CategoryName } from '@/lib/category-meta';

export type Expense = {
  id: number;
  amount: number;
  category: CategoryName;
  note?: string;
  date: string;
  type: 'expense' | 'income';

  recurring?: boolean;

  paymentMethod?: 'gpay' | 'phonepe' | 'paytm' | null;

  paymentId?: string | null;
};

export type FormData = {
  amount: string;
  category: CategoryName;
  note: string;
  date: string;
  type: 'expense' | 'income';

  recurring?: boolean;

  paymentMethod?: 'gpay' | 'phonepe' | 'paytm' | null;
};
