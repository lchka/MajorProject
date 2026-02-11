// Extend Express Request type to include user from auth middleware
declare namespace Express {
  export interface Request {
    userId?: string;
    user?: {
      id: number;
      email: string;
      first_name: string;
      last_name: string;
      role: {
        id: number;
        name: string;
      };
    };
  }
}
