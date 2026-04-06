import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import type { NextFunction, Request, Response } from "express";
import { HttpError, SUCCESS_RES } from "../../utils/HttpError.js";
import type { UserResponseDto } from "../../types/user.dto.js";
import { updateUserSchema } from "../../utils/validators/userValidator.js";
import { canModifyUser } from "../../middleware/permission.middleware.js";

// Typed mocks
const mockGetUserById = jest.fn<
	(id: string) => Promise<UserResponseDto>
>();

const mockGetAllUsers = jest.fn<
	() => Promise<UserResponseDto[]>
>();

const mockUpdateUser = jest.fn<
	(id: string, data: unknown) => Promise<UserResponseDto>
>();

const mockSoftDeleteUser = jest.fn<
	(id: string) => Promise<{ message: string }>
>();

const mockForceDeleteUser = jest.fn<
	(id: string) => Promise<{ message: string }>
>();

const mockRestoreUser = jest.fn<
	(id: string) => Promise<UserResponseDto>
>();

// Mocks (ESM safe)
jest.mock("../../services/user.service.js", () => ({
	__esModule: true,
	default: {
		getUserById: mockGetUserById,
		getAllUsers: mockGetAllUsers,
		updateUser: mockUpdateUser,
		softDeleteUser: mockSoftDeleteUser,
		forceDeleteUser: mockForceDeleteUser,
		restoreUser: mockRestoreUser,
	},
}));

// Imports AFTER mocks
import userController from "../../controllers/user.controller.js";

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

// GET PROFILE
describe("UserController.getProfile", () => {
	it("should return current user profile", async () => {
		mockGetUserById.mockResolvedValue(baseUser);

		const req = { userId: baseUser.id } as Request;
		const res = {
			status: jest.fn().mockReturnThis(),
			json: jest.fn(),
		} as unknown as Response;
		const next = jest.fn() as NextFunction;

		await userController.getProfile(req, res, next);

		expect(mockGetUserById).toHaveBeenCalledWith(baseUser.id);
		expect(res.status).toHaveBeenCalledWith(SUCCESS_RES);
		expect(res.json).toHaveBeenCalledWith(baseUser);
		expect(next).not.toHaveBeenCalled();
	});
});

// GET ALL USERS
describe("UserController.getAllUsers", () => {
	it("should return all users", async () => {
		mockGetAllUsers.mockResolvedValue([baseUser]);

		const req = {} as Request;
		const res = {
			status: jest.fn().mockReturnThis(),
			json: jest.fn(),
		} as unknown as Response;
		const next = jest.fn() as NextFunction;

		await userController.getAllUsers(req, res, next);

		expect(mockGetAllUsers).toHaveBeenCalled();
		expect(res.status).toHaveBeenCalledWith(SUCCESS_RES);
		expect(res.json).toHaveBeenCalledWith([baseUser]);
		expect(next).not.toHaveBeenCalled();
	});
});

// GET USER BY ID
describe("UserController.getUserById", () => {
	it("should return user by id", async () => {
		mockGetUserById.mockResolvedValue(baseUser);

		const req = { params: { id: baseUser.id } } as Request<{ id: string }>;
		const res = {
			status: jest.fn().mockReturnThis(),
			json: jest.fn(),
		} as unknown as Response;
		const next = jest.fn() as NextFunction;

		await userController.getUserById(req, res, next);

		expect(mockGetUserById).toHaveBeenCalledWith(baseUser.id);
		expect(res.status).toHaveBeenCalledWith(SUCCESS_RES);
		expect(res.json).toHaveBeenCalledWith(baseUser);
		expect(next).not.toHaveBeenCalled();
	});
});

// UPDATE USER
describe("UserController.updateUser", () => {
	it("should update user by id", async () => {
		const updatedUser = { ...baseUser, first_name: "New" };
		mockUpdateUser.mockResolvedValue(updatedUser);

		const req = {
			params: { id: baseUser.id },
			body: { first_name: "New" },
		} as Request<{ id: string }>;
		const res = {
			status: jest.fn().mockReturnThis(),
			json: jest.fn(),
		} as unknown as Response;
		const next = jest.fn() as NextFunction;

		await userController.updateUser(req, res, next);

		expect(mockUpdateUser).toHaveBeenCalledWith(baseUser.id, {
			first_name: "New",
		});
		expect(res.status).toHaveBeenCalledWith(SUCCESS_RES);
		expect(res.json).toHaveBeenCalledWith(updatedUser);
		expect(next).not.toHaveBeenCalled();
	});
});

