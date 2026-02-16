'use server';

import { db } from "@/db";
import { transactions } from "@/db/schema";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";

export async function addTransaction(data: {

  categoryId: number;
  amount: number;
  type: "expense" | "income";
  note?: string;
  date: string;
  isRecurring?: boolean;   
  paymentMethod?: string;
  paymentId?: string;

}) {

  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    throw new Error("Not authenticated");
  }

  const result = await db.insert(transactions)
    .values({

      authUserId: session.user.id,

      categoryId: data.categoryId,

      amount: data.amount,

      type: data.type,

      note: data.note,

      transactionDate: new Date(data.date),

      paymentMethod: data.paymentMethod,

      paymentId: data.paymentId,

      isRecurring: data.isRecurring ?? false,
    })
    .returning();

  return result[0];

}
