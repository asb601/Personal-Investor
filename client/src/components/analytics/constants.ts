import { CATEGORY_META } from '@/lib/category-meta';
import type { CategoryName } from '@/lib/category-meta';

export type CategoryMeta = {
  name: CategoryName;
  icon: string;
  color: string;
};

export const EXPENSE_CATEGORIES: CategoryMeta[] = Object.entries(CATEGORY_META)
  .filter(([, v]) => v.type === 'expense')
  .map(([name, meta]) => ({
    name: name as CategoryName,
    icon: meta.icon,
    color: meta.color,
  }));

export const INCOME_CATEGORIES: CategoryMeta[] = Object.entries(CATEGORY_META)
  .filter(([, v]) => v.type === 'income')
  .map(([name, meta]) => ({
    name: name as CategoryName,
    icon: meta.icon,
    color: meta.color,
  }));
