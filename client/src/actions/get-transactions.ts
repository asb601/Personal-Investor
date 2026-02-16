'use server';

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { db } from "@/db";
import { transactions } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function getTransactions(userId: string) {

  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    throw new Error("Not authenticated");
  }

  return await db.query.transactions.findMany({
    where: eq(transactions.authUserId, userId),
    orderBy: (t, { desc }) => [desc(t.createdAt)],
  });
}
