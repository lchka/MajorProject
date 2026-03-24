import type {
	LoginSchemaInput,
	RegisterSchemaInput,
} from "../models/auth.schema";

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
