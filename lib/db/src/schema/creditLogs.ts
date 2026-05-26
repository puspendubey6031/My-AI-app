import { pgTable, text, serial, integer, timestamp } from "drizzle-orm/pg-core";
import { usersTable } from "./users";

export const creditLogsTable = pgTable("credit_logs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  action: text("action").notNull(),
  creditsUsed: integer("credits_used").notNull(),
  creditsBefore: integer("credits_before").notNull(),
  creditsAfter: integer("credits_after").notNull(),
  jobId: integer("job_id"),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type CreditLog = typeof creditLogsTable.$inferSelect;
