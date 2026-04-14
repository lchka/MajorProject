import { Request, Response, NextFunction, RequestHandler } from "express";
import { z, ZodError } from "zod";

export const validate = <T extends z.ZodTypeAny>(schema: T): RequestHandler => {
  return async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      req.body = await schema.parseAsync(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({
          error: "Validation failed",
          details: error.issues.map((err) => err.message),
        });
        return;
      }
      next(error);
    }
  };
};
