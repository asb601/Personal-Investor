const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8000';

export async function getTransactions() {
  const res = await fetch(`${API_URL}/transactions`, {
    credentials: 'include',
  });

  if (!res.ok) {
    throw new Error(`failed to fetch transactions: ${res.status}`);
  }

  return res.json();
}
