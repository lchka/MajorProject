import { Request, Response, NextFunction } from "express";
import { HttpError } from "../utils/HttpError.js";
// Centralized error handling middleware for Express applications, designed to catch and handle errors thrown in route handlers and other middleware, providing consistent error responses to clients while also logging errors for debugging purposes. This middleware checks if the error is an instance of a custom HttpError class to determine the appropriate status code and message to return, and includes stack traces in development mode for easier debugging.
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
