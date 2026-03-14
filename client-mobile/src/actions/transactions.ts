const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8000';

type Payload = {
  categoryId: number;
  amount: number;
  type: 'expense' | 'income';
  note?: string;
  date: string;
  isRecurring?: boolean;
  paymentMethod?: 'gpay' | 'phonepe' | 'paytm';
  paymentId?: string;
  paymentStatus?: 'pending' | 'confirmed';
};

export async function addTransaction(data: Payload) {
  const res = await fetch(`${API_URL}/transactions`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    throw new Error(`failed to add transaction: ${res.status}`);
  }

  return res.json();
}

export async function confirmTransaction(id: number) {
  const res = await fetch(`${API_URL}/transactions/${id}/confirm`, {
    method: 'PATCH',
    credentials: 'include',
  });

  if (!res.ok) {
    throw new Error(`failed to confirm transaction: ${res.status}`);
  }

  return res.json();
}
