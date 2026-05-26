import fs from "fs/promises";
import path from "path";
import { db, videoJobsTable } from "@workspace/db";
import { eq, and, lte, isNotNull } from "drizzle-orm";
import { logger } from "./logger";

const OUTPUT_DIR = path.resolve(process.cwd(), "output");
const UPLOADS_DIR = path.resolve(process.cwd(), "uploads");
const EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Deletes generated video files (and their DB records) that are older than 24 hours.
 * Also sweeps the uploads directory for orphaned media files older than 24 hours.
 */
async function runCleanup(): Promise<void> {
  const cutoff = new Date(Date.now() - EXPIRY_MS);
  let filesDeleted = 0;
  let bytesFreed = 0;

  // ── 1. DB-driven cleanup: find "done" jobs older than cutoff ──────────────
  const expiredJobs = await db
    .select()
    .from(videoJobsTable)
    .where(
      and(
        eq(videoJobsTable.status, "done"),
        isNotNull(videoJobsTable.outputPath),
        lte(videoJobsTable.updatedAt, cutoff),
      ),
    );

  for (const job of expiredJobs) {
    if (job.outputPath) {
      try {
        const stat = await fs.stat(job.outputPath).catch(() => null);
        if (stat) {
          bytesFreed += stat.size;
          await fs.unlink(job.outputPath);
          filesDeleted++;
        }
      } catch (err) {
        logger.warn({ err, jobId: job.id, path: job.outputPath }, "Could not delete expired output file");
      }
    }

    // Mark job as expired, clear file references — keep metadata (prompt, credits, etc.)
    await db
      .update(videoJobsTable)
      .set({
        status: "expired",
        outputPath: null,
        outputUrl: null,
        updatedAt: new Date(),
      })
      .where(eq(videoJobsTable.id, job.id));
  }

  // ── 2. Filesystem sweep: catch orphaned output files not in DB ─────────────
  await sweepDirectory(OUTPUT_DIR, cutoff, (size) => {
    filesDeleted++;
    bytesFreed += size;
  });

  // ── 3. Uploads cleanup: uploaded images/clips older than 24 hours ─────────
  await sweepDirectory(UPLOADS_DIR, cutoff, (size) => {
    filesDeleted++;
    bytesFreed += size;
  });

  if (filesDeleted > 0) {
    logger.info(
      { filesDeleted, bytesFreedMB: (bytesFreed / 1024 / 1024).toFixed(2) },
      "Storage cleanup complete",
    );
  } else {
    logger.debug("Storage cleanup ran — no expired files found");
  }
}

/**
 * Sweeps a directory and deletes files older than `cutoff`.
 * Safe: skips directories, handles missing folders gracefully.
 */
async function sweepDirectory(
  dir: string,
  cutoff: Date,
  onDeleted: (bytes: number) => void,
): Promise<void> {
  let entries: string[];

  try {
    entries = await fs.readdir(dir);
  } catch {
    return; // Directory doesn't exist yet — skip silently
  }

  for (const name of entries) {
    const filePath = path.join(dir, name);
    try {
      const stat = await fs.stat(filePath);
      if (stat.isFile() && stat.mtime < cutoff) {
        await fs.unlink(filePath);
        onDeleted(stat.size);
      }
    } catch {
      // File may have already been deleted — ignore
    }
  }
}

/**
 * Starts the recurring cleanup scheduler.
 * Runs immediately on boot, then every `intervalMs` milliseconds.
 */
export function startCleanupScheduler(intervalMs = 60 * 60 * 1000 /* 1 hour */): void {
  logger.info(
    { intervalHours: intervalMs / 3600000, expiryHours: EXPIRY_MS / 3600000 },
    "Storage cleanup scheduler started",
  );

  // Run immediately on startup to clean any leftovers from previous runs
  runCleanup().catch((err) =>
    logger.error({ err }, "Initial storage cleanup failed"),
  );

  // Then run on a recurring interval
  setInterval(() => {
    runCleanup().catch((err) =>
      logger.error({ err }, "Scheduled storage cleanup failed"),
    );
  }, intervalMs).unref(); // `.unref()` prevents the interval from keeping the process alive
}
