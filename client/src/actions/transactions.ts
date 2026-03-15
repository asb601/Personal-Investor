// POST to FastAPI create-transaction endpoint

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function addTransaction(data: {
  categoryId: number;
  amount: number;
  type: "expense" | "income";
  note?: string;
  date: string;
  isRecurring?: boolean;
  paymentMethod?: 'gpay' | 'phonepe' | 'paytm';
  paymentId?: string;
  paymentStatus?: 'pending' | 'confirmed';
  cardId?: number | null;
}) {
  const res = await fetch(`${API_URL}/transactions`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      categoryId: data.categoryId,
      amount: data.amount,
      type: data.type,
      note: data.note,
      date: data.date,
      isRecurring: data.isRecurring,
      paymentMethod: data.paymentMethod,
      paymentId: data.paymentId,
      paymentStatus: data.paymentStatus ?? 'confirmed',
      cardId: data.cardId ?? null,
    }),
  });
  if (!res.ok) {
    throw new Error(`failed to add transaction: ${res.status}`);
  }
  return res.json();
}

export async function confirmTransaction(id: number) {
  const res = await fetch(`${API_URL}/transactions/${id}/confirm`, {
    method: "PATCH",
    credentials: "include",
  });
  if (!res.ok) {
    throw new Error(`failed to confirm transaction: ${res.status}`);
  }
  return res.json();
}
