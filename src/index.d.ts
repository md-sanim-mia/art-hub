import "express";

declare global {
  namespace Express {
    interface User {
      id?: string;
      email?: string;
      fullName?: string;
      profilePic?: string;
      role?: string;
      isVerified?: boolean;
      accessToken?: string;
    }
  }
    interface Request {
      user?: User; // make it non-optional
    }
}

