import { z } from "zod";

export const registerSchema = z
  .object({
    first_name: z
      .string()
      .trim()
      .min(2, "First name must be at least 2 characters")
      .max(25, "First name must be at most 25 characters"),

    last_name: z
      .string()
      .trim()
      .max(25, "Last name must be at most 25 characters")
      .optional()
      .refine(
        (value) => value === undefined || value.length === 0 || value.length >= 2,
        "Last name must be at least 2 characters",
      ),

    email: z
      .string()
      .trim()
      .email("Must be a valid email address")
      .toLowerCase(),

    password: z
      .string()
      .min(8, "Password must be at least 8 characters long")
      .regex(
        /^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).{8,}$/,
        "Password must contain uppercase, lowercase, number and special character",
      ),

    c_password: z.string(),
  })
  .refine((data) => data.password === data.c_password, {
    message: "Passwords do not match",
    path: ["c_password"],
  });

export const loginSchema = z.object({
  email: z.string().trim().email("Must be a valid email address").toLowerCase(),

  password: z.string().min(1, "Password is required"),
});

export const googleLoginSchema = z.object({
  token: z.string().min(1, "Google token is required"),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type GoogleLoginInput = z.infer<typeof googleLoginSchema>;
