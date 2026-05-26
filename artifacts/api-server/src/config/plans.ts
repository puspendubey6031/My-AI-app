export interface PlanConfig {
  id: "free" | "starter" | "creator" | "premium";
  name: string;
  price: number;
  maxImages: number;
  maxClips: number;
  maxDuration: number;
  watermark: boolean;
  quality: "low" | "standard" | "high";
  aiStory: boolean;
  description: string;
}

export const PLANS: PlanConfig[] = [
  {
    id: "free",
    name: "Free",
    price: 0,
    maxImages: 1,
    maxClips: 1,
    maxDuration: 30,
    watermark: true,
    quality: "low",
    aiStory: false,
    description: "1 image, 1 clip (10s max), 10–30s video, watermark, low quality",
  },
  {
    id: "starter",
    name: "Starter",
    price: 199,
    maxImages: 3,
    maxClips: 5,
    maxDuration: 60,
    watermark: false,
    quality: "standard",
    aiStory: false,
    description: "Up to 1 minute video, 1–3 images, multiple clips, no watermark, standard quality",
  },
  {
    id: "creator",
    name: "Creator",
    price: 399,
    maxImages: 3,
    maxClips: 10,
    maxDuration: 120,
    watermark: false,
    quality: "high",
    aiStory: false,
    description: "Up to 2 minutes, better templates, faster processing, high quality",
  },
  {
    id: "premium",
    name: "Premium",
    price: 799,
    maxImages: 10,
    maxClips: 20,
    maxDuration: 180,
    watermark: false,
    quality: "high",
    aiStory: true,
    description: "Up to 3 minutes, AI Idea Box, full AI story generation, priority, commercial use",
  },
];

export const PLAN_MAP: Record<string, PlanConfig> = Object.fromEntries(
  PLANS.map((p) => [p.id, p]),
);

export const VIDEO_TYPE_MUSIC: Record<string, string> = {
  ad: "upbeat-commercial",
  horror: "dark-ambient",
  promo: "energetic-promo",
  vlog: "chill-lifestyle",
};

export const VALID_DURATIONS = [10, 30, 60, 180];
export const VALID_TYPES = ["ad", "horror", "promo", "vlog"];
export const VALID_PLANS = ["free", "starter", "creator", "premium"];
