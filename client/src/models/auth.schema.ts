import { z } from "zod";

const passwordRegex = /^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).{8,}$/;
// The registerSchema defines the validation rules for user registration, ensuring that the first name, last name, email, password, and confirm password fields meet specific criteria. The loginSchema defines the validation rules for user login, ensuring that the email and password fields are valid. Both schemas use Zod for schema validation and provide clear error messages for invalid inputs.
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
				passwordRegex,
				"Password must contain uppercase, lowercase, number and special character",
			),
		c_password: z.string().min(1, "Confirm password is required"),
	})
	.refine((data) => data.password === data.c_password, {
		message: "Passwords do not match",
		path: ["c_password"],
	});

export const loginSchema = z.object({
	email: z.string().trim().email("Must be a valid email address").toLowerCase(),
	password: z.string().min(1, "Password is required"),
});

export type RegisterSchemaInput = z.infer<typeof registerSchema>;
export type LoginSchemaInput = z.infer<typeof loginSchema>;
