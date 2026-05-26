declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number;
        firebaseUid: string;
        email: string;
        mobileNumber: string | null;
        mobileVerified: boolean;
        username: string | null;
        currentPlan: string;
        credits: number;
        freeCreditsLastClaimed: Date | null;
        createdAt: Date;
        updatedAt: Date;
      };
    }
  }
}

export {};
