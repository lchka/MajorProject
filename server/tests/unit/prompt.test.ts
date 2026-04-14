import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import type { NextFunction, Request, Response } from "express";
import { CREATED_SUCCESS, SUCCESS_RES } from "../../utils/HttpError.js";
import type { Category, PromptResponseDto } from "../../types/prompt.dto.js";
import {
	createPromptSchema,
	updatePromptSchema,
} from "../../types/prompt.dto.js";
import { can } from "../../middleware/permission.middleware.js";
import { Permission } from "../../types/permissions.dto.js";

// Typed mocks
const mockCreatePrompt = jest.fn<
	(data: { prompt_text: string; category: Category }) => Promise<PromptResponseDto>
>();

const mockGetAllPrompts = jest.fn<
	() => Promise<PromptResponseDto[]>
>();

const mockGetPromptById = jest.fn<
	(id: string) => Promise<PromptResponseDto>
>();

const mockUpdatePrompt = jest.fn<
	(id: string, data: unknown) => Promise<PromptResponseDto>
>();

const mockDeletePrompt = jest.fn<
	(id: string) => Promise<{ message: string }>
>();

// Mocks (ESM safe)
jest.mock("../../services/prompt.service.js", () => ({
	__esModule: true,
	PromptService: class PromptService {
		createPrompt = mockCreatePrompt;
		getAllPrompts = mockGetAllPrompts;
		getPromptById = mockGetPromptById;
		updatePrompt = mockUpdatePrompt;
		deletePrompt = mockDeletePrompt;
	},
}));

// Imports AFTER mocks
import promptController from "../../controllers/prompt.controller.js";

// Test data
const basePrompt: PromptResponseDto = {
	id: "11111111-1111-1111-1111-111111111111",
	prompt_text: "Tell me about a cleanser for sensitive skin.",
	category: "Cleanser",
	createdAt: new Date("2024-01-01T00:00:00.000Z"),
	updatedAt: new Date("2024-01-02T00:00:00.000Z"),
};

beforeEach(() => {
	jest.clearAllMocks();
});

// CREATE PROMPT
describe("PromptController.createPrompt", () => {
	it("should create prompt", async () => {
		mockCreatePrompt.mockResolvedValue(basePrompt);

		const req = {
			body: { prompt_text: basePrompt.prompt_text, category: basePrompt.category },
		} as Request<Record<string, never>, Record<string, never>, {
			prompt_text: string;
			category: Category;
		}>;
		const res = {
			status: jest.fn().mockReturnThis(),
			json: jest.fn(),
		} as unknown as Response;
		const next = jest.fn() as NextFunction;

		await promptController.createPrompt(req, res, next);

		expect(mockCreatePrompt).toHaveBeenCalledWith({
			prompt_text: basePrompt.prompt_text,
			category: basePrompt.category,
		});
		expect(res.status).toHaveBeenCalledWith(CREATED_SUCCESS);
		expect(res.json).toHaveBeenCalledWith(basePrompt);
		expect(next).not.toHaveBeenCalled();
	});
});

// GET ALL PROMPTS
describe("PromptController.getAllPrompts", () => {
	it("should return all prompts", async () => {
		mockGetAllPrompts.mockResolvedValue([basePrompt]);

		const req = {} as Request;
		const res = {
			status: jest.fn().mockReturnThis(),
			json: jest.fn(),
		} as unknown as Response;
		const next = jest.fn() as NextFunction;

		await promptController.getAllPrompts(req, res, next);

		expect(mockGetAllPrompts).toHaveBeenCalled();
		expect(res.status).toHaveBeenCalledWith(SUCCESS_RES);
		expect(res.json).toHaveBeenCalledWith([basePrompt]);
		expect(next).not.toHaveBeenCalled();
	});
});

// GET PROMPT BY ID
describe("PromptController.getPromptById", () => {
	it("should return prompt by id", async () => {
		mockGetPromptById.mockResolvedValue(basePrompt);

		const req = { params: { id: basePrompt.id } } as Request<{ id: string }>;
		const res = {
			status: jest.fn().mockReturnThis(),
			json: jest.fn(),
		} as unknown as Response;
		const next = jest.fn() as NextFunction;

		await promptController.getPromptById(req, res, next);

		expect(mockGetPromptById).toHaveBeenCalledWith(basePrompt.id);
		expect(res.status).toHaveBeenCalledWith(SUCCESS_RES);
		expect(res.json).toHaveBeenCalledWith(basePrompt);
		expect(next).not.toHaveBeenCalled();
	});
});

