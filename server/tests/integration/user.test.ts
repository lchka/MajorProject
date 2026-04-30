/// <reference types="jest" />

// ---------- MOCKS (must be first) ----------
jest.mock("../../repositories/user.repository.js", () => ({
  __esModule: true,
  default: {
    findById: jest.fn(),
    findAll: jest.fn(),
    update: jest.fn(),
    softDelete: jest.fn(),
    forceDelete: jest.fn(),
    restore: jest.fn(),
  },
}));

jest.mock("../../repositories/role.repository.js", () => ({
  __esModule: true,
  default: {
    findById: jest.fn(),
  },
}));

jest.mock("../../utils/UserSecurity.js", () => ({
  __esModule: true,
  default: {
    hashPassword: jest.fn(async () => "hashed"),
    comparePassword: jest.fn(async () => true),
  },
}));

// ---------- imports ----------
import request from "supertest";
import express, { Request, Response, NextFunction } from "express";

import userController from "../../controllers/user.controller.js";
import userRepository from "../../repositories/user.repository.js";
import { HttpError } from "../../utils/HttpError.js";

// ---------- fake auth ----------
type AuthRequest = Request & { userId?: string };

const fakeAuth = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  (req as AuthRequest).userId = "user-1";
  next();
};

// ---------- error handler ----------
const errorHandler = (
  err: unknown,
  _req: Request,
  res: Response,
   // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
): void => {
  if (typeof err === "object" && err !== null && "statusCode" in err) {
    const e = err as HttpError;
    res.status(e.statusCode).json({ error: e.message });
    return;
  }
  res.status(500).json({ error: "Internal Server Error" });
};

// ---------- async wrapper ----------
const asyncHandler =
  <
    P = Record<string, unknown>,
    ResBody = unknown,
    ReqBody = unknown,
    ReqQuery = unknown
  >(
    fn: (
      req: Request<P, ResBody, ReqBody, ReqQuery>,
      res: Response,
      next: NextFunction
    ) => Promise<void>
  ) =>
  (
    req: Request,
    res: Response,
    next: NextFunction
  ): void => {
    fn(req as Request<P, ResBody, ReqBody, ReqQuery>, res, next).catch(next);
  };

// ---------- app ----------
const makeApp = () => {
  const app = express();
  app.use(express.json());

  const router = express.Router();

  router.get(
    "/me",
    fakeAuth,
    asyncHandler(userController.getProfile.bind(userController))
  );

  router.get(
    "/",
    asyncHandler(userController.getAllUsers.bind(userController))
  );

  router.get(
    "/:id",
    asyncHandler(userController.getUserById.bind(userController))
  );

  router.patch(
    "/:id",
    asyncHandler(userController.updateUser.bind(userController))
  );

  router.delete(
    "/:id",
    asyncHandler(userController.softDeleteUser.bind(userController))
  );

  router.delete(
    "/force/:id",
    asyncHandler(userController.forceDeleteUser.bind(userController))
  );

  router.patch(
    "/restore/:id",
    asyncHandler(userController.restoreUser.bind(userController))
  );

  app.use("/api/users", router);
  app.use(errorHandler);

  return app;
};

// ================= TESTS =================

describe("INTEGRATION — userRouter", () => {
  beforeEach(() => jest.clearAllMocks());

  const mockUser = {
    id: "550e8400-e29b-41d4-a716-446655440000",
    email: "test@example.com",
    deletedAt: null,
    profiles: [
      {
        id: "profile-1",
        first_name: "John",
        last_name: "Doe",
        main_profile: true,
      },
    ],
    role: {
      id: "role-1",
      name: "user",
    },
  };

  // ---------- GET PROFILE ----------
  test("GET /me returns current user", async () => {
    (userRepository.findById as jest.Mock).mockResolvedValue(mockUser);

    const res = await request(makeApp()).get("/api/users/me");

    expect(res.status).toBe(200);
    expect(res.body.email).toBe("test@example.com");
  });

  // ---------- GET ALL ----------
  test("GET / returns all users", async () => {
    (userRepository.findAll as jest.Mock).mockResolvedValue([mockUser]);

    const res = await request(makeApp()).get("/api/users");

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
  });

  // ---------- GET BY ID ----------
  test("GET /:id returns user", async () => {
    (userRepository.findById as jest.Mock).mockResolvedValue(mockUser);

    const res = await request(makeApp()).get(`/api/users/${mockUser.id}`);

    expect(res.status).toBe(200);
    expect(res.body.id).toBe(mockUser.id);
  });

  test("GET /:id returns 404 if not found", async () => {
    (userRepository.findById as jest.Mock).mockResolvedValue(null);

    const res = await request(makeApp()).get("/api/users/invalid");

    expect(res.status).toBe(404);
  });

  // ---------- UPDATE ----------
  test("PATCH /:id updates user", async () => {
    (userRepository.findById as jest.Mock).mockResolvedValue(mockUser);
    (userRepository.update as jest.Mock).mockResolvedValue(mockUser);

    const res = await request(makeApp())
      .patch(`/api/users/${mockUser.id}`)
      .send({ first_name: "Updated" });

    expect(res.status).toBe(200);
  });

  // ---------- SOFT DELETE ----------
  test("DELETE /:id soft deletes user", async () => {
    (userRepository.findById as jest.Mock).mockResolvedValue(mockUser);
    (userRepository.softDelete as jest.Mock).mockResolvedValue(mockUser);

    const res = await request(makeApp()).delete(
      `/api/users/${mockUser.id}`
    );

    expect(res.status).toBe(200);
    expect(res.body.message).toContain("soft deleted");
  });

  // ---------- FORCE DELETE ----------
  test("DELETE /force/:id permanently deletes user", async () => {
    (userRepository.findById as jest.Mock).mockResolvedValue(mockUser);
    (userRepository.forceDelete as jest.Mock).mockResolvedValue(mockUser);

    const res = await request(makeApp()).delete(
      `/api/users/force/${mockUser.id}`
    );

    expect(res.status).toBe(200);
    expect(res.body.message).toContain("permanently deleted");
  });

  // ---------- RESTORE ----------
  test("PATCH /restore/:id restores user", async () => {
    (userRepository.restore as jest.Mock).mockResolvedValue(mockUser);

    const res = await request(makeApp()).patch(
      `/api/users/restore/${mockUser.id}`
    );

    expect(res.status).toBe(200);
    expect(res.body.id).toBe(mockUser.id);
  });
});