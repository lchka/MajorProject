import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import type { NextFunction, Request, Response } from "express";
import { CREATED_SUCCESS, SUCCESS_RES } from "../../utils/HttpError.js";
import type {
	CreateProfileDTO,
	ProfileResponseDTO,
	UpdateProfileDTO,
} from "../../types/profile.dto.js";
import {
	createProfileSchema,
	updateProfileSchema,
} from "../../types/profile.dto.js";
import { can } from "../../middleware/permission.middleware.js";
import { Permission } from "../../types/permissions.dto.js";

// ------------------
// Typed mocks
// ------------------
const mockCreateProfile = jest.fn<
	(userId: string, data: CreateProfileDTO) => Promise<ProfileResponseDTO>
>();

const mockGetAllProfiles = jest.fn<
	() => Promise<ProfileResponseDTO[]>
>();

const mockGetProfileById = jest.fn<
	(id: string) => Promise<ProfileResponseDTO>
>();

const mockGetProfileByUserId = jest.fn<
	(userId: string) => Promise<ProfileResponseDTO[]>
>();

const mockUpdateProfile = jest.fn<
	(id: string, data: UpdateProfileDTO) => Promise<ProfileResponseDTO>
>();

const mockDeleteProfile = jest.fn<
	(id: string) => Promise<{ message: string }>
>();

// Mocks (ESM safe)
jest.mock("../../services/profile.service.js", () => ({
	__esModule: true,
	ProfileService: class ProfileService {
		createProfile = mockCreateProfile;
		getAllProfiles = mockGetAllProfiles;
		getProfileById = mockGetProfileById;
		getProfileByUserId = mockGetProfileByUserId;
		updateProfile = mockUpdateProfile;
		deleteProfile = mockDeleteProfile;
	},
}));

const mockUploadProfileImageToS3 = jest.fn<
	(userId: string, file: Express.Multer.File) => Promise<string>
>();

jest.mock("../../lib/s3.js", () => ({
	__esModule: true,
	uploadProfileImageToS3: mockUploadProfileImageToS3,
}));

// Imports AFTER mocks
import profileController from "../../controllers/profile.controller.js";

// Test data
const baseProfile: ProfileResponseDTO = {
	id: "11111111-1111-1111-1111-111111111111",
	userId: "22222222-2222-2222-2222-222222222222",
	first_name: "Test",
	last_name: "User",
	age: "25",
	profile_image: "https://example.com/profile.jpg",
	main_profile: true,
	isComplete: true,
	conditions: [],
	allergens: [],
	preferences: [],
};

beforeEach(() => {
	jest.clearAllMocks();
	mockUploadProfileImageToS3.mockResolvedValue(
		"https://example.com/profile.jpg",
	);
});

// CREATE PROFILE
describe("ProfileController.createProfile", () => {
	it("should create profile", async () => {
		mockCreateProfile.mockResolvedValue(baseProfile);

		const req = {
			userId: baseProfile.userId,
			body: {
				first_name: baseProfile.first_name,
				last_name: baseProfile.last_name,
				age: baseProfile.age,
				profile_image: baseProfile.profile_image,
			},
		} as Request<Record<string, never>, Record<string, never>, CreateProfileDTO>;
		const res = {
			status: jest.fn().mockReturnThis(),
			json: jest.fn(),
		} as unknown as Response;
		const next = jest.fn() as NextFunction;

		await profileController.createProfile(req, res, next);

		expect(mockCreateProfile).toHaveBeenCalled();
		expect(res.status).toHaveBeenCalledWith(CREATED_SUCCESS);
		expect(res.json).toHaveBeenCalledWith(baseProfile);
		expect(next).not.toHaveBeenCalled();
	});
});

// GET ALL PROFILES
describe("ProfileController.getAllProfiles", () => {
	it("should return all profiles", async () => {
		mockGetAllProfiles.mockResolvedValue([baseProfile]);

		const req = {} as Request;
		const res = {
			status: jest.fn().mockReturnThis(),
			json: jest.fn(),
		} as unknown as Response;
		const next = jest.fn() as NextFunction;

		await profileController.getAllProfiles(req, res, next);

		expect(mockGetAllProfiles).toHaveBeenCalled();
		expect(res.status).toHaveBeenCalledWith(SUCCESS_RES);
		expect(res.json).toHaveBeenCalledWith([baseProfile]);
		expect(next).not.toHaveBeenCalled();
	});
});

// GET PROFILE BY ID
describe("ProfileController.getProfileById", () => {
	it("should return profile by id", async () => {
		mockGetProfileById.mockResolvedValue(baseProfile);

		const req = { params: { id: baseProfile.id } } as Request<{ id: string }>;
		const res = {
			status: jest.fn().mockReturnThis(),
			json: jest.fn(),
		} as unknown as Response;
		const next = jest.fn() as NextFunction;

		await profileController.getProfileById(req, res, next);

		expect(mockGetProfileById).toHaveBeenCalledWith(baseProfile.id);
		expect(res.status).toHaveBeenCalledWith(SUCCESS_RES);
		expect(res.json).toHaveBeenCalledWith(baseProfile);
		expect(next).not.toHaveBeenCalled();
	});
});

