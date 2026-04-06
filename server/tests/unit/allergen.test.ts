import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import type { NextFunction, Request, Response } from "express";
import { CREATED_SUCCESS, SUCCESS_RES } from "../../utils/HttpError.js";
import type { AllergenResponseDto } from "../../types/allergen.dto.js";
import {
	createAllergenSchema,
	updateAllergenSchema,
} from "../../types/allergen.dto.js";
import { can } from "../../middleware/permission.middleware.js";
import { Permission } from "../../types/permissions.dto.js";

// Typed mocks
const mockCreateAllergen = jest.fn<
	(data: { name: string; description: string }) => Promise<AllergenResponseDto>
>();

const mockGetAllAllergens = jest.fn<
	() => Promise<AllergenResponseDto[]>
>();

const mockGetAllergenById = jest.fn<
	(id: string) => Promise<AllergenResponseDto>
>();

const mockUpdateAllergen = jest.fn<
	(id: string, data: unknown) => Promise<AllergenResponseDto>
>();

const mockDeleteAllergen = jest.fn<
	(id: string) => Promise<{ message: string }>
>();

const mockGetProfileAllergens = jest.fn<
	(profileId: string) => Promise<AllergenResponseDto[]>
>();

// Mocks (ESM safe)
jest.mock("../../services/allergen.service.js", () => ({
	__esModule: true,
	default: {
		createAllergen: mockCreateAllergen,
		getAllAllergens: mockGetAllAllergens,
		getAllergenById: mockGetAllergenById,
		updateAllergen: mockUpdateAllergen,
		deleteAllergen: mockDeleteAllergen,
		getProfileAllergens: mockGetProfileAllergens,
	},
}));

// Imports AFTER mocks
import allergenController from "../../controllers/allergen.controller.js";

// Test data
const baseAllergen: AllergenResponseDto = {
	id: "11111111-1111-1111-1111-111111111111",
	name: "Peanuts",
	description: "Severe allergy",
	createdAt: new Date("2024-01-01T00:00:00.000Z"),
	updatedAt: new Date("2024-01-02T00:00:00.000Z"),
};

beforeEach(() => {
	jest.clearAllMocks();
});

// CREATE ALLERGEN
describe("AllergenController.createAllergen", () => {
	it("should create allergen", async () => {
		mockCreateAllergen.mockResolvedValue(baseAllergen);

		const req = {
			body: {
				name: baseAllergen.name,
				description: baseAllergen.description,
			},
		} as Request<Record<string, never>, Record<string, never>, {
			name: string;
			description: string;
		}>;
		const res = {
			status: jest.fn().mockReturnThis(),
			json: jest.fn(),
		} as unknown as Response;
		const next = jest.fn() as NextFunction;

		await allergenController.createAllergen(req, res, next);

		expect(mockCreateAllergen).toHaveBeenCalledWith({
			name: baseAllergen.name,
			description: baseAllergen.description,
		});
		expect(res.status).toHaveBeenCalledWith(CREATED_SUCCESS);
		expect(res.json).toHaveBeenCalledWith(baseAllergen);
		expect(next).not.toHaveBeenCalled();
	});
});

// GET ALL ALLERGENS
describe("AllergenController.getAllAllergens", () => {
	it("should return all allergens", async () => {
		mockGetAllAllergens.mockResolvedValue([baseAllergen]);

		const req = {} as Request;
		const res = {
			status: jest.fn().mockReturnThis(),
			json: jest.fn(),
		} as unknown as Response;
		const next = jest.fn() as NextFunction;

		await allergenController.getAllAllergens(req, res, next);

		expect(mockGetAllAllergens).toHaveBeenCalled();
		expect(res.status).toHaveBeenCalledWith(SUCCESS_RES);
		expect(res.json).toHaveBeenCalledWith([baseAllergen]);
		expect(next).not.toHaveBeenCalled();
	});
});

// GET ALLERGEN BY ID
describe("AllergenController.getAllergenById", () => {
	it("should return allergen by id", async () => {
		mockGetAllergenById.mockResolvedValue(baseAllergen);

		const req = { params: { id: baseAllergen.id } } as Request<{ id: string }>;
		const res = {
			status: jest.fn().mockReturnThis(),
			json: jest.fn(),
		} as unknown as Response;
		const next = jest.fn() as NextFunction;

		await allergenController.getAllergenById(req, res, next);

		expect(mockGetAllergenById).toHaveBeenCalledWith(baseAllergen.id);
		expect(res.status).toHaveBeenCalledWith(SUCCESS_RES);
		expect(res.json).toHaveBeenCalledWith(baseAllergen);
		expect(next).not.toHaveBeenCalled();
	});
});

