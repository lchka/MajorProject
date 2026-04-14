import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import type { NextFunction, Request, Response } from "express";
import { CREATED_SUCCESS, SUCCESS_RES } from "../../utils/HttpError.js";
import type { PreferenceResponseDto } from "../../types/preference.dto.js";
import {
	createPreferenceSchema,
	updatePreferenceSchema,
} from "../../types/preference.dto.js";
import { can } from "../../middleware/permission.middleware.js";
import { Permission } from "../../types/permissions.dto.js";

// ------------------
// Typed mocks
// ------------------
const mockCreatePreference = jest.fn<
	(data: { name: string; description: string }) => Promise<PreferenceResponseDto>
>();

const mockGetAllPreferences = jest.fn<
	() => Promise<PreferenceResponseDto[]>
>();

const mockGetPreferenceById = jest.fn<
	(id: string) => Promise<PreferenceResponseDto>
>();

const mockUpdatePreference = jest.fn<
	(id: string, data: unknown) => Promise<PreferenceResponseDto>
>();

const mockDeletePreference = jest.fn<
	(id: string) => Promise<{ message: string }>
>();

const mockGetProfilePreferences = jest.fn<
	(profileId: string) => Promise<PreferenceResponseDto[]>
>();

// Mocks (ESM safe)
jest.mock("../../services/preference.service.js", () => ({
	__esModule: true,
	PreferenceService: class PreferenceService {
		createPreference = mockCreatePreference;
		getAllPreferences = mockGetAllPreferences;
		getPreferenceById = mockGetPreferenceById;
		updatePreference = mockUpdatePreference;
		deletePreference = mockDeletePreference;
		getProfilePreferences = mockGetProfilePreferences;
	},
}));

// Imports AFTER mocks
import preferenceController from "../../controllers/preference.controller.js";

// Test data
const basePreference: PreferenceResponseDto = {
	id: "11111111-1111-1111-1111-111111111111",
	name: "Low sugar",
	description: "Avoid added sugars",
	createdAt: new Date("2024-01-01T00:00:00.000Z"),
	updatedAt: new Date("2024-01-02T00:00:00.000Z"),
};

beforeEach(() => {
	jest.clearAllMocks();
});

