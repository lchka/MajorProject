import { z } from "zod";

export const roleSummarySchema = z.object({
  id: z.string().uuid("Role id must be a valid UUID"),
  name: z.string().min(1, "Role name is required"),
});

export const userResponseSchema = z.object({
  id: z.string().uuid("User id must be a valid UUID"),
  email: z.string().email("Must be a valid email address"),
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().min(1, "Last name is required"),
  role: roleSummarySchema,
});

export const registerRequestSchema = z
  .object({
    first_name: z
      .string()
      .trim()
      .min(2, "First name must be at least 2 characters")
      .max(25, "First name must be at most 25 characters"),
    last_name: z
      .string()
      .trim()
      .min(2, "Last name must be at least 2 characters")
      .max(25, "Last name must be at most 25 characters"),
    email: z
      .string()
      .trim()
      .toLowerCase()
      .email("Must be a valid email address"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters long")
      .regex(
        /^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).{8,}$/,
        "Password must contain uppercase, lowercase, number and special character",
      ),
    c_password: z.string().min(1, "Confirm password is required"),
  })
  .refine((data) => data.password === data.c_password, {
    message: "Passwords do not match",
    path: ["c_password"],
  });

export const loginRequestSchema = z.object({
  email: z.string().trim().toLowerCase().email("Must be a valid email address"),
  password: z.string().min(1, "Password is required"),
});

export const authResponseSchema = z.object({
  message: z.string(),
  token: z.string().min(1, "Token is required"),
  user: userResponseSchema,
});

export const createUserSchema = z.object({
  email: z.string().trim().toLowerCase().email("Must be a valid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters long")
    .regex(
      /^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).{8,}$/,
      "Password must contain uppercase, lowercase, number and special character",
    ),
  first_name: z
    .string()
    .trim()
    .min(2, "First name must be at least 2 characters")
    .max(25, "First name must be at most 25 characters"),
  last_name: z
    .string()
    .trim()
    .min(2, "Last name must be at least 2 characters")
    .max(25, "Last name must be at most 25 characters"),
  roleId: z.string().uuid("Role id must be a valid UUID"),
});

export const updateUserSchema = z
  .object({
    email: z
      .string()
      .trim()
      .toLowerCase()
      .email("Must be a valid email address")
      .optional(),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters long")
      .regex(
        /^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).{8,}$/,
        "Password must contain uppercase, lowercase, number and special character",
      )
      .optional(),
    first_name: z
      .string()
      .trim()
      .min(2, "First name must be at least 2 characters")
      .max(25, "First name must be at most 25 characters")
      .optional(),
    last_name: z
      .string()
      .trim()
      .min(2, "Last name must be at least 2 characters")
      .max(25, "Last name must be at most 25 characters")
      .optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided for update",
  });

export const updateProfileSchema = z
  .object({
    first_name: z
      .string()
      .trim()
      .min(2, "First name must be at least 2 characters")
      .max(25, "First name must be at most 25 characters")
      .optional(),
    last_name: z
      .string()
      .trim()
      .min(2, "Last name must be at least 2 characters")
      .max(25, "Last name must be at most 25 characters")
      .optional(),
    nickname: z
      .string()
      .trim()
      .max(25, "Nickname must be at most 25 characters")
      .optional(),
    age: z
      .number()
      .int("Age must be a whole number")
      .min(1, "Age must be at least 1")
      .max(150, "Age must be at most 150")
      .optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided for profile update",
  });

export type UserResponseDto = z.infer<typeof userResponseSchema>;
export type RegisterRequestDto = z.infer<typeof registerRequestSchema>;
export type LoginRequestDto = z.infer<typeof loginRequestSchema>;
export type AuthResponseDto = z.infer<typeof authResponseSchema>;
export type CreateUserDto = z.infer<typeof createUserSchema>;
export type UpdateUserDto = z.infer<typeof updateUserSchema>;
export type UpdateProfileDto = z.infer<typeof updateProfileSchema>;