// UPDATE ALLERGEN
describe("AllergenController.updateAllergen", () => {
	it("should update allergen", async () => {
		const updatedAllergen = { ...baseAllergen, name: "Shellfish" };
		mockUpdateAllergen.mockResolvedValue(updatedAllergen);

		const req = {
			params: { id: baseAllergen.id },
			body: { name: "Shellfish" },
		} as Request<{ id: string }, Record<string, never>, { name: string }>;
		const res = {
			status: jest.fn().mockReturnThis(),
			json: jest.fn(),
		} as unknown as Response;
		const next = jest.fn() as NextFunction;

		await allergenController.updateAllergen(req, res, next);

		expect(mockUpdateAllergen).toHaveBeenCalledWith(baseAllergen.id, {
			name: "Shellfish",
		});
		expect(res.status).toHaveBeenCalledWith(SUCCESS_RES);
		expect(res.json).toHaveBeenCalledWith(updatedAllergen);
		expect(next).not.toHaveBeenCalled();
	});
});

// DELETE ALLERGEN
describe("AllergenController.deleteAllergen", () => {
	it("should delete allergen", async () => {
		mockDeleteAllergen.mockResolvedValue({
			message: "Allergen deleted successfully",
		});

		const req = { params: { id: baseAllergen.id } } as Request<{ id: string }>;
		const res = {
			status: jest.fn().mockReturnThis(),
			json: jest.fn(),
		} as unknown as Response;
		const next = jest.fn() as NextFunction;

		await allergenController.deleteAllergen(req, res, next);

		expect(mockDeleteAllergen).toHaveBeenCalledWith(baseAllergen.id);
		expect(res.status).toHaveBeenCalledWith(SUCCESS_RES);
		expect(res.json).toHaveBeenCalledWith({
			message: "Allergen deleted successfully",
		});
		expect(next).not.toHaveBeenCalled();
	});
});

// PROFILE ALLERGENS
describe("AllergenController.getProfileAllergens", () => {
	it("should return profile allergens", async () => {
		mockGetProfileAllergens.mockResolvedValue([baseAllergen]);

		const req = {
			params: { profileId: "profile-1" },
		} as Request<{ profileId: string }>;
		const res = {
			status: jest.fn().mockReturnThis(),
			json: jest.fn(),
		} as unknown as Response;
		const next = jest.fn() as NextFunction;

		await allergenController.getProfileAllergens(req, res, next);

		expect(mockGetProfileAllergens).toHaveBeenCalledWith("profile-1");
		expect(res.status).toHaveBeenCalledWith(SUCCESS_RES);
		expect(res.json).toHaveBeenCalledWith([baseAllergen]);
		expect(next).not.toHaveBeenCalled();
	});
});

// VALIDATION
describe("Allergen validation", () => {
	it("should accept valid create input", () => {
		const result = createAllergenSchema.safeParse({
			name: "Dairy",
			description: "Avoid milk products",
		});

		expect(result.success).toBe(true);
	});

	it("should reject empty update input", () => {
		const result = updateAllergenSchema.safeParse({});

		expect(result.success).toBe(false);
	});
});

// ROUTE PERMISSIONS
describe("Allergen route permissions", () => {
	it("should allow admin to create allergen", () => {
		const req = {
			user: { id: "admin-1", role: { name: "admin" } },
		} as Request;
		const res = {} as Response;
		const next = jest.fn() as NextFunction;

		can(Permission.ALLERGEN_CREATE)(req, res, next);

		expect(next).toHaveBeenCalled();
	});

	it("should forbid user from creating allergen", () => {
		const req = {
			user: { id: "user-1", role: { name: "user" } },
		} as Request;
		const res = {} as Response;
		const next = jest.fn() as NextFunction;

		expect(() => can(Permission.ALLERGEN_CREATE)(req, res, next)).toThrow();
		expect(next).not.toHaveBeenCalled();
	});

	it("should allow admin to update allergen", () => {
		const req = {
			user: { id: "admin-1", role: { name: "admin" } },
		} as Request;
		const res = {} as Response;
		const next = jest.fn() as NextFunction;

		can(Permission.ALLERGEN_UPDATE)(req, res, next);

		expect(next).toHaveBeenCalled();
	});

	it("should forbid user from updating allergen", () => {
		const req = {
			user: { id: "user-1", role: { name: "user" } },
		} as Request;
		const res = {} as Response;
		const next = jest.fn() as NextFunction;

		expect(() => can(Permission.ALLERGEN_UPDATE)(req, res, next)).toThrow();
		expect(next).not.toHaveBeenCalled();
	});

	it("should allow admin to delete allergen", () => {
		const req = {
			user: { id: "admin-1", role: { name: "admin" } },
		} as Request;
		const res = {} as Response;
		const next = jest.fn() as NextFunction;

		can(Permission.ALLERGEN_DELETE)(req, res, next);

		expect(next).toHaveBeenCalled();
	});

	it("should forbid user from deleting allergen", () => {
		const req = {
			user: { id: "user-1", role: { name: "user" } },
		} as Request;
		const res = {} as Response;
		const next = jest.fn() as NextFunction;

		expect(() => can(Permission.ALLERGEN_DELETE)(req, res, next)).toThrow();
		expect(next).not.toHaveBeenCalled();
	});
});
