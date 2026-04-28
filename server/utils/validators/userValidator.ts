import { z } from "zod";

export const updateUserSchema = z
  .object({
    email: z
      .string()
      .trim()
      .email("Must be a valid email address")
      .toLowerCase()
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
  .transform((val) => (val === "" ? undefined : val))
  .optional()
  .refine(
    (val) => val === undefined || val.length >= 2,
    "Last name must be at least 2 characters"
  )
  .refine(
    (val) => val === undefined || val.length <= 25,
    "Last name must be at most 25 characters"
  ),

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
    message: "At least one field must be provided for update",
  });

export type UpdateUserInput = z.infer<typeof updateUserSchema>;
