import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import type { NextFunction, Request, Response } from "express";
import { CREATED_SUCCESS, SUCCESS_RES } from "../../utils/HttpError.js";
import type { ConditionResponseDto } from "../../types/condition.dto.js";
import {
	conditionSchema,
	updateConditionSchema,
} from "../../utils/validators/conditionValidator.js";
import { can } from "../../middleware/permission.middleware.js";
import { Permission } from "../../types/permissions.dto.js";

// Typed mocks
const mockCreateCondition = jest.fn<
	(data: { name: string; description: string }) => Promise<ConditionResponseDto>
>();

const mockGetAllConditions = jest.fn<
	() => Promise<ConditionResponseDto[]>
>();

const mockGetConditionById = jest.fn<
	(id: string) => Promise<ConditionResponseDto>
>();

const mockUpdateCondition = jest.fn<
	(id: string, data: unknown) => Promise<ConditionResponseDto>
>();

const mockDeleteCondition = jest.fn<
	(id: string) => Promise<{ message: string }>
>();

const mockGetProfileConditions = jest.fn<
	(profileId: string) => Promise<ConditionResponseDto[]>
>();

// Mocks (ESM safe)
jest.mock("../../services/condition.service.js", () => ({
	__esModule: true,
	default: {
		createCondition: mockCreateCondition,
		getAllConditions: mockGetAllConditions,
		getConditionById: mockGetConditionById,
		updateCondition: mockUpdateCondition,
		deleteCondition: mockDeleteCondition,
		getProfileConditions: mockGetProfileConditions,
	},
}));

// Imports AFTER mocks
import conditionController from "../../controllers/condition.controller.js";

// Test data
const baseCondition: ConditionResponseDto = {
	id: "11111111-1111-1111-1111-111111111111",
	name: "Diabetes",
	description: "Chronic condition",
	createdAt: new Date("2024-01-01T00:00:00.000Z"),
	updatedAt: new Date("2024-01-02T00:00:00.000Z"),
};

beforeEach(() => {
	jest.clearAllMocks();
});

// CREATE CONDITION
describe("ConditionController.createCondition", () => {
	it("should create condition", async () => {
		mockCreateCondition.mockResolvedValue(baseCondition);

		const req = {
			body: { name: baseCondition.name, description: baseCondition.description },
		} as Request<Record<string, never>, Record<string, never>, {
			name: string;
			description: string;
		}>;
		const res = {
			status: jest.fn().mockReturnThis(),
			json: jest.fn(),
		} as unknown as Response;
		const next = jest.fn() as NextFunction;

		await conditionController.createCondition(req, res, next);

		expect(mockCreateCondition).toHaveBeenCalledWith({
			name: baseCondition.name,
			description: baseCondition.description,
		});
		expect(res.status).toHaveBeenCalledWith(CREATED_SUCCESS);
		expect(res.json).toHaveBeenCalledWith(baseCondition);
		expect(next).not.toHaveBeenCalled();
	});
});

// GET ALL CONDITIONS
describe("ConditionController.getAllConditions", () => {
	it("should return all conditions", async () => {
		mockGetAllConditions.mockResolvedValue([baseCondition]);

		const req = {} as Request;
		const res = {
			status: jest.fn().mockReturnThis(),
			json: jest.fn(),
		} as unknown as Response;
		const next = jest.fn() as NextFunction;

		await conditionController.getAllConditions(req, res, next);

		expect(mockGetAllConditions).toHaveBeenCalled();
		expect(res.status).toHaveBeenCalledWith(SUCCESS_RES);
		expect(res.json).toHaveBeenCalledWith([baseCondition]);
		expect(next).not.toHaveBeenCalled();
	});
});

// GET CONDITION BY ID
describe("ConditionController.getConditionById", () => {
	it("should return condition by id", async () => {
		mockGetConditionById.mockResolvedValue(baseCondition);

		const req = { params: { id: baseCondition.id } } as Request<{ id: string }>;
		const res = {
			status: jest.fn().mockReturnThis(),
			json: jest.fn(),
		} as unknown as Response;
		const next = jest.fn() as NextFunction;

		await conditionController.getConditionById(req, res, next);

		expect(mockGetConditionById).toHaveBeenCalledWith(baseCondition.id);
		expect(res.status).toHaveBeenCalledWith(SUCCESS_RES);
		expect(res.json).toHaveBeenCalledWith(baseCondition);
		expect(next).not.toHaveBeenCalled();
	});
});

