import Razorpay from "razorpay";
import crypto from "crypto";
import { logger } from "../lib/logger";

const { RAZORPAY_KEY_ID, RAZORPAY_SECRET, RAZORPAY_WEBHOOK_SECRET } = process.env;

let _razorpay: Razorpay | null = null;

if (RAZORPAY_KEY_ID && RAZORPAY_SECRET) {
  _razorpay = new Razorpay({
    key_id: RAZORPAY_KEY_ID,
    key_secret: RAZORPAY_SECRET,
  });
  logger.info("Razorpay client initialized");
} else {
  logger.warn("Razorpay not configured — set RAZORPAY_KEY_ID and RAZORPAY_SECRET to enable payments");
}

export const razorpay = _razorpay;

export function isRazorpayReady(): boolean {
  return _razorpay !== null;
}

export function verifyPaymentSignature({
  orderId,
  paymentId,
  signature,
}: {
  orderId: string;
  paymentId: string;
  signature: string;
}): boolean {
  if (!RAZORPAY_SECRET) return false;
  const body = `${orderId}|${paymentId}`;
  const expected = crypto.createHmac("sha256", RAZORPAY_SECRET).update(body).digest("hex");
  return expected === signature;
}

export function verifyWebhookSignature(rawBody: string, signature: string): boolean {
  if (!RAZORPAY_WEBHOOK_SECRET) return false;
  const expected = crypto
    .createHmac("sha256", RAZORPAY_WEBHOOK_SECRET)
    .update(rawBody)
    .digest("hex");
  return expected === signature;
}

export const RAZORPAY_PLAN_IDS: Record<string, string> = {
  starter: process.env.RAZORPAY_PLAN_ID_STARTER ?? "",
  creator: process.env.RAZORPAY_PLAN_ID_CREATOR ?? "",
  premium: process.env.RAZORPAY_PLAN_ID_PREMIUM ?? "",
};