// CREATE PREFERENCE
describe("PreferenceController.createPreference", () => {
	it("should create preference", async () => {
		mockCreatePreference.mockResolvedValue(basePreference);

		const req = {
			body: {
				name: basePreference.name,
				description: basePreference.description,
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

		await preferenceController.createPreference(req, res, next);

		expect(mockCreatePreference).toHaveBeenCalledWith({
			name: basePreference.name,
			description: basePreference.description,
		});
		expect(res.status).toHaveBeenCalledWith(CREATED_SUCCESS);
		expect(res.json).toHaveBeenCalledWith(basePreference);
		expect(next).not.toHaveBeenCalled();
	});
});

// GET ALL PREFERENCES
describe("PreferenceController.getAllPreferences", () => {
	it("should return all preferences", async () => {
		mockGetAllPreferences.mockResolvedValue([basePreference]);

		const req = {} as Request;
		const res = {
			status: jest.fn().mockReturnThis(),
			json: jest.fn(),
		} as unknown as Response;
		const next = jest.fn() as NextFunction;

		await preferenceController.getAllPreferences(req, res, next);

		expect(mockGetAllPreferences).toHaveBeenCalled();
		expect(res.status).toHaveBeenCalledWith(SUCCESS_RES);
		expect(res.json).toHaveBeenCalledWith([basePreference]);
		expect(next).not.toHaveBeenCalled();
	});
});

// GET PREFERENCE BY ID
describe("PreferenceController.getPreferenceById", () => {
	it("should return preference by id", async () => {
		mockGetPreferenceById.mockResolvedValue(basePreference);

		const req = { params: { id: basePreference.id } } as Request<{ id: string }>;
		const res = {
			status: jest.fn().mockReturnThis(),
			json: jest.fn(),
		} as unknown as Response;
		const next = jest.fn() as NextFunction;

		await preferenceController.getPreferenceById(req, res, next);

		expect(mockGetPreferenceById).toHaveBeenCalledWith(basePreference.id);
		expect(res.status).toHaveBeenCalledWith(SUCCESS_RES);
		expect(res.json).toHaveBeenCalledWith(basePreference);
		expect(next).not.toHaveBeenCalled();
	});
});

// UPDATE PREFERENCE
describe("PreferenceController.updatePreference", () => {
	it("should update preference", async () => {
		const updatedPreference = { ...basePreference, name: "Low sodium" };
		mockUpdatePreference.mockResolvedValue(updatedPreference);

		const req = {
			params: { id: basePreference.id },
			body: { name: "Low sodium" },
		} as Request<{ id: string }, Record<string, never>, { name: string }>;
		const res = {
			status: jest.fn().mockReturnThis(),
			json: jest.fn(),
		} as unknown as Response;
		const next = jest.fn() as NextFunction;

		await preferenceController.updatePreference(req, res, next);

		expect(mockUpdatePreference).toHaveBeenCalledWith(basePreference.id, {
			name: "Low sodium",
		});
		expect(res.status).toHaveBeenCalledWith(SUCCESS_RES);
		expect(res.json).toHaveBeenCalledWith(updatedPreference);
		expect(next).not.toHaveBeenCalled();
	});
});

// DELETE PREFERENCE
describe("PreferenceController.deletePreference", () => {
	it("should delete preference", async () => {
		mockDeletePreference.mockResolvedValue({
			message: "Preference deleted successfully",
		});

		const req = { params: { id: basePreference.id } } as Request<{ id: string }>;
		const res = {
			status: jest.fn().mockReturnThis(),
			json: jest.fn(),
		} as unknown as Response;
		const next = jest.fn() as NextFunction;

		await preferenceController.deletePreference(req, res, next);

		expect(mockDeletePreference).toHaveBeenCalledWith(basePreference.id);
		expect(res.status).toHaveBeenCalledWith(SUCCESS_RES);
		expect(res.json).toHaveBeenCalledWith({
			message: "Preference deleted successfully",
		});
		expect(next).not.toHaveBeenCalled();
	});
});

// PROFILE PREFERENCES
describe("PreferenceController.getProfilePreferences", () => {
	it("should return profile preferences", async () => {
		mockGetProfilePreferences.mockResolvedValue([basePreference]);

		const req = {
			params: { profileId: "profile-1" },
		} as Request<{ profileId: string }>;
		const res = {
			status: jest.fn().mockReturnThis(),
			json: jest.fn(),
		} as unknown as Response;
		const next = jest.fn() as NextFunction;

		await preferenceController.getProfilePreferences(req, res, next);

		expect(mockGetProfilePreferences).toHaveBeenCalledWith("profile-1");
		expect(res.status).toHaveBeenCalledWith(SUCCESS_RES);
		expect(res.json).toHaveBeenCalledWith([basePreference]);
		expect(next).not.toHaveBeenCalled();
	});
});

// VALIDATION
describe("Preference validation", () => {
	it("should accept valid create input", () => {
		const result = createPreferenceSchema.safeParse({
			name: "Low carb",
			description: "Limit refined carbs",
		});

		expect(result.success).toBe(true);
	});

	it("should reject empty update input", () => {
		const result = updatePreferenceSchema.safeParse({});

		expect(result.success).toBe(false);
	});
});

// ROUTE PERMISSIONS
describe("Preference route permissions", () => {
	it("should allow admin to create preference", () => {
		const req = {
			user: { id: "admin-1", role: { name: "admin" } },
		} as Request;
		const res = {} as Response;
		const next = jest.fn() as NextFunction;

		can(Permission.PREFERENCE_CREATE)(req, res, next);

		expect(next).toHaveBeenCalled();
	});

	it("should forbid user from creating preference", () => {
		const req = {
			user: { id: "user-1", role: { name: "user" } },
		} as Request;
		const res = {} as Response;
		const next = jest.fn() as NextFunction;

		expect(() => can(Permission.PREFERENCE_CREATE)(req, res, next)).toThrow();
		expect(next).not.toHaveBeenCalled();
	});

	it("should allow admin to update preference", () => {
		const req = {
			user: { id: "admin-1", role: { name: "admin" } },
		} as Request;
		const res = {} as Response;
		const next = jest.fn() as NextFunction;

		can(Permission.PREFERENCE_UPDATE)(req, res, next);

		expect(next).toHaveBeenCalled();
	});

	it("should forbid user from updating preference", () => {
		const req = {
			user: { id: "user-1", role: { name: "user" } },
		} as Request;
		const res = {} as Response;
		const next = jest.fn() as NextFunction;

		expect(() => can(Permission.PREFERENCE_UPDATE)(req, res, next)).toThrow();
		expect(next).not.toHaveBeenCalled();
	});

	it("should allow admin to delete preference", () => {
		const req = {
			user: { id: "admin-1", role: { name: "admin" } },
		} as Request;
		const res = {} as Response;
		const next = jest.fn() as NextFunction;

		can(Permission.PREFERENCE_DELETE)(req, res, next);

		expect(next).toHaveBeenCalled();
	});

	it("should forbid user from deleting preference", () => {
		const req = {
			user: { id: "user-1", role: { name: "user" } },
		} as Request;
		const res = {} as Response;
		const next = jest.fn() as NextFunction;

		expect(() => can(Permission.PREFERENCE_DELETE)(req, res, next)).toThrow();
		expect(next).not.toHaveBeenCalled();
	});
});
