/// <reference types="jest" />
import request from "supertest";
import express, { Request, Response, NextFunction } from "express";

// fake auth middleware (for /me)
const fakeAuthMiddleware = (
	req: Request & { userId?: string },
	res: Response,
	next: NextFunction
): void => {
	if (!req.userId) {
		res.status(401).json({ error: "Authentication required" });
		return;
	}
	next();
};

// mock auth service
const mockRegister = jest.fn();
const mockLogin = jest.fn();
const mockGoogleLogin = jest.fn();
const mockGetCurrentUser = jest.fn();

jest.mock("../../services/auth.service.js", () => ({
	__esModule: true,
	default: {
		register: mockRegister,
		login: mockLogin,
		googleLogin: mockGoogleLogin,
		getCurrentUser: mockGetCurrentUser,
	},
}));

import authController from "../../controllers/auth.controller";

// error handler
const testErrorHandler = (
	err: Error,
	_req: Request,
	res: Response
): void => {
	res.status(500).json({ error: err.message });
};

// async wrapper
const asyncHandler =
	(fn: (req: Request, res: Response, next: NextFunction) => Promise<void>) =>
	(req: Request, res: Response, next: NextFunction) =>
		Promise.resolve(fn(req, res, next)).catch(next);

// helper to satisfy strict controller typing
const castReq = <T>(req: Request) =>
	req as unknown as Request<Record<string, never>, Record<string, never>, T>;

// app setup
const makeApp = ({ userId = null }: { userId?: string | null } = {}) => {
	const app = express();
	app.use(express.json());

	app.use((req: Request & { userId?: string }, _res, next) => {
		req.userId = userId || undefined;
		next();
	});

	const router = express.Router();

	router.post(
		"/register",
		asyncHandler((req, res, next) =>
			authController.register(castReq(req), res, next)
		)
	);

	router.post(
		"/login",
		asyncHandler((req, res, next) =>
			authController.login(castReq(req), res, next)
		)
	);

	router.post(
		"/google",
		asyncHandler((req, res, next) =>
			authController.googleLogin(castReq(req), res, next)
		)
	);

	router.post(
		"/logout",
		asyncHandler((req, res, next) =>
			authController.logout(req, res, next)
		)
	);

	router.get(
		"/me",
		fakeAuthMiddleware,
		asyncHandler((req, res, next) =>
			authController.getCurrentUser(req, res, next)
		)
	);

	app.use("/api/auth", router);
	app.use(testErrorHandler);

	return app;
};

describe("INTEGRATION — authRouter", () => {
	beforeEach(() => jest.clearAllMocks());

	const mockAuthResponse = {
		token: "test-token",
		user: {
			id: "user123",
			email: "test@test.com",
			first_name: "test",
			last_name: "user",
			role: { id: "1", name: "user" },
		},
	};

	test("POST /register creates user", async () => {
		const app = makeApp();

		mockRegister.mockResolvedValue(mockAuthResponse);

		const res = await request(app)
			.post("/api/auth/register")
			.send({
				first_name: "test",
				email: "test@test.com",
				password: "password",
				c_password: "password",
			});

		expect(res.status).toBe(201);
		expect(res.body.token).toBe("test-token");
	});

	test("POST /login logs in user", async () => {
		const app = makeApp();

		mockLogin.mockResolvedValue(mockAuthResponse);

		const res = await request(app)
			.post("/api/auth/login")
			.send({
				email: "test@test.com",
				password: "password",
			});

		expect(res.status).toBe(200);
		expect(res.body.token).toBe("test-token");
	});

	test("POST /google logs in with google", async () => {
		const app = makeApp();

		mockGoogleLogin.mockResolvedValue(mockAuthResponse);

		const res = await request(app)
			.post("/api/auth/google")
			.send({
				token: "google-token",
			});

		expect(res.status).toBe(200);
		expect(res.body.token).toBe("test-token");
	});

	test("POST /logout returns success message", async () => {
		const app = makeApp();

		const res = await request(app).post("/api/auth/logout");

		expect(res.status).toBe(200);
		expect(res.body.message).toBe("Logout successful");
	});

	test("GET /me returns current user", async () => {
		const app = makeApp({ userId: "user123" });

		mockGetCurrentUser.mockResolvedValue(mockAuthResponse.user);

		const res = await request(app).get("/api/auth/me");

		expect(res.status).toBe(200);
		expect(res.body.user.id).toBe("user123");
		expect(mockGetCurrentUser).toHaveBeenCalledWith("user123");
	});

	test("GET /me without auth returns 401", async () => {
		const app = makeApp({ userId: null });

		const res = await request(app).get("/api/auth/me");

		expect(res.status).toBe(401);
		expect(res.body.error).toBe("Authentication required");
	});
});