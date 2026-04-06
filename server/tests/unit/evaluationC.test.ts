import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import type { NextFunction, Request, Response } from "express";
import { CREATED_SUCCESS, SUCCESS_RES } from "../../utils/HttpError.js";
import type {
	CreateEvaluationContextDto,
	EvaluateProductRequestDto,
	EvaluationContextResponseDto,
	UpdateEvaluationContextDto,
} from "../../types/evaluationContext.dto.js";
import {
	createEvaluationContextSchema,
	evaluateProductRequestSchema,
	updateEvaluationContextSchema,
} from "../../types/evaluationContext.dto.js";
import { can } from "../../middleware/permission.middleware.js";
import { Permission } from "../../types/permissions.dto.js";

// ------------------
// Typed mocks
// ------------------
const mockCreateEvaluationContext = jest.fn<
	(data: CreateEvaluationContextDto) => Promise<EvaluationContextResponseDto>
>();

const mockEvaluateProduct = jest.fn<
	(data: EvaluateProductRequestDto) => Promise<EvaluationContextResponseDto>
>();

const mockGetAllEvaluationContexts = jest.fn<
	() => Promise<EvaluationContextResponseDto[]>
>();

const mockGetEvaluationContextsForUser = jest.fn<
	(userId: string) => Promise<EvaluationContextResponseDto[]>
>();

const mockGetEvaluationContextById = jest.fn<
	(id: string) => Promise<EvaluationContextResponseDto>
>();

const mockGetEvaluationContextsByProfileId = jest.fn<
	(profileId: string) => Promise<EvaluationContextResponseDto[]>
>();

const mockGetEvaluationContextsByProductId = jest.fn<
	(productId: string) => Promise<EvaluationContextResponseDto[]>
>();

const mockGetEvaluationContextsByProductIdForUser = jest.fn<
	(userId: string, productId: string) => Promise<EvaluationContextResponseDto[]>
>();

const mockUpdateEvaluationContext = jest.fn<
	(id: string, data: UpdateEvaluationContextDto) => Promise<EvaluationContextResponseDto>
>();

const mockReevaluateEvaluationContext = jest.fn<
	(id: string) => Promise<EvaluationContextResponseDto>
>();

const mockDeleteEvaluationContext = jest.fn<
	(id: string) => Promise<{ message: string }>
>();

// ------------------
// Mocks (ESM safe)
// ------------------
jest.mock("../../services/evaluationContext.service.js", () => ({
	__esModule: true,
	EvaluationContextService: class EvaluationContextService {
		createEvaluationContext = mockCreateEvaluationContext;
		evaluateProduct = mockEvaluateProduct;
		getAllEvaluationContexts = mockGetAllEvaluationContexts;
		getEvaluationContextsForUser = mockGetEvaluationContextsForUser;
		getEvaluationContextById = mockGetEvaluationContextById;
		getEvaluationContextsByProfileId = mockGetEvaluationContextsByProfileId;
		getEvaluationContextsByProductId = mockGetEvaluationContextsByProductId;
		getEvaluationContextsByProductIdForUser =
			mockGetEvaluationContextsByProductIdForUser;
		updateEvaluationContext = mockUpdateEvaluationContext;
		reevaluateEvaluationContext = mockReevaluateEvaluationContext;
		deleteEvaluationContext = mockDeleteEvaluationContext;
	},
}));

// ------------------
// Imports AFTER mocks
// ------------------
import evaluationContextController from "../../controllers/evaluationContext.controller.js";

// ------------------
// Test data
// ------------------
const baseContext: EvaluationContextResponseDto = {
	id: "11111111-1111-4111-8111-111111111111",
	profileId: "22222222-2222-4222-8222-222222222222",
	productId: "33333333-3333-4333-8333-333333333333",
	promptId: null,
	resultJson: { status: "safe", score: 90 },
	createdAt: new Date("2024-01-01T00:00:00.000Z"),
	updatedAt: new Date("2024-01-02T00:00:00.000Z"),
};

beforeEach(() => {
	jest.clearAllMocks();
});

