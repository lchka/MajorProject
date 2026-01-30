import { checkSchema, validationResult } from "express-validator";

export const validate = (schema) => {
  return [
    checkSchema(schema),
    (req, res, next) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: "Validation failed",
          details: errors.array().map((err) => err.msg),
        });
      }
      next();
    },
  ];
};