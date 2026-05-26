---
name: Drizzle-ORM + Firebase-Admin dual instance
description: firebase-admin's @opentelemetry/api peer causes pnpm to resolve two copies of drizzle-orm, breaking TypeScript types with "private property shouldInlineParams" errors.
---

## The rule
After installing `firebase-admin`, always force a single `drizzle-orm` version in `pnpm-workspace.yaml`.

## Why
firebase-admin's dependency chain pulls in `@opentelemetry/api`, which pnpm treats as an optional peer for drizzle-orm. This causes pnpm to install two separate copies:
- `drizzle-orm@0.45.2_@types+pg@8.20.0_pg@8.20.0`
- `drizzle-orm@0.45.2_@opentelemetry+api@1.9.1_@types+pg@8.20.0_pg@8.20.0`

TypeScript then sees `SQL<unknown>` from two different module paths and rejects all drizzle `.where()`, `.orderBy()` calls with cryptic "private property" incompatibility errors.

## How to apply
Add to the `overrides` section of `pnpm-workspace.yaml`:
```yaml
drizzle-orm: "0.45.2"
```
Then run `pnpm install`. The override forces a single canonical copy.

This same pattern applies to any package that lists `@opentelemetry/api` as a peer.