// GET PROFILE BY USER ID
describe("ProfileController.getProfileByUserId", () => {
	it("should return profile by user id", async () => {
		mockGetProfileByUserId.mockResolvedValue([baseProfile]);

		const req = {
			params: { userId: baseProfile.userId },
		} as Request<{ userId: string }>;
		const res = {
			status: jest.fn().mockReturnThis(),
			json: jest.fn(),
		} as unknown as Response;
		const next = jest.fn() as NextFunction;

		await profileController.getProfileByUserId(req, res, next);

		expect(mockGetProfileByUserId).toHaveBeenCalledWith(baseProfile.userId);
		expect(res.status).toHaveBeenCalledWith(SUCCESS_RES);
		expect(res.json).toHaveBeenCalledWith([baseProfile]);
		expect(next).not.toHaveBeenCalled();
	});
});

// GET MY PROFILE
describe("ProfileController.getMyProfile", () => {
	it("should return my profile", async () => {
		mockGetProfileByUserId.mockResolvedValue([baseProfile]);

		const req = {
			userId: baseProfile.userId,
			user: { id: baseProfile.userId, role: { name: "user" } },
		} as Request;
		const res = {
			status: jest.fn().mockReturnThis(),
			json: jest.fn(),
		} as unknown as Response;
		const next = jest.fn() as NextFunction;

		await profileController.getMyProfile(req, res, next);

		expect(mockGetProfileByUserId).toHaveBeenCalledWith(baseProfile.userId);
		expect(res.status).toHaveBeenCalledWith(SUCCESS_RES);
		expect(res.json).toHaveBeenCalledWith([baseProfile]);
		expect(next).not.toHaveBeenCalled();
	});
});

// UPDATE PROFILE
describe("ProfileController.updateProfile", () => {
	it("should update profile", async () => {
		const updatedProfile = { ...baseProfile, first_name: "Updated" };
		mockUpdateProfile.mockResolvedValue(updatedProfile);

		const req = {
			params: { id: baseProfile.id },
			body: { first_name: "Updated" },
		} as Request<{ id: string }, Record<string, never>, UpdateProfileDTO>;
		const res = {
			status: jest.fn().mockReturnThis(),
			json: jest.fn(),
		} as unknown as Response;
		const next = jest.fn() as NextFunction;

		await profileController.updateProfile(req, res, next);

		expect(mockUpdateProfile).toHaveBeenCalledWith(baseProfile.id, {
			first_name: "Updated",
		});
		expect(res.status).toHaveBeenCalledWith(SUCCESS_RES);
		expect(res.json).toHaveBeenCalledWith(updatedProfile);
		expect(next).not.toHaveBeenCalled();
	});
});

// DELETE PROFILE
describe("ProfileController.deleteProfile", () => {
	it("should delete profile", async () => {
		mockDeleteProfile.mockResolvedValue({
			message: "Profile deleted successfully",
		});

		const req = { params: { id: baseProfile.id } } as Request<{ id: string }>;
		const res = {
			status: jest.fn().mockReturnThis(),
			json: jest.fn(),
		} as unknown as Response;
		const next = jest.fn() as NextFunction;

		await profileController.deleteProfile(req, res, next);

		expect(mockDeleteProfile).toHaveBeenCalledWith(baseProfile.id);
		expect(res.status).toHaveBeenCalledWith(SUCCESS_RES);
		expect(res.json).toHaveBeenCalledWith({
			message: "Profile deleted successfully",
		});
		expect(next).not.toHaveBeenCalled();
	});
});

// VALIDATION
describe("Profile validation", () => {
	it("should accept valid create input", () => {
		const result = createProfileSchema.safeParse({
			first_name: "Test",
			last_name: "User",
			age: "25",
			profile_image: "https://example.com/profile.png",
		});

		expect(result.success).toBe(true);
	});

	it("should accept empty update input", () => {
		const result = updateProfileSchema.safeParse({});

		expect(result.success).toBe(true);
	});
});

// ROUTE PERMISSIONS
describe("Profile route permissions", () => {
	it("should allow user to create profile", () => {
		const req = {
			user: { id: "user-1", role: { name: "user" } },
		} as Request;
		const res = {} as Response;
		const next = jest.fn() as NextFunction;

		can(Permission.PROFILE_CREATE)(req, res, next);

		expect(next).toHaveBeenCalled();
	});

	it("should allow moderator to view all profiles", () => {
		const req = {
			user: { id: "mod-1", role: { name: "moderator" } },
		} as Request;
		const res = {} as Response;
		const next = jest.fn() as NextFunction;

		can(Permission.PROFILE_VIEW_ALL)(req, res, next);

		expect(next).toHaveBeenCalled();
	});

	it("should allow admin to delete profile", () => {
		const req = {
			user: { id: "admin-1", role: { name: "admin" } },
		} as Request;
		const res = {} as Response;
		const next = jest.fn() as NextFunction;

		can(Permission.PROFILE_DELETE)(req, res, next);

		expect(next).toHaveBeenCalled();
	});

	it("should forbid user from viewing all profiles", () => {
		const req = {
			user: { id: "user-1", role: { name: "user" } },
		} as Request;
		const res = {} as Response;
		const next = jest.fn() as NextFunction;

		expect(() => can(Permission.PROFILE_VIEW_ALL)(req, res, next)).toThrow();
		expect(next).not.toHaveBeenCalled();
	});
});
