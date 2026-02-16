'use server';

import { db } from "@/db";
import { transactions } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function deleteTransaction(id: number) {
  await db.delete(transactions).where(eq(transactions.id, id));
}
