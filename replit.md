# VirJoy AI

A form-based AI video creation web app — users fill a form, upload optional media, and the system generates cinematic videos with plan-based feature control.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string
- Required env: `AI_INTEGRATIONS_GEMINI_BASE_URL`, `AI_INTEGRATIONS_GEMINI_API_KEY` — Gemini AI (auto-provisioned via Replit AI Integrations)

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite (`artifacts/virjoy-ai/`)
- API: Express 5 (`artifacts/api-server/`)
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- File uploads: Multer
- Video processing: FFmpeg (via spawn)
- AI: Gemini 2.5 Flash via Replit AI Integrations (`lib/integrations-gemini-ai/`)
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `lib/api-spec/openapi.yaml` — OpenAPI contract (source of truth)
- `lib/db/src/schema/videoJobs.ts` — DB schema for video jobs
- `artifacts/api-server/src/config/plans.ts` — plan config (all limits controlled here)
- `artifacts/api-server/src/routes/videos.ts` — video CRUD + file upload
- `artifacts/api-server/src/routes/plans.ts` — plan listing
- `artifacts/api-server/src/routes/aiStory.ts` — premium AI story generation
- `artifacts/api-server/src/lib/videoProcessor.ts` — FFmpeg video processing
- `artifacts/virjoy-ai/src/pages/studio.tsx` — main creation page
- `artifacts/virjoy-ai/src/pages/history.tsx` — job history page

## Architecture decisions

- All plan limits are config-driven in `plans.ts` — no hardcoded restrictions in route handlers
- Video generation is async (queued → processing → done) — job is created immediately, processing runs via `setImmediate` after response
- Frontend polls `useGetVideo` every 3s while status is queued/processing
- FFmpeg is spawned as a child process; if not available, a placeholder video is created
- `@google/genai` is removed from esbuild externals so it gets bundled (it's needed at runtime)

## Product

- **Free**: 1 image, 1 clip, 10-30s, watermarked, low quality
- **Starter (₹199)**: 3 images, 5 clips, up to 60s, no watermark, standard quality
- **Creator (₹399)**: 3 images, 10 clips, up to 120s, high quality, faster
- **Premium (₹799)**: AI Idea Box (Gemini story generation), 10 images, 20 clips, up to 180s, commercial use

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- After any OpenAPI spec change: run `pnpm --filter @workspace/api-spec run codegen`
- After any DB schema change: run `pnpm --filter @workspace/db run push`
- `@google/genai` must NOT be in the esbuild external list in `build.mjs` — it needs to be bundled
- Video processing requires ffmpeg binary on PATH; falls back to placeholder if unavailable

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
