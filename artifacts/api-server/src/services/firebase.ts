import admin from "firebase-admin";
import { logger } from "../lib/logger";

let initialized = false;

function init() {
  if (initialized || admin.apps.length > 0) {
    initialized = true;
    return;
  }

  const { FIREBASE_PROJECT_ID, FIREBASE_PRIVATE_KEY, FIREBASE_CLIENT_EMAIL } = process.env;

  if (!FIREBASE_PROJECT_ID || !FIREBASE_PRIVATE_KEY || !FIREBASE_CLIENT_EMAIL) {
    logger.warn(
      "Firebase not configured — set FIREBASE_PROJECT_ID, FIREBASE_PRIVATE_KEY, FIREBASE_CLIENT_EMAIL to enable authentication",
    );
    return;
  }

  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: FIREBASE_PROJECT_ID,
        privateKey: FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
        clientEmail: FIREBASE_CLIENT_EMAIL,
      }),
    });
    initialized = true;
    logger.info("Firebase Admin SDK initialized");
  } catch (err) {
    logger.error({ err }, "Firebase Admin SDK initialization failed");
  }
}

init();

export function isFirebaseReady(): boolean {
  return initialized;
}

export async function verifyFirebaseToken(token: string): Promise<admin.auth.DecodedIdToken> {
  if (!initialized) {
    throw new Error(
      "Firebase is not configured. Please set FIREBASE_PROJECT_ID, FIREBASE_PRIVATE_KEY, and FIREBASE_CLIENT_EMAIL.",
    );
  }
  return admin.auth().verifyIdToken(token, true);
}

export async function getFirebaseUser(uid: string): Promise<admin.auth.UserRecord> {
  if (!initialized) throw new Error("Firebase not configured");
  return admin.auth().getUser(uid);
}

export { admin };
