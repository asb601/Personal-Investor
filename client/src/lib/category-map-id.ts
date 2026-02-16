export const CATEGORY_DATA = [
  { id: 1, name: "Food", type: "expense" },
  { id: 2, name: "Transport", type: "expense" },
  { id: 3, name: "Shopping", type: "expense" },
  { id: 4, name: "Entertainment", type: "expense" },
  { id: 5, name: "Bills", type: "expense" },
  { id: 6, name: "Health", type: "expense" },
  { id: 7, name: "Regular Income", type: "income" },
  { id: 8, name: "Bonus", type: "income" },
  { id: 9, name: "Profits", type: "income" },
] as const;

export const CATEGORY_ID_MAP = Object.fromEntries(
  CATEGORY_DATA.map(c => [c.name, c.id])
) as Record<typeof CATEGORY_DATA[number]["name"], number>;


export type CategoryName = typeof CATEGORY_DATA[number]["name"];
