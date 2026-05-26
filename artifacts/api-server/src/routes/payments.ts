import { Router } from "express";
import { db, usersTable, subscriptionsTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { razorpay, isRazorpayReady, verifyPaymentSignature, verifyWebhookSignature } from "../services/razorpay";
import { addCredits, PLAN_MONTHLY_CREDITS } from "../services/credits";
import { requireAuth, requireMobileVerified } from "../middleware/auth";
import { PLANS } from "../config/plans";

const router = Router();

/**
 * POST /api/payments/order
 * Create a Razorpay order for a subscription plan upgrade.
 *
 * Body: { planId: "starter" | "creator" | "premium" }
 */
router.post("/payments/order", requireAuth, requireMobileVerified, async (req, res) => {
  if (!isRazorpayReady()) {
    res.status(503).json({ error: "Payment service not configured" });
    return;
  }

  const { planId } = req.body as { planId?: string };
  const plan = PLANS.find((p) => p.id === planId && p.price > 0);

  if (!plan) {
    res.status(400).json({ error: "Invalid paid plan ID" });
    return;
  }

  try {
    const order = await razorpay!.orders.create({
      amount: plan.price * 100,
      currency: "INR",
      receipt: `virjoy_${req.user!.id}_${Date.now()}`,
      notes: {
        userId: String(req.user!.id),
        planId: plan.id,
        userEmail: req.user!.email,
      },
    });

    req.log.info({ userId: req.user!.id, planId, orderId: order.id }, "Payment order created");

    res.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      planId: plan.id,
      planName: plan.name,
      keyId: process.env.RAZORPAY_KEY_ID,
    });
  } catch (err: any) {
    req.log.error({ err }, "Failed to create Razorpay order");
    res.status(500).json({ error: "Could not create payment order. Please try again." });
  }
});

/**
 * POST /api/payments/verify
 * Verify Razorpay payment signature, activate plan, and add credits.
 *
 * Body: { orderId, paymentId, signature, planId }
 */
router.post("/payments/verify", requireAuth, requireMobileVerified, async (req, res) => {
  const { orderId, paymentId, signature, planId } = req.body as {
    orderId?: string;
    paymentId?: string;
    signature?: string;
    planId?: string;
  };

  if (!orderId || !paymentId || !signature || !planId) {
    res.status(400).json({ error: "orderId, paymentId, signature, and planId are required" });
    return;
  }

  const plan = PLANS.find((p) => p.id === planId && p.price > 0);
  if (!plan) {
    res.status(400).json({ error: "Invalid plan" });
    return;
  }

  const isValid = verifyPaymentSignature({ orderId, paymentId, signature });
  if (!isValid) {
    req.log.warn({ userId: req.user!.id, orderId }, "Invalid payment signature");
    res.status(400).json({ error: "Payment verification failed. Invalid signature." });
    return;
  }

  const userId = req.user!.id;
  const creditsToAdd = PLAN_MONTHLY_CREDITS[planId] ?? 0;
  const endsAt = new Date();
  endsAt.setMonth(endsAt.getMonth() + 1);

  await db.transaction(async (tx) => {
    // Update user plan
    await tx
      .update(usersTable)
      .set({ currentPlan: planId, updatedAt: new Date() })
      .where(eq(usersTable.id, userId));

    // Record subscription
    await tx.insert(subscriptionsTable).values({
      userId,
      planId,
      status: "active",
      creditsPerMonth: creditsToAdd,
      endsAt,
      razorpayOrderId: orderId,
      razorpayPaymentId: paymentId,
    });
  });

  // Add monthly credits
  const newBalance = await addCredits({
    userId,
    amount: creditsToAdd,
    action: "subscription",
    description: `${plan.name} plan — ${creditsToAdd} monthly credits`,
  });

  req.log.info({ userId, planId, creditsAdded: creditsToAdd }, "Payment verified, plan activated");

  res.json({
    success: true,
    plan: planId,
    creditsAdded: creditsToAdd,
    newBalance,
    subscriptionEndsAt: endsAt.toISOString(),
  });
});

/**
 * POST /api/payments/webhook
 * Handles Razorpay subscription renewal webhooks.
 * Must be called with raw body (before JSON parsing).
 */
router.post("/payments/webhook", express_raw_body_middleware, async (req, res) => {
  const signature = req.headers["x-razorpay-signature"] as string;
  const rawBody = (req as any).rawBody as string;

  if (!verifyWebhookSignature(rawBody, signature)) {
    res.status(400).json({ error: "Invalid webhook signature" });
    return;
  }

  let payload: any;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    res.status(400).json({ error: "Invalid JSON payload" });
    return;
  }

  const event = payload.event as string;
  req.log.info({ event }, "Razorpay webhook received");

  if (event === "subscription.charged") {
    const sub = payload.payload?.subscription?.entity;
    const notes = sub?.notes as Record<string, string> | undefined;
    const userId = notes?.userId ? parseInt(notes.userId, 10) : NaN;
    const planId = notes?.planId as string | undefined;

    if (!isNaN(userId) && planId && PLAN_MONTHLY_CREDITS[planId]) {
      const creditsToAdd = PLAN_MONTHLY_CREDITS[planId]!;
      await addCredits({
        userId,
        amount: creditsToAdd,
        action: "subscription",
        description: `${planId} monthly renewal — ${creditsToAdd} credits`,
      });
      req.log.info({ userId, planId, creditsAdded: creditsToAdd }, "Subscription renewal processed");
    }
  }

  if (event === "subscription.cancelled") {
    const sub = payload.payload?.subscription?.entity;
    const notes = sub?.notes as Record<string, string> | undefined;
    const userId = notes?.userId ? parseInt(notes.userId, 10) : NaN;

    if (!isNaN(userId)) {
      await db
        .update(usersTable)
        .set({ currentPlan: "free", updatedAt: new Date() })
        .where(eq(usersTable.id, userId));

      req.log.info({ userId }, "Subscription cancelled — plan reset to free");
    }
  }

  res.json({ received: true });
});

/**
 * GET /api/payments/history
 * Returns billing history for the current user.
 */
router.get("/payments/history", requireAuth, requireMobileVerified, async (req, res) => {
  const subs = await db
    .select()
    .from(subscriptionsTable)
    .where(eq(subscriptionsTable.userId, req.user!.id))
    .orderBy(desc(subscriptionsTable.createdAt))
    .limit(20);

  res.json(
    subs.map((s) => ({
      id: s.id,
      planId: s.planId,
      status: s.status,
      creditsPerMonth: s.creditsPerMonth,
      startsAt: s.startsAt.toISOString(),
      endsAt: s.endsAt?.toISOString() ?? null,
      razorpayOrderId: s.razorpayOrderId,
      createdAt: s.createdAt.toISOString(),
    })),
  );
});

// Middleware to capture raw body for webhook verification
function express_raw_body_middleware(req: any, res: any, next: any) {
  let data = "";
  req.setEncoding("utf8");
  req.on("data", (chunk: string) => { data += chunk; });
  req.on("end", () => { req.rawBody = data; next(); });
}

export default router;
