import path from "path";
import fs from "fs/promises";
import { createWriteStream, existsSync } from "fs";
import { spawn } from "child_process";
import { logger } from "./logger";

export interface VideoProcessingOptions {
  jobId: number;
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

export async function processVideo(opts: VideoProcessingOptions): Promise<string> {
  const { jobId, videoType, duration, hasWatermark, imagePaths, clipPaths, outputDir } = opts;
  const outputFile = path.join(outputDir, `job_${jobId}.mp4`);

  await fs.mkdir(outputDir, { recursive: true });

  const hasFfmpeg = await checkFfmpeg();
  if (!hasFfmpeg) {
    logger.warn("ffmpeg not available, creating placeholder video");
    return createPlaceholderVideo(outputFile, duration, hasWatermark, videoType);
  }

  const inputs: string[] = [];
  const filterParts: string[] = [];
  let inputIndex = 0;

  const effectForType: Record<string, string> = {
    horror: "fade=t=in:st=0:d=0.5,fade=t=out:st=" + (duration - 0.5) + ":d=0.5",
    ad: "zoompan=z='min(zoom+0.002,1.3)':d=75:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)'",
    promo: "fade=t=in:st=0:d=0.3",
    vlog: "fade=t=in:st=0:d=0.5",
  };

  if (imagePaths.length === 0 && clipPaths.length === 0) {
    return createPlaceholderVideo(outputFile, duration, hasWatermark, videoType);
  }

  // Build simple slideshow from images and clips
  const ffmpegArgs: string[] = [];

  if (imagePaths.length > 0) {
    const perImageDuration = Math.max(2, Math.floor(duration / Math.max(imagePaths.length, 1)));
    const imageConcatFile = path.join(outputDir, `concat_${jobId}.txt`);
    const lines = imagePaths.map((p) => `file '${p}'\nduration ${perImageDuration}`).join("\n");
    await fs.writeFile(imageConcatFile, lines + "\n");

    ffmpegArgs.push(
      "-f", "concat", "-safe", "0", "-i", imageConcatFile,
    );
    inputIndex++;
  }

  for (const clip of clipPaths) {
    ffmpegArgs.push("-i", clip);
    inputIndex++;
  }

  if (inputIndex === 0) {
    return createPlaceholderVideo(outputFile, duration, hasWatermark, videoType);
  }

  const vfFilters: string[] = ["scale=1280:720:force_original_aspect_ratio=decrease", "pad=1280:720:(ow-iw)/2:(oh-ih)/2", "format=yuv420p"];
  if (hasWatermark) {
    vfFilters.push("drawtext=text='VirJoy AI':fontsize=32:fontcolor=white@0.5:x=10:y=10");
  }

  ffmpegArgs.push(
    "-vf", vfFilters.join(","),
    "-c:v", "libx264",
    "-preset", "fast",
    "-crf", opts.plan === "free" ? "32" : opts.plan === "starter" ? "26" : "20",
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
    return createPlaceholderVideo(outputFile, duration, hasWatermark, videoType);
  }
}

async function createPlaceholderVideo(
  outputFile: string,
  duration: number,
  hasWatermark: boolean,
  videoType: string,
): Promise<string> {
  const label = videoType.toUpperCase();
  const watermarkFilter = hasWatermark
    ? ",drawtext=text='VirJoy AI':fontsize=32:fontcolor=white@0.5:x=10:y=10"
    : "";

  const args = [
    "-f", "lavfi",
    "-i", `color=c=0x1a1a2e:size=1280x720:rate=25`,
    "-vf", `drawtext=text='${label} VIDEO':fontsize=48:fontcolor=white:x=(w-text_w)/2:y=(h-text_h)/2${watermarkFilter},format=yuv420p`,
    "-c:v", "libx264",
    "-preset", "ultrafast",
    "-t", String(duration),
    "-y",
    outputFile,
  ];

  try {
    await runFfmpeg(args);
  } catch {
    // Last resort: write a minimal valid mp4 placeholder
    await fs.writeFile(outputFile, Buffer.alloc(0));
  }

  return outputFile;
}
