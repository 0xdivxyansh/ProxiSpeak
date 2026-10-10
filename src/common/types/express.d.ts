export interface AuthenticatedUser {
  uid: string;
  email?: string;
  displayName?: string;
  emailVerified?: boolean;
}

declare global {
  namespace Express {
    interface Request {
      id?: string;
      user?: AuthenticatedUser;
    }
  }
}