// ======================
// CREATE CONTEXT
// ======================
describe("EvaluationContextController.createEvaluationContext", () => {
	it("should create evaluation context", async () => {
		mockCreateEvaluationContext.mockResolvedValue(baseContext);

		const req = {
			body: {
				profileId: baseContext.profileId,
				productId: baseContext.productId,
				resultJson: baseContext.resultJson,
			},
		} as Request<Record<string, never>, Record<string, never>, CreateEvaluationContextDto>;
		const res = {
			status: jest.fn().mockReturnThis(),
			json: jest.fn(),
		} as unknown as Response;
		const next = jest.fn() as NextFunction;

		await evaluationContextController.createEvaluationContext(req, res, next);

		expect(mockCreateEvaluationContext).toHaveBeenCalledWith({
			profileId: baseContext.profileId,
			productId: baseContext.productId,
			resultJson: baseContext.resultJson,
		});
		expect(res.status).toHaveBeenCalledWith(CREATED_SUCCESS);
		expect(res.json).toHaveBeenCalledWith(baseContext);
		expect(next).not.toHaveBeenCalled();
	});
});

// ======================
// EVALUATE PRODUCT
// ======================
describe("EvaluationContextController.evaluateProduct", () => {
	it("should evaluate product", async () => {
		mockEvaluateProduct.mockResolvedValue(baseContext);

		const req = {
			body: {
				profileId: baseContext.profileId,
				productId: baseContext.productId,
			},
		} as Request<Record<string, never>, Record<string, never>, EvaluateProductRequestDto>;
		const res = {
			status: jest.fn().mockReturnThis(),
			json: jest.fn(),
		} as unknown as Response;
		const next = jest.fn() as NextFunction;

		await evaluationContextController.evaluateProduct(req, res, next);

		expect(mockEvaluateProduct).toHaveBeenCalledWith({
			profileId: baseContext.profileId,
			productId: baseContext.productId,
		});
		expect(res.status).toHaveBeenCalledWith(CREATED_SUCCESS);
		expect(res.json).toHaveBeenCalledWith(baseContext);
		expect(next).not.toHaveBeenCalled();
	});
});

// ======================
// GET ALL CONTEXTS
// ======================
describe("EvaluationContextController.getAllEvaluationContexts", () => {
	it("should return contexts for admin", async () => {
		mockGetAllEvaluationContexts.mockResolvedValue([baseContext]);

		const req = {
			userId: "admin-1",
			user: { id: "admin-1", role: { name: "admin" } },
		} as Request;
		const res = {
			status: jest.fn().mockReturnThis(),
			json: jest.fn(),
		} as unknown as Response;
		const next = jest.fn() as NextFunction;

		await evaluationContextController.getAllEvaluationContexts(req, res, next);

		expect(mockGetAllEvaluationContexts).toHaveBeenCalled();
		expect(res.status).toHaveBeenCalledWith(SUCCESS_RES);
		expect(res.json).toHaveBeenCalledWith([baseContext]);
		expect(next).not.toHaveBeenCalled();
	});
});

// ======================
// GET CONTEXT BY ID
// ======================
describe("EvaluationContextController.getEvaluationContextById", () => {
	it("should return context by id", async () => {
		mockGetEvaluationContextById.mockResolvedValue(baseContext);

		const req = { params: { id: baseContext.id } } as Request<{ id: string }>;
		const res = {
			status: jest.fn().mockReturnThis(),
			json: jest.fn(),
		} as unknown as Response;
		const next = jest.fn() as NextFunction;

		await evaluationContextController.getEvaluationContextById(req, res, next);

		expect(mockGetEvaluationContextById).toHaveBeenCalledWith(baseContext.id);
		expect(res.status).toHaveBeenCalledWith(SUCCESS_RES);
		expect(res.json).toHaveBeenCalledWith(baseContext);
		expect(next).not.toHaveBeenCalled();
	});
});

