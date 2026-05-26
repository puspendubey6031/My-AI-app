import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const videoJobsTable = pgTable("video_jobs", {
  id: serial("id").primaryKey(),
  title: text("title"),
  videoType: text("video_type").notNull(),
  duration: integer("duration").notNull(),
  plan: text("plan").notNull(),
  status: text("status").notNull().default("queued"),
  hasWatermark: boolean("has_watermark").notNull().default(false),
  outputPath: text("output_path"),
  outputUrl: text("output_url"),
  errorMessage: text("error_message"),
  imageCount: integer("image_count").notNull().default(0),
  clipCount: integer("clip_count").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertVideoJobSchema = createInsertSchema(videoJobsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertVideoJob = z.infer<typeof insertVideoJobSchema>;
export type VideoJob = typeof videoJobsTable.$inferSelect;
