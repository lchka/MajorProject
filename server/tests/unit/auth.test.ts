import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { HttpError } from "../../utils/HttpError.js";
import type { UserResponseDto } from "../../types/user.dto.js";

process.env.JWT_SECRET = "test-secret";

const mockRegisterUser = jest.fn();
const mockAuthenticateUser = jest.fn();
const mockGetUserById = jest.fn();

const mockFindByEmail = jest.fn();
const mockFindByName = jest.fn();

const mockSign = jest.fn();
const mockVerify = jest.fn();

const mockVerifyIdToken = jest.fn();
const mockOAuth2Client = jest.fn().mockImplementation(() => ({
	verifyIdToken: mockVerifyIdToken,
}));

jest.unstable_mockModule("../../services/user.service.js", () => ({
	default: {
		registerUser: mockRegisterUser,
		authenticateUser: mockAuthenticateUser,
		getUserById: mockGetUserById,
	},
}));

jest.unstable_mockModule("../../repositories/user.repository.js", () => ({
	default: {
		findByEmail: mockFindByEmail,
	},
}));

jest.unstable_mockModule("../../repositories/role.repository.js", () => ({
	default: {
		findByName: mockFindByName,
	},
}));

jest.unstable_mockModule("jsonwebtoken", () => ({
	default: {
		sign: mockSign,
		verify: mockVerify,
	},
}));

jest.unstable_mockModule("google-auth-library", () => ({
	OAuth2Client: mockOAuth2Client,
}));

const { default: authService } = await import(
	"../../services/auth.service.js"
);

const baseUser: UserResponseDto = {
	id: "user-1",
	email: "user@example.com",
	profile_id: "profile-1",
	first_name: "Test",
	last_name: "User",
	role: { id: "role-1", name: "user" },
};

beforeEach(() => {
	jest.clearAllMocks();
	process.env.GOOGLE_AUTH_CLIENT_IDS = "";
	process.env.GOOGLE_WEB_CLIENT_ID = "";
	process.env.GOOGLE_ANDROID_CLIENT_ID = "";
	process.env.GOOGLE_IOS_CLIENT_ID = "";
	process.env.GOOGLE_EXPO_CLIENT_ID = "";
});

describe("AuthService.register", () => {
	it("registers a user and returns token", async () => {
		mockFindByName.mockResolvedValue({ id: "role-1", name: "user" });
		mockRegisterUser.mockResolvedValue(baseUser);
		mockSign.mockReturnValue("token-123");

		const result = await authService.register({
			email: "user@example.com",
			password: "Pass123!",
			first_name: "Test",
			last_name: "User",
		});

		expect(result.message).toBe("Registration successful");
		expect(result.token).toBe("token-123");
		expect(result.user).toEqual(baseUser);
		expect(mockFindByName).toHaveBeenCalledWith("user");
		expect(mockRegisterUser).toHaveBeenCalledWith({
			email: "user@example.com",
			password: "Pass123!",
			first_name: "Test",
			last_name: "User",
			roleId: "role-1",
		});
	});

	it("throws when default role is missing", async () => {
		mockFindByName.mockResolvedValue(null);

		await expect(
			authService.register({
				email: "user@example.com",
				password: "Pass123!",
				first_name: "Test",
				last_name: "User",
			})
		).rejects.toThrow(HttpError);
	});
});

describe("AuthService.login", () => {
	it("authenticates a user and returns token", async () => {
		mockAuthenticateUser.mockResolvedValue(baseUser);
		mockSign.mockReturnValue("token-abc");

		const result = await authService.login({
			email: "user@example.com",
			password: "Pass123!",
		});

		expect(result.message).toBe("Login successful");
		expect(result.token).toBe("token-abc");
		expect(result.user).toEqual(baseUser);
		expect(mockAuthenticateUser).toHaveBeenCalledWith(
			"user@example.com",
			"Pass123!"
		);
	});
});

describe("AuthService.googleLogin", () => {
	it("fails when Google audiences are not configured", async () => {
		await expect(
			authService.googleLogin({ token: "bad-token" })
		).rejects.toThrow("Google auth is not configured");
	});

	it("fails on invalid Google token", async () => {
		process.env.GOOGLE_AUTH_CLIENT_IDS = "client-1";
		mockVerifyIdToken.mockRejectedValue(new Error("invalid"));

		await expect(
			authService.googleLogin({ token: "bad-token" })
		).rejects.toThrow("Invalid Google ID token");
	});

	it("registers a new user from Google payload", async () => {
		process.env.GOOGLE_AUTH_CLIENT_IDS = "client-1";
		mockVerifyIdToken.mockResolvedValue({
			getPayload: () => ({
				email: "newuser@example.com",
				email_verified: true,
				given_name: "New",
				family_name: "User",
			}),
		});
		mockFindByEmail.mockResolvedValue(null);
		mockFindByName.mockResolvedValue({ id: "role-1", name: "user" });
		mockRegisterUser.mockResolvedValue(baseUser);
		mockSign.mockReturnValue("token-xyz");

		const result = await authService.googleLogin({ token: "good-token" });

		expect(result.message).toBe("Google login successful");
		expect(result.token).toBe("token-xyz");
		expect(result.user).toEqual(baseUser);
		expect(mockRegisterUser).toHaveBeenCalledWith({
			email: "newuser@example.com",
			password: expect.stringMatching(/^G#.+a1$/),
			first_name: "New",
			last_name: "User",
			roleId: "role-1",
		});
	});

	it("logs in an existing user from Google payload", async () => {
		process.env.GOOGLE_AUTH_CLIENT_IDS = "client-1";
		mockVerifyIdToken.mockResolvedValue({
			getPayload: () => ({
				email: "user@example.com",
				email_verified: true,
				name: "Test User",
			}),
		});
		mockFindByEmail.mockResolvedValue({ id: "user-1" });
		mockGetUserById.mockResolvedValue(baseUser);
		mockSign.mockReturnValue("token-789");

		const result = await authService.googleLogin({ token: "good-token" });

		expect(result.message).toBe("Google login successful");
		expect(result.token).toBe("token-789");
		expect(result.user).toEqual(baseUser);
		expect(mockGetUserById).toHaveBeenCalledWith("user-1");
	});
});

describe("AuthService.verifyToken", () => {
	it("returns decoded payload", () => {
		mockVerify.mockReturnValue({ userId: "user-1" });

		const result = authService.verifyToken("token-123");

		expect(result).toEqual({ userId: "user-1" });
		expect(mockVerify).toHaveBeenCalledWith("token-123", "test-secret");
	});

	it("throws when token is invalid", () => {
		mockVerify.mockImplementation(() => {
			throw new Error("bad token");
		});

		expect(() => authService.verifyToken("bad")).toThrow(HttpError);
	});
});
