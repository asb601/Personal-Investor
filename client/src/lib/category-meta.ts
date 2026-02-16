export const CATEGORY_META = {
  Food: { icon: "🍔", color: "var(--chart-1)", type: "expense" },
  Transport: { icon: "🚗", color: "var(--chart-2)", type: "expense" },
  Shopping: { icon: "🛍️", color: "var(--chart-3)", type: "expense" },
  Entertainment: { icon: "🎬", color: "var(--chart-4)", type: "expense" },
  Bills: { icon: "📄", color: "var(--chart-5)", type: "expense" },
  Health: { icon: "💊", color: "var(--chart-1)", type: "expense" },

  "Regular Income": { icon: "💼", color: "var(--chart-1)", type: "income" },
  Bonus: { icon: "🎁", color: "var(--chart-2)", type: "income" },
  Profits: { icon: "📈", color: "var(--chart-3)", type: "income" },
} as const;

/** ✅ THIS WAS MISSING */
export type CategoryName = keyof typeof CATEGORY_META;
