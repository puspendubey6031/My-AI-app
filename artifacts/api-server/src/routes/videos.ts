import { Router } from "express";
import multer from "multer";
import path from "path";
import fs from "fs/promises";
import { db, videoJobsTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import { PLAN_MAP, VALID_TYPES, VALID_PLANS, VALID_DURATIONS } from "../config/plans";
import { processVideo } from "../lib/videoProcessor";
import { logger } from "../lib/logger";

const router = Router();

const UPLOADS_DIR = path.resolve(process.cwd(), "uploads");
const OUTPUT_DIR = path.resolve(process.cwd(), "output");

const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    await fs.mkdir(UPLOADS_DIR, { recursive: true });
    cb(null, UPLOADS_DIR);
  },
  filename: (req, file, cb) => {
    const unique = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const ext = path.extname(file.originalname);
    cb(null, `${unique}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const isImage = file.mimetype.startsWith("image/");
    const isVideo = file.mimetype.startsWith("video/");
    if (isImage || isVideo) {
      cb(null, true);
    } else {
      cb(new Error("Only image and video files are allowed"));
    }
  },
});

// GET /api/videos
router.get("/videos", async (req, res) => {
  const jobs = await db.select().from(videoJobsTable).orderBy(videoJobsTable.createdAt);
  const formatted = jobs.map(formatJob);
  res.json(formatted);
});

// GET /api/videos/summary
router.get("/videos/summary", async (req, res) => {
  const jobs = await db.select().from(videoJobsTable);
  const byStatus: Record<string, number> = {};
  const byType: Record<string, number> = {};
  const byPlan: Record<string, number> = {};

  for (const job of jobs) {
    byStatus[job.status] = (byStatus[job.status] ?? 0) + 1;
    byType[job.videoType] = (byType[job.videoType] ?? 0) + 1;
    byPlan[job.plan] = (byPlan[job.plan] ?? 0) + 1;
  }

  res.json({ total: jobs.length, byStatus, byType, byPlan });
});

// POST /api/videos
router.post(
  "/videos",
  upload.fields([
    { name: "images", maxCount: 10 },
    { name: "clips", maxCount: 20 },
  ]),
  async (req, res) => {
    const { title, videoType, duration, plan } = req.body as Record<string, string>;
    const files = req.files as Record<string, Express.Multer.File[]> | undefined;

    const images = files?.["images"] ?? [];
    const clips = files?.["clips"] ?? [];

    if (!VALID_TYPES.includes(videoType)) {
      res.status(400).json({ error: "Invalid videoType. Must be one of: ad, horror, promo, vlog" });
      return;
    }

    if (!VALID_PLANS.includes(plan)) {
      res.status(400).json({ error: "Invalid plan" });
      return;
    }

    const durationNum = parseInt(duration, 10);
    if (!VALID_DURATIONS.includes(durationNum)) {
      res.status(400).json({ error: "Invalid duration. Must be 10, 30, 60, or 180" });
      return;
    }

    const planConfig = PLAN_MAP[plan];

    if (images.length > planConfig.maxImages) {
      res.status(400).json({ error: `Your ${planConfig.name} plan allows max ${planConfig.maxImages} image(s)` });
      return;
    }

    if (clips.length > planConfig.maxClips) {
      res.status(400).json({ error: `Your ${planConfig.name} plan allows max ${planConfig.maxClips} clip(s)` });
      return;
    }

    if (durationNum > planConfig.maxDuration) {
      res.status(400).json({ error: `Your ${planConfig.name} plan allows max ${planConfig.maxDuration}s duration` });
      return;
    }

    const [job] = await db
      .insert(videoJobsTable)
      .values({
        title: title || null,
        videoType,
        duration: durationNum,
        plan,
        status: "queued",
        hasWatermark: planConfig.watermark,
        imageCount: images.length,
        clipCount: clips.length,
      })
      .returning();

    req.log.info({ jobId: job.id }, "Video job created");
    res.status(201).json(formatJob(job));

    // Process async
    setImmediate(async () => {
      try {
        await db
          .update(videoJobsTable)
          .set({ status: "processing", updatedAt: new Date() })
          .where(eq(videoJobsTable.id, job.id));

        const imagePaths = images.map((f) => f.path);
        const clipPaths = clips.map((f) => f.path);

        const outputPath = await processVideo({
          jobId: job.id,
          videoType,
          duration: durationNum,
          plan,
          hasWatermark: planConfig.watermark,
          imagePaths,
          clipPaths,
          outputDir: OUTPUT_DIR,
        });

        const outputUrl = `/api/videos/file/${path.basename(outputPath)}`;

        await db
          .update(videoJobsTable)
          .set({ status: "done", outputPath, outputUrl, updatedAt: new Date() })
          .where(eq(videoJobsTable.id, job.id));

        logger.info({ jobId: job.id }, "Video job completed");
      } catch (err) {
        logger.error({ err, jobId: job.id }, "Video job failed");
        await db
          .update(videoJobsTable)
          .set({
            status: "failed",
            errorMessage: err instanceof Error ? err.message : "Unknown error",
            updatedAt: new Date(),
          })
          .where(eq(videoJobsTable.id, job.id));
      }
    });
  },
);

// GET /api/videos/:id
router.get("/videos/:id", async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const [job] = await db.select().from(videoJobsTable).where(eq(videoJobsTable.id, id));
  if (!job) {
    res.status(404).json({ error: "Video job not found" });
    return;
  }

  res.json(formatJob(job));
});

// DELETE /api/videos/:id
router.delete("/videos/:id", async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const [job] = await db.select().from(videoJobsTable).where(eq(videoJobsTable.id, id));
  if (!job) {
    res.status(404).json({ error: "Video job not found" });
    return;
  }

  // Clean up files
  if (job.outputPath) {
    await fs.unlink(job.outputPath).catch(() => {});
  }

  await db.delete(videoJobsTable).where(eq(videoJobsTable.id, id));
  res.json({ success: true });
});

// Serve output files
router.get("/videos/file/:filename", async (req, res) => {
  const filename = path.basename(req.params.filename);
  const filePath = path.join(OUTPUT_DIR, filename);

  try {
    await fs.access(filePath);
    res.setHeader("Content-Type", "video/mp4");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    const { createReadStream } = await import("fs");
    const stream = createReadStream(filePath);
    stream.pipe(res);
  } catch {
    res.status(404).json({ error: "File not found" });
  }
});

function formatJob(job: typeof videoJobsTable.$inferSelect) {
  return {
    id: String(job.id),
    title: job.title ?? null,
    videoType: job.videoType,
    duration: job.duration,
    plan: job.plan,
    status: job.status,
    hasWatermark: job.hasWatermark,
    outputUrl: job.outputUrl ?? null,
    errorMessage: job.errorMessage ?? null,
    imageCount: job.imageCount,
    clipCount: job.clipCount,
    createdAt: job.createdAt.toISOString(),
    updatedAt: job.updatedAt.toISOString(),
  };
}

export default router;
