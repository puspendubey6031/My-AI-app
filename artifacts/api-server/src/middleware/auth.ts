import type { Request, Response, NextFunction } from "express";
import { verifyFirebaseToken, isFirebaseReady } from "../services/firebase";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";

export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Authorization token required" });
    return;
  }

  if (!isFirebaseReady()) {
    res.status(503).json({ error: "Authentication service not configured" });
    return;
  }

  const token = authHeader.slice(7);

  try {
    const decoded = await verifyFirebaseToken(token);
    const [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.firebaseUid, decoded.uid));

    if (!user) {
      res.status(401).json({
        error: "Account not registered. Please complete sign-up at /api/auth/register",
      });
      return;
    }

    req.user = user;
    next();
  } catch (err: any) {
    req.log?.warn?.({ err: err.message }, "Firebase token verification failed");
    res.status(401).json({ error: "Invalid or expired token" });
  }
}

export async function requireMobileVerified(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  if (!req.user?.mobileVerified) {
    res.status(403).json({
      error:
        "Mobile verification required. Please verify your phone number to continue.",
    });
    return;
  }
  next();
}

export async function optionalAuth(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ") || !isFirebaseReady()) {
    next();
    return;
  }

  const token = authHeader.slice(7);

  try {
    const decoded = await verifyFirebaseToken(token);
    const [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.firebaseUid, decoded.uid));
    if (user) req.user = user;
  } catch {
    // Non-blocking — invalid token in optional context is ignored
  }

  next();
}