// UPDATE CONDITION
describe("ConditionController.updateCondition", () => {
	it("should update condition", async () => {
		const updatedCondition = { ...baseCondition, name: "Asthma" };
		mockUpdateCondition.mockResolvedValue(updatedCondition);

		const req = {
			params: { id: baseCondition.id },
			body: { name: "Asthma" },
		} as Request<{ id: string }, Record<string, never>, { name: string }>;
		const res = {
			status: jest.fn().mockReturnThis(),
			json: jest.fn(),
		} as unknown as Response;
		const next = jest.fn() as NextFunction;

		await conditionController.updateCondition(req, res, next);

		expect(mockUpdateCondition).toHaveBeenCalledWith(baseCondition.id, {
			name: "Asthma",
		});
		expect(res.status).toHaveBeenCalledWith(SUCCESS_RES);
		expect(res.json).toHaveBeenCalledWith(updatedCondition);
		expect(next).not.toHaveBeenCalled();
	});
});

// DELETE CONDITION
describe("ConditionController.deleteCondition", () => {
	it("should delete condition", async () => {
		mockDeleteCondition.mockResolvedValue({
			message: "Condition deleted successfully",
		});

		const req = { params: { id: baseCondition.id } } as Request<{ id: string }>;
		const res = {
			status: jest.fn().mockReturnThis(),
			json: jest.fn(),
		} as unknown as Response;
		const next = jest.fn() as NextFunction;

		await conditionController.deleteCondition(req, res, next);

		expect(mockDeleteCondition).toHaveBeenCalledWith(baseCondition.id);
		expect(res.status).toHaveBeenCalledWith(SUCCESS_RES);
		expect(res.json).toHaveBeenCalledWith({
			message: "Condition deleted successfully",
		});
		expect(next).not.toHaveBeenCalled();
	});
});

// PROFILE CONDITIONS
describe("ConditionController.getProfileConditions", () => {
	it("should return profile conditions", async () => {
		mockGetProfileConditions.mockResolvedValue([baseCondition]);

		const req = {
			params: { profileId: "profile-1" },
		} as Request<{ profileId: string }>;
		const res = {
			status: jest.fn().mockReturnThis(),
			json: jest.fn(),
		} as unknown as Response;
		const next = jest.fn() as NextFunction;

		await conditionController.getProfileConditions(req, res, next);

		expect(mockGetProfileConditions).toHaveBeenCalledWith("profile-1");
		expect(res.status).toHaveBeenCalledWith(SUCCESS_RES);
		expect(res.json).toHaveBeenCalledWith([baseCondition]);
		expect(next).not.toHaveBeenCalled();
	});
});

// VALIDATION
describe("Condition validation", () => {
	it("should accept valid create input", () => {
		const result = conditionSchema.safeParse({
			name: "Asthma",
			description: "Chronic respiratory condition",
		});

		expect(result.success).toBe(true);
	});

	it("should reject empty update input", () => {
		const result = updateConditionSchema.safeParse({});

		expect(result.success).toBe(false);
	});
});

// ROUTE PERMISSIONS
describe("Condition route permissions", () => {
	it("should allow admin to create condition", () => {
		const req = {
			user: { id: "admin-1", role: { name: "admin" } },
		} as Request;
		const res = {} as Response;
		const next = jest.fn() as NextFunction;

		can(Permission.CONDITION_CREATE)(req, res, next);

		expect(next).toHaveBeenCalled();
	});

	it("should forbid user from creating condition", () => {
		const req = {
			user: { id: "user-1", role: { name: "user" } },
		} as Request;
		const res = {} as Response;
		const next = jest.fn() as NextFunction;

		expect(() => can(Permission.CONDITION_CREATE)(req, res, next)).toThrow();
		expect(next).not.toHaveBeenCalled();
	});

	it("should allow admin to update condition", () => {
		const req = {
			user: { id: "admin-1", role: { name: "admin" } },
		} as Request;
		const res = {} as Response;
		const next = jest.fn() as NextFunction;

		can(Permission.CONDITION_UPDATE)(req, res, next);

		expect(next).toHaveBeenCalled();
	});

	it("should forbid user from updating condition", () => {
		const req = {
			user: { id: "user-1", role: { name: "user" } },
		} as Request;
		const res = {} as Response;
		const next = jest.fn() as NextFunction;

		expect(() => can(Permission.CONDITION_UPDATE)(req, res, next)).toThrow();
		expect(next).not.toHaveBeenCalled();
	});

	it("should allow admin to delete condition", () => {
		const req = {
			user: { id: "admin-1", role: { name: "admin" } },
		} as Request;
		const res = {} as Response;
		const next = jest.fn() as NextFunction;

		can(Permission.CONDITION_DELETE)(req, res, next);

		expect(next).toHaveBeenCalled();
	});

	it("should forbid user from deleting condition", () => {
		const req = {
			user: { id: "user-1", role: { name: "user" } },
		} as Request;
		const res = {} as Response;
		const next = jest.fn() as NextFunction;

		expect(() => can(Permission.CONDITION_DELETE)(req, res, next)).toThrow();
		expect(next).not.toHaveBeenCalled();
	});
});
