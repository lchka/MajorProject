// Extend Express Request type to include user from auth middleware
declare namespace Express {
  export interface Request {
    userId?: string;
    user?: {
      id: string;
      email: string;
      first_name: string;
      last_name: string;
      role: {
        id: string;
        name: string;
      };
    };
    file?: Express.Multer.File;
  }
}