// ======================
// GET CONTEXTS BY PROFILE
// ======================
describe("EvaluationContextController.getEvaluationContextsByProfileId", () => {
	it("should return contexts by profile", async () => {
		mockGetEvaluationContextsByProfileId.mockResolvedValue([baseContext]);

		const req = {
			params: { profileId: baseContext.profileId },
		} as Request<{ profileId: string }>;
		const res = {
			status: jest.fn().mockReturnThis(),
			json: jest.fn(),
		} as unknown as Response;
		const next = jest.fn() as NextFunction;

		await evaluationContextController.getEvaluationContextsByProfileId(req, res, next);

		expect(mockGetEvaluationContextsByProfileId).toHaveBeenCalledWith(baseContext.profileId);
		expect(res.status).toHaveBeenCalledWith(SUCCESS_RES);
		expect(res.json).toHaveBeenCalledWith([baseContext]);
		expect(next).not.toHaveBeenCalled();
	});
});

// ======================
// GET CONTEXTS BY PRODUCT
// ======================
describe("EvaluationContextController.getEvaluationContextsByProductId", () => {
	it("should return contexts by product for admin", async () => {
		mockGetEvaluationContextsByProductId.mockResolvedValue([baseContext]);

		const req = {
			params: { productId: baseContext.productId },
			userId: "admin-1",
			user: { id: "admin-1", role: { name: "admin" } },
		} as Request<{ productId: string }>;
		const res = {
			status: jest.fn().mockReturnThis(),
			json: jest.fn(),
		} as unknown as Response;
		const next = jest.fn() as NextFunction;

		await evaluationContextController.getEvaluationContextsByProductId(req, res, next);

		expect(mockGetEvaluationContextsByProductId).toHaveBeenCalledWith(baseContext.productId);
		expect(res.status).toHaveBeenCalledWith(SUCCESS_RES);
		expect(res.json).toHaveBeenCalledWith([baseContext]);
		expect(next).not.toHaveBeenCalled();
	});
});

// ======================
// GET CONTEXTS FOR USER
// ======================
describe("EvaluationContextController.getEvaluationContextsForUser", () => {
	it("should return contexts for user", async () => {
		mockGetEvaluationContextsForUser.mockResolvedValue([baseContext]);

		const req = {
			userId: "user-1",
			user: { id: "user-1", role: { name: "user" } },
		} as Request;
		const res = {
			status: jest.fn().mockReturnThis(),
			json: jest.fn(),
		} as unknown as Response;
		const next = jest.fn() as NextFunction;

		await evaluationContextController.getEvaluationContextsForUser(req, res, next);

		expect(mockGetEvaluationContextsForUser).toHaveBeenCalledWith("user-1");
		expect(res.status).toHaveBeenCalledWith(SUCCESS_RES);
		expect(res.json).toHaveBeenCalledWith([baseContext]);
		expect(next).not.toHaveBeenCalled();
	});
});

// ======================
// UPDATE CONTEXT
// ======================
describe("EvaluationContextController.updateEvaluationContext", () => {
	it("should update context", async () => {
		const updatedContext = { ...baseContext, resultJson: { status: "caution" } };
		mockUpdateEvaluationContext.mockResolvedValue(updatedContext);

		const req = {
			params: { id: baseContext.id },
			body: { resultJson: { status: "caution" } },
		} as Request<{ id: string }, Record<string, never>, UpdateEvaluationContextDto>;
		const res = {
			status: jest.fn().mockReturnThis(),
			json: jest.fn(),
		} as unknown as Response;
		const next = jest.fn() as NextFunction;

		await evaluationContextController.updateEvaluationContext(req, res, next);

		expect(mockUpdateEvaluationContext).toHaveBeenCalledWith(baseContext.id, {
			resultJson: { status: "caution" },
		});
		expect(res.status).toHaveBeenCalledWith(SUCCESS_RES);
		expect(res.json).toHaveBeenCalledWith(updatedContext);
		expect(next).not.toHaveBeenCalled();
	});
});

