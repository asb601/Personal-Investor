// POST bulk transactions to FastAPI

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export type BulkTransactionItem = {
  categoryId: number;
  amount: number;
  type: "expense" | "income";
  note?: string;
  date: string;
  isRecurring?: boolean;
  paymentStatus?: "pending" | "confirmed" | "manual";
};

export async function bulkImportTransactions(transactions: BulkTransactionItem[]) {
  const res = await fetch(`${API_URL}/transactions/bulk`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ transactions }),
  });
  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`Bulk import failed (${res.status}): ${detail}`);
  }
  return res.json();
}
