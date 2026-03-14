import type { CategoryName } from '@/lib/category-meta';

export const CATEGORY_DATA: { id: number; name: CategoryName; type: 'expense' | 'income' }[] = [
  { id: 1, name: 'Food', type: 'expense' },
  { id: 2, name: 'Transport', type: 'expense' },
  { id: 3, name: 'Shopping', type: 'expense' },
  { id: 4, name: 'Entertainment', type: 'expense' },
  { id: 5, name: 'Bills', type: 'expense' },
  { id: 6, name: 'Health', type: 'expense' },
  { id: 7, name: 'Regular Income', type: 'income' },
  { id: 8, name: 'Bonus', type: 'income' },
  { id: 9, name: 'Profits', type: 'income' },
];

export const CATEGORY_ID_MAP = CATEGORY_DATA.reduce<Record<CategoryName, number>>(
  (acc, item) => {
    acc[item.name] = item.id;
    return acc;
  },
  {} as Record<CategoryName, number>
);
