import { db } from "@/db";
import { categories } from "@/db/schema";

async function seed() {
  await db.insert(categories).values([
    { id: 1, name: "Food", type: "expense" },
    { id: 2, name: "Transport", type: "expense" },
    { id: 3, name: "Shopping", type: "expense" },
    { id: 4, name: "Entertainment", type: "expense" },
    { id: 5, name: "Bills", type: "expense" },
    { id: 6, name: "Health", type: "expense" },
    { id: 7, name: "Regular Income", type: "income" },
    { id: 8, name: "Bonus", type: "income" },
    { id: 9, name: "Profits", type: "income" },
  ]);

  console.log("✅ Categories seeded");
}

seed();
