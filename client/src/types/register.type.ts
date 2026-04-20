import { z } from "zod";

export const registerSchema = z
  .object({
    first_name: z
      .string()
      .min(1, "First name is required")
      .trim(),

    last_name: z
      .string()
      .trim()
      .optional()
      .refine(
        (val) => !val || val.length === 0 || val.length >= 2,
        "Last name must be at least 2 characters"
      ),

    email: z
      .string()
      .min(1, "Email is required")
      .email("Enter a valid email address")
      .toLowerCase()
      .trim(),

    password: z
      .string()
      .min(8, "Must be at least 8 characters")
      .regex(/[a-z]/, "Must include a lowercase letter")
      .regex(/[A-Z]/, "Must include an uppercase letter")
      .regex(/\d/, "Must include a number")
      .regex(/[^A-Za-z\d]/, "Must include a symbol"),

    c_password: z.string(),
  })
  .refine((data) => data.password === data.c_password, {
    message: "Passwords do not match",
    path: ["c_password"],
  });