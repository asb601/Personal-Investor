// src/db/schema.ts
import {
  pgTable,
  serial,
  text,
  integer,
  numeric,
  boolean,
  date,
  timestamp,
  varchar,
  uuid,
  pgEnum,
} from "drizzle-orm/pg-core";

export const paymentMethodEnum = pgEnum("payment_method_enum", [
  "gpay",
  "phonepe",
  "paytm",
]);
  
/* =========================================================
   AUTH TABLES (NextAuth owns these)
========================================================= */

/* =======================
   USER
======================= */

export const user = pgTable("user", {
  id: uuid("id").defaultRandom().primaryKey(),

  name: varchar("name", { length: 255 }),
  email: varchar("email", { length: 255 }).unique(),
  emailVerified: timestamp("email_verified"),
  image: text("image"),
});

/* =======================
   ACCOUNT
======================= */

export const account = pgTable("account", {
  id: serial("id").primaryKey(),

  userId: uuid("user_id")
    .notNull()
    .references(() => user.id),

  type: varchar("type", { length: 255 }).notNull(),
  provider: varchar("provider", { length: 255 }).notNull(),
  providerAccountId: varchar("provider_account_id", { length: 255 }).notNull(),

  refresh_token: text("refresh_token"),
  access_token: text("access_token"),
  expires_at: integer("expires_at"),
  token_type: varchar("token_type", { length: 255 }),
  scope: varchar("scope", { length: 255 }),
  id_token: text("id_token"),
  session_state: varchar("session_state", { length: 255 }),
});

/* =======================
   SESSION
======================= */

export const session = pgTable("session", {
  sessionToken: varchar("session_token", { length: 255 }).primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date" }).notNull(),
});

/* =======================
   VERIFICATION TOKEN
======================= */

export const verificationToken = pgTable("verification_token", {
  identifier: varchar("identifier", { length: 255 }).notNull(),
  token: varchar("token", { length: 255 }).notNull().unique(),
  expires: timestamp("expires").notNull(),
});

/* =========================================================
   APP TABLES (Your app owns these)
========================================================= */

/* =======================
   USER PROFILE
======================= */

export const userProfile = pgTable("user_profile", {
  id: serial("id").primaryKey(),

  authUserId: uuid("auth_user_id")
    .notNull()
    .unique()
    .references(() => user.id),

  currency: varchar("currency", { length: 10 }).default("INR"),
  onboardingCompleted: boolean("onboarding_completed").default(false),

  createdAt: timestamp("created_at").defaultNow().notNull(),
});

/* =======================
   CATEGORIES
======================= */

export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),

  name: varchar("name", { length: 100 }).notNull(),
  type: varchar("type", { length: 20 }).notNull(), // expense | income
  icon: varchar("icon", { length: 10 }),
  color: varchar("color", { length: 50 }),

  createdAt: timestamp("created_at").defaultNow().notNull(),
});

/* =======================
   TRANSACTIONS
======================= */

export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),

  authUserId: uuid("auth_user_id")
    .notNull()
    .references(() => user.id),

  categoryId: integer("category_id")
    .notNull()
    .references(() => categories.id),

  amount: numeric("amount", { precision: 12, scale: 2 })
    .$type<number>()   
    .notNull(),

  type: varchar("type", { length: 20 }).notNull(),

  note: text("note"),

  transactionDate: date("transaction_date", { mode: "date" }).notNull(),

  isRecurring: boolean("is_recurring").default(false),

  // ✅ ADD THESE TWO
  paymentMethod: paymentMethodEnum("payment_method"),
  paymentId: varchar("payment_id", { length: 255 }),

  createdAt: timestamp("created_at").defaultNow().notNull(),
});

