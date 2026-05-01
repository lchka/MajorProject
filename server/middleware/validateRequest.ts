import { Request, Response, NextFunction, RequestHandler } from "express";
import { z, ZodError } from "zod";
// Middleware function to validate incoming request bodies against a specified Zod schema, ensuring that the data adheres to the expected structure and types before it reaches the route handlers, with error handling to return informative validation error messages to the client when validation fails.
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
