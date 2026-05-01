import type {
	LoginSchemaInput,
	RegisterSchemaInput,
} from "../models/auth.schema";
// The auth.types module defines TypeScript types and interfaces related to user authentication and authorization. It includes types for the input data required for user registration and login, as well as interfaces for representing user roles, authenticated user information, and the structure of the authentication response returned by the backend API. These types help ensure type safety and consistency when working with authentication-related data throughout the application.
export type RegisterInput = RegisterSchemaInput;
export type LoginInput = LoginSchemaInput;

export interface RoleSummary {
	id: string;
	name: string;
}

export interface AuthUser {
	id: string;
	email: string;
	roleId: string;
	role: RoleSummary;
}

export interface AuthResponse {
	message?: string;
	token: string;
	user: AuthUser;
}
