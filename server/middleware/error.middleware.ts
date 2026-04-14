import { Request, Response, NextFunction } from "express";
import { HttpError } from "../utils/HttpError.js";

export const errorHandler = (
  err: Error | HttpError,
  _req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction,
): void => {
  console.error("Error:", err);

  if (err instanceof HttpError) {
    res.status(err.statusCode).json({
      message: err.message,
      ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
    });
    return;
  }

  // Default to 500 server error
  res.status(500).json({
    message: err.message || "Internal Server Error",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
};