// UPDATE PROMPT
describe("PromptController.updatePrompt", () => {
	it("should update prompt", async () => {
		const updatedPrompt = { ...basePrompt, prompt_text: "Updated prompt text" };
		mockUpdatePrompt.mockResolvedValue(updatedPrompt);

		const req = {
			params: { id: basePrompt.id },
			body: { prompt_text: "Updated prompt text" },
		} as Request<{ id: string }, Record<string, never>, { prompt_text: string }>;
		const res = {
			status: jest.fn().mockReturnThis(),
			json: jest.fn(),
		} as unknown as Response;
		const next = jest.fn() as NextFunction;

		await promptController.updatePrompt(req, res, next);

		expect(mockUpdatePrompt).toHaveBeenCalledWith(basePrompt.id, {
			prompt_text: "Updated prompt text",
		});
		expect(res.status).toHaveBeenCalledWith(SUCCESS_RES);
		expect(res.json).toHaveBeenCalledWith(updatedPrompt);
		expect(next).not.toHaveBeenCalled();
	});
});

// DELETE PROMPT
describe("PromptController.deletePrompt", () => {
	it("should delete prompt", async () => {
		mockDeletePrompt.mockResolvedValue({
			message: `Prompt with id '${basePrompt.id}' deleted successfully`,
		});

		const req = { params: { id: basePrompt.id } } as Request<{ id: string }>;
		const res = {
			status: jest.fn().mockReturnThis(),
			json: jest.fn(),
		} as unknown as Response;
		const next = jest.fn() as NextFunction;

		await promptController.deletePrompt(req, res, next);

		expect(mockDeletePrompt).toHaveBeenCalledWith(basePrompt.id);
		expect(res.status).toHaveBeenCalledWith(SUCCESS_RES);
		expect(res.json).toHaveBeenCalledWith({
			message: `Prompt with id '${basePrompt.id}' deleted successfully`,
		});
		expect(next).not.toHaveBeenCalled();
	});
});

// VALIDATION
describe("Prompt validation", () => {
	it("should accept valid create input", () => {
		const result = createPromptSchema.safeParse({
			prompt_text: "This is a valid prompt text",
			category: "Cleanser",
		});

		expect(result.success).toBe(true);
	});

	it("should accept empty update input", () => {
		const result = updatePromptSchema.safeParse({});

		expect(result.success).toBe(true);
	});
});

// ROUTE PERMISSIONS
describe("Prompt route permissions", () => {
	it("should allow admin to create prompt", () => {
		const req = {
			user: { id: "admin-1", role: { name: "admin" } },
		} as Request;
		const res = {} as Response;
		const next = jest.fn() as NextFunction;

		can(Permission.PROMPT_CREATE)(req, res, next);

		expect(next).toHaveBeenCalled();
	});

	it("should forbid user from creating prompt", () => {
		const req = {
			user: { id: "user-1", role: { name: "user" } },
		} as Request;
		const res = {} as Response;
		const next = jest.fn() as NextFunction;

		expect(() => can(Permission.PROMPT_CREATE)(req, res, next)).toThrow();
		expect(next).not.toHaveBeenCalled();
	});

	it("should allow admin to update prompt", () => {
		const req = {
			user: { id: "admin-1", role: { name: "admin" } },
		} as Request;
		const res = {} as Response;
		const next = jest.fn() as NextFunction;

		can(Permission.PROMPT_UPDATE)(req, res, next);

		expect(next).toHaveBeenCalled();
	});

	it("should forbid moderator from updating prompt", () => {
		const req = {
			user: { id: "mod-1", role: { name: "moderator" } },
		} as Request;
		const res = {} as Response;
		const next = jest.fn() as NextFunction;

		expect(() => can(Permission.PROMPT_UPDATE)(req, res, next)).toThrow();
		expect(next).not.toHaveBeenCalled();
	});

	it("should allow admin to delete prompt", () => {
		const req = {
			user: { id: "admin-1", role: { name: "admin" } },
		} as Request;
		const res = {} as Response;
		const next = jest.fn() as NextFunction;

		can(Permission.PROMPT_DELETE)(req, res, next);

		expect(next).toHaveBeenCalled();
	});

	it("should forbid user from deleting prompt", () => {
		const req = {
			user: { id: "user-1", role: { name: "user" } },
		} as Request;
		const res = {} as Response;
		const next = jest.fn() as NextFunction;

		expect(() => can(Permission.PROMPT_DELETE)(req, res, next)).toThrow();
		expect(next).not.toHaveBeenCalled();
	});
});
