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
  monthlyCredits: number;
  description: string;
  features: string[];
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
    monthlyCredits: 5,
    description: "5 free credits every 30 days to get started",
    features: [
      "Prompt-Based Generation",
      "Basic Templates",
      "Local Rendering Only",
      "Watermarked Output",
    ],
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
    monthlyCredits: 50,
    description: "50 credits/month for growing creators",
    features: [
      "Prompt-Based Video Creation",
      "Smart Template Matching",
      "No Watermark",
      "Standard Quality",
    ],
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
    monthlyCredits: 150,
    description: "150 credits/month with enhanced cinematic effects",
    features: [
      "Enhanced Cinematic Effects",
      "Smart AI Assistance",
      "Priority Rendering",
      "High Quality Output",
    ],
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
    monthlyCredits: 400,
    description: "400 credits/month with full Gemini AI story generation",
    features: [
      "Full Gemini AI Story Generation",
      "Cinematic AI Scene Building",
      "Commercial Use License",
      "Fastest Rendering",
    ],
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
