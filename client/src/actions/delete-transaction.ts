// DELETE request to FastAPI
// Input: transaction id (number)
// Output: none (204 expected)

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function deleteTransaction(id: number) {
  const res = await fetch(`${API_URL}/transactions/${id}`, {
    method: "DELETE",
    credentials: "include",
  });
  if (!res.ok) {
    throw new Error(`failed to delete transaction: ${res.status}`);
  }
}
