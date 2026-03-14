export const CATEGORY_META = {
  Food: { icon: '🍔', color: '#6366f1', type: 'expense' },
  Transport: { icon: '🚗', color: '#8b5cf6', type: 'expense' },
  Shopping: { icon: '🛍️', color: '#ec4899', type: 'expense' },
  Entertainment: { icon: '🎬', color: '#f97316', type: 'expense' },
  Bills: { icon: '📄', color: '#22d3ee', type: 'expense' },
  Health: { icon: '💊', color: '#14b8a6', type: 'expense' },
  'Regular Income': { icon: '💼', color: '#4ade80', type: 'income' },
  Bonus: { icon: '🎁', color: '#2dd4bf', type: 'income' },
  Profits: { icon: '📈', color: '#facc15', type: 'income' },
} as const;

export type CategoryName = keyof typeof CATEGORY_META;
