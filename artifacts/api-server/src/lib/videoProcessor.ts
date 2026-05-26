import path from "path";
import fs from "fs/promises";
import { spawn } from "child_process";
import { logger } from "./logger";

export interface VideoProcessingOptions {
  jobId: number;
  prompt?: string;
  videoType: string;
  duration: number;
  plan: string;
  hasWatermark: boolean;
  imagePaths: string[];
  clipPaths: string[];
  outputDir: string;
}

function checkFfmpeg(): Promise<boolean> {
  return new Promise((resolve) => {
    const proc = spawn("ffmpeg", ["-version"]);
    proc.on("error", () => resolve(false));
    proc.on("close", (code) => resolve(code === 0));
  });
}

function runFfmpeg(args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const proc = spawn("ffmpeg", args, { stdio: ["pipe", "pipe", "pipe"] });
    let stderr = "";
    proc.stderr?.on("data", (d: Buffer) => { stderr += d.toString(); });
    proc.on("error", (err) => reject(err));
    proc.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`ffmpeg exited ${code}: ${stderr.slice(-500)}`));
    });
  });
}

// Color themes per video type for the placeholder
const TYPE_THEMES: Record<string, { color: string; label: string }> = {
  horror: { color: "0x1a0000", label: "HORROR" },
  ad: { color: "0x0a0a1a", label: "COMMERCIAL AD" },
  promo: { color: "0x0a001a", label: "PROMO VIDEO" },
  vlog: { color: "0x001a1a", label: "VLOG" },
};

export async function processVideo(opts: VideoProcessingOptions): Promise<string> {
  const { jobId, prompt, videoType, duration, plan, hasWatermark, imagePaths, clipPaths, outputDir } = opts;
  const outputFile = path.join(outputDir, `job_${jobId}.mp4`);

  await fs.mkdir(outputDir, { recursive: true });

  const hasFfmpeg = await checkFfmpeg();
  if (!hasFfmpeg) {
    logger.warn("ffmpeg not available, creating placeholder video");
    return createPlaceholderVideo(outputFile, duration, hasWatermark, videoType, prompt);
  }

  if (imagePaths.length === 0 && clipPaths.length === 0) {
    return createPlaceholderVideo(outputFile, duration, hasWatermark, videoType, prompt);
  }

  const ffmpegArgs: string[] = [];

  if (imagePaths.length > 0) {
    const perImageDuration = Math.max(2, Math.floor(duration / Math.max(imagePaths.length, 1)));
    const imageConcatFile = path.join(outputDir, `concat_${jobId}.txt`);
    const lines = imagePaths.map((p) => `file '${p}'\nduration ${perImageDuration}`).join("\n");
    await fs.writeFile(imageConcatFile, lines + "\n");
    ffmpegArgs.push("-f", "concat", "-safe", "0", "-i", imageConcatFile);
  }

  for (const clip of clipPaths) {
    ffmpegArgs.push("-i", clip);
  }

  const crf = plan === "free" ? "32" : plan === "starter" ? "26" : "20";
  const vfFilters: string[] = [
    "scale=1280:720:force_original_aspect_ratio=decrease",
    "pad=1280:720:(ow-iw)/2:(oh-ih)/2",
    "format=yuv420p",
  ];

  if (hasWatermark) {
    vfFilters.push("drawtext=text='VirJoy AI':fontsize=32:fontcolor=white@0.5:x=10:y=10");
  }

  ffmpegArgs.push(
    "-vf", vfFilters.join(","),
    "-c:v", "libx264",
    "-preset", "fast",
    "-crf", crf,
    "-t", String(duration),
    "-y",
    outputFile,
  );

  try {
    await runFfmpeg(ffmpegArgs);
    logger.info({ jobId, outputFile }, "Video processed successfully");
    return outputFile;
  } catch (err) {
    logger.error({ err, jobId }, "ffmpeg processing failed, using placeholder");
    return createPlaceholderVideo(outputFile, duration, hasWatermark, videoType, prompt);
  }
}

async function createPlaceholderVideo(
  outputFile: string,
  duration: number,
  hasWatermark: boolean,
  videoType: string,
  prompt?: string,
): Promise<string> {
  const theme = TYPE_THEMES[videoType] ?? { color: "0x0a0a1a", label: "VIDEO" };
  // Truncate and escape prompt for drawtext if available
  const promptLabel = prompt
    ? prompt.length > 50 ? prompt.slice(0, 50) + "..." : prompt
    : theme.label;
  const escaped = promptLabel.replace(/['":\\]/g, "");

  const watermarkFilter = hasWatermark
    ? ",drawtext=text='VirJoy AI':fontsize=28:fontcolor=white@0.4:x=10:y=10"
    : "";

  const args = [
    "-f", "lavfi",
    "-i", `color=c=${theme.color}:size=1280x720:rate=25`,
    "-vf", [
      `drawtext=text='${theme.label}':fontsize=52:fontcolor=white@0.9:x=(w-text_w)/2:y=(h-text_h)/2-40`,
      `drawtext=text='${escaped}':fontsize=22:fontcolor=white@0.5:x=(w-text_w)/2:y=(h-text_h)/2+40`,
      "format=yuv420p",
    ].join(",") + watermarkFilter,
    "-c:v", "libx264",
    "-preset", "ultrafast",
    "-t", String(duration),
    "-y",
    outputFile,
  ];

  try {
    await runFfmpeg(args);
  } catch {
    await fs.writeFile(outputFile, Buffer.alloc(0));
  }

  return outputFile;
}