// ======================
// REEVALUATE CONTEXT
// ======================
describe("EvaluationContextController.reevaluateEvaluationContext", () => {
	it("should reevaluate context", async () => {
		const updatedContext = { ...baseContext, resultJson: { status: "avoid" } };
		mockReevaluateEvaluationContext.mockResolvedValue(updatedContext);

		const req = { params: { id: baseContext.id } } as Request<{ id: string }>;
		const res = {
			status: jest.fn().mockReturnThis(),
			json: jest.fn(),
		} as unknown as Response;
		const next = jest.fn() as NextFunction;

		await evaluationContextController.reevaluateEvaluationContext(req, res, next);

		expect(mockReevaluateEvaluationContext).toHaveBeenCalledWith(baseContext.id);
		expect(res.status).toHaveBeenCalledWith(SUCCESS_RES);
		expect(res.json).toHaveBeenCalledWith(updatedContext);
		expect(next).not.toHaveBeenCalled();
	});
});

// ======================
// DELETE CONTEXT
// ======================
describe("EvaluationContextController.deleteEvaluationContext", () => {
	it("should delete context", async () => {
		mockDeleteEvaluationContext.mockResolvedValue({
			message: `Evaluation context with id '${baseContext.id}' deleted successfully`,
		});

		const req = { params: { id: baseContext.id } } as Request<{ id: string }>;
		const res = {
			status: jest.fn().mockReturnThis(),
			json: jest.fn(),
		} as unknown as Response;
		const next = jest.fn() as NextFunction;

		await evaluationContextController.deleteEvaluationContext(req, res, next);

		expect(mockDeleteEvaluationContext).toHaveBeenCalledWith(baseContext.id);
		expect(res.status).toHaveBeenCalledWith(SUCCESS_RES);
		expect(res.json).toHaveBeenCalledWith({
			message: `Evaluation context with id '${baseContext.id}' deleted successfully`,
		});
		expect(next).not.toHaveBeenCalled();
	});
});

// ======================
// VALIDATION
// ======================
describe("Evaluation context validation", () => {
	it("should accept valid create input", () => {
		const result = createEvaluationContextSchema.safeParse({
			profileId: baseContext.profileId,
			productId: baseContext.productId,
			resultJson: baseContext.resultJson,
		});

		expect(result.success).toBe(true);
	});

	it("should accept valid evaluate input", () => {
		const result = evaluateProductRequestSchema.safeParse({
			profileId: baseContext.profileId,
			productId: baseContext.productId,
		});

		expect(result.success).toBe(true);
	});

	it("should reject empty update input", () => {
		const result = updateEvaluationContextSchema.safeParse({});

		expect(result.success).toBe(false);
	});
});

// ======================
// ROUTE PERMISSIONS
// ======================
describe("Evaluation context route permissions", () => {
	it("should allow user to create context", () => {
		const req = {
			user: { id: "user-1", role: { name: "user" } },
		} as Request;
		const res = {} as Response;
		const next = jest.fn() as NextFunction;

		can(Permission.EVALUATION_CONTEXT_CREATE)(req, res, next);

		expect(next).toHaveBeenCalled();
	});

	it("should allow moderator to update context", () => {
		const req = {
			user: { id: "mod-1", role: { name: "moderator" } },
		} as Request;
		const res = {} as Response;
		const next = jest.fn() as NextFunction;

		can(Permission.EVALUATION_CONTEXT_UPDATE)(req, res, next);

		expect(next).toHaveBeenCalled();
	});

	it("should allow admin to delete context", () => {
		const req = {
			user: { id: "admin-1", role: { name: "admin" } },
		} as Request;
		const res = {} as Response;
		const next = jest.fn() as NextFunction;

		can(Permission.EVALUATION_CONTEXT_DELETE)(req, res, next);

		expect(next).toHaveBeenCalled();
	});

	it("should allow user to delete context", () => {
		const req = {
			user: { id: "user-1", role: { name: "user" } },
		} as Request;
		const res = {} as Response;
		const next = jest.fn() as NextFunction;

		can(Permission.EVALUATION_CONTEXT_DELETE)(req, res, next);

		expect(next).toHaveBeenCalled();
	});
});
