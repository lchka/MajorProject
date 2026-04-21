import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import type { NextFunction, Request, Response } from "express";
import { BAD_REQUEST, SUCCESS_RES } from "../../utils/HttpError.js";

// mock service
const mockGetCurrentUvByCoordinates = jest.fn<
	(lat: number, lon: number) => Promise<{ uvIndex: number }>
>();

// mock module (esm safe)
jest.mock("../../services/weatherUv.service.js", () => ({
	__esModule: true,
	default: {
		getCurrentUvByCoordinates: mockGetCurrentUvByCoordinates,
	},
}));

// import after mock
import weatherController from "../../controllers/weather.controller.js";

// test data
const baseUv = {
	uvIndex: 5,
};

beforeEach(() => {
	jest.clearAllMocks();
});

// get current uv
describe("WeatherController.getCurrentUv", () => {
	it("should return uv data for valid coordinates", async () => {
		mockGetCurrentUvByCoordinates.mockResolvedValue(baseUv);

		const req = {
	query: { lat: "53.3498", lon: "-6.2603" },
} as unknown as Request;

		const res = {
			status: jest.fn().mockReturnThis(),
			json: jest.fn(),
		} as unknown as Response;

		const next = jest.fn() as NextFunction;

		await weatherController.getCurrentUv(req, res, next);

		expect(mockGetCurrentUvByCoordinates).toHaveBeenCalledWith(53.3498, -6.2603);
		expect(res.status).toHaveBeenCalledWith(SUCCESS_RES);
		expect(res.json).toHaveBeenCalledWith(baseUv);
		expect(next).not.toHaveBeenCalled();
	});

	it("should return bad request for missing or invalid coordinates", async () => {
		const req = {
			query: { lat: "invalid", lon: "invalid" },
		} as unknown as Request;

		const res = {
			status: jest.fn().mockReturnThis(),
			json: jest.fn(),
		} as unknown as Response;

		const next = jest.fn() as NextFunction;

		await weatherController.getCurrentUv(req, res, next);

		expect(res.status).toHaveBeenCalledWith(BAD_REQUEST);
		expect(res.json).toHaveBeenCalledWith({
			message: "Query params lat and lon are required numeric values.",
		});
		expect(mockGetCurrentUvByCoordinates).not.toHaveBeenCalled();
		expect(next).not.toHaveBeenCalled();
	});

	it("should call next on service error", async () => {
		mockGetCurrentUvByCoordinates.mockRejectedValue(new Error("service failed"));
const req = {
	query: { lat: "53.3498", lon: "-6.2603" },
} as unknown as Request;

		const res = {
			status: jest.fn().mockReturnThis(),
			json: jest.fn(),
		} as unknown as Response;

		const next = jest.fn() as NextFunction;

		await weatherController.getCurrentUv(req, res, next);

		expect(next).toHaveBeenCalled();
	});
});