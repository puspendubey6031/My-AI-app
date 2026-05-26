import { pgTable, text, serial, integer, timestamp } from "drizzle-orm/pg-core";
import { usersTable } from "./users";

export const subscriptionsTable = pgTable("subscriptions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  planId: text("plan_id").notNull(),
  status: text("status").notNull().default("active"),
  creditsPerMonth: integer("credits_per_month").notNull(),
  startsAt: timestamp("starts_at").notNull().defaultNow(),
  endsAt: timestamp("ends_at"),
  razorpayOrderId: text("razorpay_order_id"),
  razorpayPaymentId: text("razorpay_payment_id"),
  razorpaySubscriptionId: text("razorpay_subscription_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Subscription = typeof subscriptionsTable.$inferSelect;