// UPDATE PROFILE
describe("UserController.updateProfile", () => {
	it("should update current user", async () => {
		const updatedUser = { ...baseUser, last_name: "Updated" };
		mockUpdateUser.mockResolvedValue(updatedUser);

		const req = {
			userId: baseUser.id,
			body: { last_name: "Updated" },
		} as Request<Record<string, never>, Record<string, never>, { last_name: string }>;
		const res = {
			status: jest.fn().mockReturnThis(),
			json: jest.fn(),
		} as unknown as Response;
		const next = jest.fn() as NextFunction;

		await userController.updateProfile(req, res, next);

		expect(mockUpdateUser).toHaveBeenCalledWith(baseUser.id, {
			last_name: "Updated",
		});
		expect(res.status).toHaveBeenCalledWith(SUCCESS_RES);
		expect(res.json).toHaveBeenCalledWith(updatedUser);
		expect(next).not.toHaveBeenCalled();
	});
});

// SOFT DELETE USER
describe("UserController.softDeleteUser", () => {
	it("should soft delete user", async () => {
		mockSoftDeleteUser.mockResolvedValue({
			message: "User soft deleted successfully",
		});

		const req = { params: { id: baseUser.id } } as Request<{ id: string }>;
		const res = {
			status: jest.fn().mockReturnThis(),
			json: jest.fn(),
		} as unknown as Response;
		const next = jest.fn() as NextFunction;

		await userController.softDeleteUser(req, res, next);

		expect(mockSoftDeleteUser).toHaveBeenCalledWith(baseUser.id);
		expect(res.status).toHaveBeenCalledWith(SUCCESS_RES);
		expect(res.json).toHaveBeenCalledWith({
			message: "User soft deleted successfully",
		});
		expect(next).not.toHaveBeenCalled();
	});
});

// FORCE DELETE USER
describe("UserController.forceDeleteUser", () => {
	it("should force delete user", async () => {
		mockForceDeleteUser.mockResolvedValue({
			message: "User permanently deleted",
		});

		const req = { params: { id: baseUser.id } } as Request<{ id: string }>;
		const res = {
			status: jest.fn().mockReturnThis(),
			json: jest.fn(),
		} as unknown as Response;
		const next = jest.fn() as NextFunction;

		await userController.forceDeleteUser(req, res, next);

		expect(mockForceDeleteUser).toHaveBeenCalledWith(baseUser.id);
		expect(res.status).toHaveBeenCalledWith(SUCCESS_RES);
		expect(res.json).toHaveBeenCalledWith({
			message: "User permanently deleted",
		});
		expect(next).not.toHaveBeenCalled();
	});
});

// RESTORE USER
describe("UserController.restoreUser", () => {
	it("should restore user", async () => {
		mockRestoreUser.mockResolvedValue(baseUser);

		const req = { params: { id: baseUser.id } } as Request<{ id: string }>;
		const res = {
			status: jest.fn().mockReturnThis(),
			json: jest.fn(),
		} as unknown as Response;
		const next = jest.fn() as NextFunction;

		await userController.restoreUser(req, res, next);

		expect(mockRestoreUser).toHaveBeenCalledWith(baseUser.id);
		expect(res.status).toHaveBeenCalledWith(SUCCESS_RES);
		expect(res.json).toHaveBeenCalledWith(baseUser);
		expect(next).not.toHaveBeenCalled();
	});
});

// PERMISSIONS
describe("canModifyUser", () => {
	it("should allow admin to modify any user", () => {
		const req = {
			params: { id: "user-2" },
			user: { id: "admin-1", role: { name: "admin" } },
		} as Request<{ id: string }>;
		const res = {} as Response;
		const next = jest.fn() as NextFunction;

		canModifyUser(req, res, next);

		expect(next).toHaveBeenCalled();
	});

	it("should allow user to modify own account", () => {
		const req = {
			params: { id: baseUser.id },
			user: { id: baseUser.id, role: { name: "user" } },
		} as Request<{ id: string }>;
		const res = {} as Response;
		const next = jest.fn() as NextFunction;

		canModifyUser(req, res, next);

		expect(next).toHaveBeenCalled();
	});

	it("should deny user modifying someone else", () => {
		const req = {
			params: { id: "user-2" },
			user: { id: baseUser.id, role: { name: "user" } },
		} as Request<{ id: string }>;
		const res = {} as Response;
		const next = jest.fn() as NextFunction;

		expect(() => canModifyUser(req, res, next)).toThrow(HttpError);
		expect(next).not.toHaveBeenCalled();
	});
});

// VALIDATION
describe("User validation", () => {
	it("should accept valid update input", () => {
		const result = updateUserSchema.safeParse({
			first_name: "Updated",
		});

		expect(result.success).toBe(true);
	});

	it("should reject empty update input", () => {
		const result = updateUserSchema.safeParse({});

		expect(result.success).toBe(false);
	});
});
