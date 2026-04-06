import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import type { NextFunction, Request, Response } from "express";
import { SUCCESS_RES } from "../../utils/HttpError.js";
import type { UserResponseDto } from "../../types/user.dto.js";
import {
	loginRequestSchema,
	registerRequestSchema,
} from "../../types/user.dto.js";

process.env.JWT_SECRET = "test-secret";

// Typed mocks
const mockRegisterUser = jest.fn<
	() => Promise<UserResponseDto>
>();

const mockAuthenticateUser = jest.fn<
	() => Promise<UserResponseDto>
>();

const mockGetUserById = jest.fn<
	() => Promise<UserResponseDto>
>();

const mockFindByName = jest.fn<
	() => Promise<{ id: string; name: string } | null>
>();

const mockSign = jest.fn<
	(payload: object, secret: string) => string
>();

const mockVerify = jest.fn<
	(token: string, secret: string) => unknown
>();

// Mocks (ESM safe)
jest.mock("../../services/user.service.js", () => ({
	__esModule: true,
	default: {
		registerUser: mockRegisterUser,
		authenticateUser: mockAuthenticateUser,
		getUserById: mockGetUserById,
	},
}));

jest.mock("../../repositories/role.repository.js", () => ({
	__esModule: true,
	default: {
		findByName: mockFindByName,
	},
}));

jest.mock("jsonwebtoken", () => ({
	__esModule: true,
	default: {
		sign: mockSign,
		verify: mockVerify,
	},
}));

// Imports AFTER mocks
import authService from "../../services/auth.service.js";
import authController from "../../controllers/auth.controller.js";

// Test data
const baseUser: UserResponseDto = {
	id: "11111111-1111-1111-1111-111111111111",
	email: "user@example.com",
	profile_id: "22222222-2222-2222-2222-222222222222",
	first_name: "Test",
	last_name: "User",
	role: {
		id: "33333333-3333-3333-3333-333333333333",
		name: "user",
	},
};

beforeEach(() => {
	jest.clearAllMocks();
});

// REGISTER
describe("AuthService.register", () => {
	it("should register user and return token", async () => {
		mockFindByName.mockResolvedValue({
			id: "role-1",
			name: "user",
		});

		mockRegisterUser.mockResolvedValue(baseUser);
		mockSign.mockReturnValue("token-123");

		const result = await authService.register({
			email: "user@example.com",
			password: "Pass123!",
			c_password: "Pass123!",
			first_name: "Test",
			last_name: "User",
		});

		expect(result).toMatchObject({
			message: "Registration successful",
			token: "token-123",
			user: baseUser,
		});
	});

	it("should throw if role not found", async () => {
		mockFindByName.mockResolvedValue(null);

		await expect(
			authService.register({
				email: "user@example.com",
				password: "Pass123!",
				c_password: "Pass123!",
				first_name: "Test",
				last_name: "User",
			}),
		).rejects.toThrow();
	});
});

// LOGIN
describe("AuthService.login", () => {
	it("should login and return token", async () => {
		mockAuthenticateUser.mockResolvedValue(baseUser);
		mockSign.mockReturnValue("token-abc");

		const result = await authService.login({
			email: "user@example.com",
			password: "Pass123!",
		});

		expect(result).toMatchObject({
			message: "Login successful",
			token: "token-abc",
			user: baseUser,
		});
	});

	it("should throw if authentication fails", async () => {
		mockAuthenticateUser.mockImplementation(() => {
			throw new Error("Invalid credentials");
		});

		await expect(
			authService.login({
				email: "user@example.com",
				password: "wrong",
			}),
		).rejects.toThrow();
	});
});

// TOKEN
describe("AuthService.verifyToken", () => {
	it("should return decoded payload", () => {
		mockVerify.mockReturnValue({ userId: "user-1" });

		const result = authService.verifyToken("token");

		expect(result).toEqual({ userId: "user-1" });
	});

	it("should throw for invalid token", () => {
		mockVerify.mockImplementation(() => {
			throw new Error();
		});

		expect(() => authService.verifyToken("bad")).toThrow();
	});
});

// CONTROLLER
describe("AuthController.logout", () => {
	it("should return success response", async () => {
		const req = {} as Request;

		const res = {
			status: jest.fn().mockReturnThis(),
			json: jest.fn(),
		} as unknown as Response;

		const next = jest.fn() as NextFunction;

		await authController.logout(req, res, next);

		expect(res.status).toHaveBeenCalledWith(SUCCESS_RES);
		expect(res.json).toHaveBeenCalledWith({
			message: "Logout successful",
		});
		expect(next).not.toHaveBeenCalled();
	});
});

// VALIDATION
describe("Auth validation", () => {
	it("should accept valid register input", () => {
		const result = registerRequestSchema.safeParse({
			email: "user@example.com",
			password: "Pass123!",
			c_password: "Pass123!",
			first_name: "Test",
			last_name: "User",
		});

		expect(result.success).toBe(true);
	});

	it("should reject invalid login email", () => {
		const result = loginRequestSchema.safeParse({
			email: "bad-email",
			password: "Pass123!",
		});

		expect(result.success).toBe(false);
	});
});