import { db, usersTable, creditLogsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

export const CREDIT_COSTS = {
  duration: { 10: 2, 30: 6, 60: 12, 180: 30 } as Record<number, number>,
  perClip: 2,
  cinematicEffects: 3,
  aiStory: 5,
};

export const PLAN_MONTHLY_CREDITS: Record<string, number> = {
  free: 5,
  starter: 50,
  creator: 150,
  premium: 400,
};

export const FREE_CREDIT_VALIDITY_DAYS = 10;

export function calculateCreditCost({
  duration,
  clipCount,
  usedAiStory = false,
  plan,
}: {
  duration: number;
  clipCount: number;
  usedAiStory?: boolean;
  plan: string;
}): number {
  let cost = CREDIT_COSTS.duration[duration] ?? 6;
  cost += clipCount * CREDIT_COSTS.perClip;
  if (plan === "creator" || plan === "premium") {
    cost += CREDIT_COSTS.cinematicEffects;
  }
  if (usedAiStory) {
    cost += CREDIT_COSTS.aiStory;
  }
  return cost;
}

export async function getUserCredits(userId: number): Promise<number> {
  const [row] = await db
    .select({ credits: usersTable.credits })
    .from(usersTable)
    .where(eq(usersTable.id, userId));
  return row?.credits ?? 0;
}

export async function hasSufficientCredits(userId: number, cost: number): Promise<boolean> {
  const credits = await getUserCredits(userId);
  return credits >= cost;
}

export async function deductCredits({
  userId,
  cost,
  jobId,
  action,
  description,
}: {
  userId: number;
  cost: number;
  jobId?: number;
  action: string;
  description: string;
}): Promise<void> {
  const [user] = await db
    .select({ credits: usersTable.credits })
    .from(usersTable)
    .where(eq(usersTable.id, userId));

  if (!user) throw new Error("User not found");

  const creditsBefore = user.credits;
  const creditsAfter = Math.max(0, creditsBefore - cost);

  await db.transaction(async (tx) => {
    await tx
      .update(usersTable)
      .set({ credits: creditsAfter, updatedAt: new Date() })
      .where(eq(usersTable.id, userId));

    await tx.insert(creditLogsTable).values({
      userId,
      action,
      creditsUsed: cost,
      creditsBefore,
      creditsAfter,
      jobId: jobId ?? null,
      description,
    });
  });
}

export async function addCredits({
  userId,
  amount,
  action,
  description,
}: {
  userId: number;
  amount: number;
  action: string;
  description: string;
}): Promise<number> {
  const [user] = await db
    .select({ credits: usersTable.credits })
    .from(usersTable)
    .where(eq(usersTable.id, userId));

  if (!user) throw new Error("User not found");

  const creditsBefore = user.credits;
  const creditsAfter = creditsBefore + amount;

  await db.transaction(async (tx) => {
    await tx
      .update(usersTable)
      .set({ credits: creditsAfter, updatedAt: new Date() })
      .where(eq(usersTable.id, userId));

    await tx.insert(creditLogsTable).values({
      userId,
      action,
      creditsUsed: -amount,
      creditsBefore,
      creditsAfter,
      jobId: null,
      description,
    });
  });

  return creditsAfter;
}

export async function refundCredits({
  userId,
  cost,
  jobId,
  description,
}: {
  userId: number;
  cost: number;
  jobId?: number;
  description: string;
}): Promise<void> {
  await addCredits({ userId, amount: cost, action: "refund", description });
  if (jobId) {
    await db
      .update(creditLogsTable)
      .set({ jobId })
      .where(eq(creditLogsTable.userId, userId));
  }
}

export function canClaimFreeCredits(lastClaimed: Date | null): boolean {
  if (!lastClaimed) return true;
  const now = new Date();
  const daysSince = (now.getTime() - lastClaimed.getTime()) / (1000 * 60 * 60 * 24);
  return daysSince >= 30;
}
