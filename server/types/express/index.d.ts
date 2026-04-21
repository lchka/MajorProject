import "express";

declare module "express-serve-static-core" {
  interface Request {
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

export {};