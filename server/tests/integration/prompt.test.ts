/// <reference types="jest" />

// ---------- prisma mock ----------
jest.mock("../../lib/prisma.js", () => ({
  __esModule: true,
  default: {
    prompt: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  },
}));
import request from "supertest";
import express, { Request, Response, NextFunction } from "express";
import type { ZodSchema } from "zod";

// ---------- fake user ----------
interface FakeUser {
  _id: string;
  permissions: string[];
}

const getFakeUser = (req: Request): FakeUser | null =>
  ((req as unknown as Record<string, unknown>)._fakeUser as FakeUser | null) ??
  null;

// ---------- fake middleware ----------
const fakeAuth = (req: Request, res: Response, next: NextFunction): void => {
  if (!getFakeUser(req)) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }
  next();
};

const fakeCan =
  (permission: string) =>
  (req: Request, res: Response, next: NextFunction): void => {
    const user = getFakeUser(req);
    if (!user || !user.permissions.includes(permission)) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }
    next();
  };


import prisma from "../../lib/prisma.js";
import promptController from "../../controllers/prompt.controller.js";
import { HttpError } from "../../utils/HttpError.js";
import {
  createPromptSchema,
  updatePromptSchema,
} from "../../types/prompt.dto.js";

// ---------- validation ----------
const validate =
  <T>(schema: ZodSchema<T>) =>
  (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      res.status(400).json({ error: "Validation failed" });
      return;
    }
    next();
  };

// ---------- error handler ----------
const errorHandler = (
  err: unknown,
  _req: Request,
  res: Response,
   // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction,
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
    ReqQuery = unknown,
  >(
    fn: (
      req: Request<P, ResBody, ReqBody, ReqQuery>,
      res: Response,
      next: NextFunction,
    ) => Promise<void>,
  ) =>
  (req: Request, res: Response, next: NextFunction): void => {
    fn(req as Request<P, ResBody, ReqBody, ReqQuery>, res, next).catch(next);
  };

// ---------- app ----------
const makeApp = (user: FakeUser | null = null) => {
  const app = express();
  app.use(express.json());

  app.use((req: Request, _res: Response, next: NextFunction): void => {
    (req as unknown as Record<string, unknown>)._fakeUser = user;
    next();
  });

  const router = express.Router();

  router.post(
    "/",
    fakeAuth,
    fakeCan("PROMPT_CREATE"),
    validate(createPromptSchema),
    asyncHandler(promptController.createPrompt.bind(promptController)),
  );

  router.get(
    "/",
    fakeAuth,
    fakeCan("PROMPT_VIEW"),
    asyncHandler(promptController.getAllPrompts.bind(promptController)),
  );

  router.get(
    "/:id",
    fakeAuth,
    fakeCan("PROMPT_VIEW"),
    asyncHandler(promptController.getPromptById.bind(promptController)),
  );

  router.patch(
    "/:id",
    fakeAuth,
    fakeCan("PROMPT_UPDATE"),
    validate(updatePromptSchema),
    asyncHandler(promptController.updatePrompt.bind(promptController)),
  );

  router.delete(
    "/:id",
    fakeAuth,
    fakeCan("PROMPT_DELETE"),
    asyncHandler(promptController.deletePrompt.bind(promptController)),
  );

  app.use("/api/prompts", router);
  app.use(errorHandler);

  return app;
};

// ==================== TESTS ====================

describe("INTEGRATION — promptRouter", () => {
  beforeEach(() => jest.clearAllMocks());

  const user: FakeUser = {
    _id: "user123",
    permissions: [
      "PROMPT_CREATE",
      "PROMPT_VIEW",
      "PROMPT_UPDATE",
      "PROMPT_DELETE",
    ],
  };

  const mockPrompt = {
    id: "550e8400-e29b-41d4-a716-446655440000",
    prompt_text: "This is a valid prompt text",
    category: "Shampoo",
    createdAt: new Date("2024-01-01T00:00:00.000Z"),
    updatedAt: new Date("2024-01-02T00:00:00.000Z"),
  };

  const makeMockPrompt = () => ({
    ...mockPrompt,
    createdAt: new Date("2024-01-01T00:00:00.000Z"),
    updatedAt: new Date("2024-01-02T00:00:00.000Z"),
  });

  // ---------- CREATE ----------
  test("POST / creates prompt", async () => {
    (prisma.prompt.create as jest.Mock).mockImplementation(async () =>
      makeMockPrompt(),
    );

    const res = await request(makeApp(user)).post("/api/prompts").send({
      prompt_text: "This is a valid prompt text",
      category: "Shampoo",
    });

    expect(res.status).toBe(201);
    expect(res.body.id).toBe(mockPrompt.id);
  });

  // ---------- GET ALL ----------
  test("GET / returns all prompts", async () => {
    (prisma.prompt.findMany as jest.Mock).mockImplementation(async () => [
      makeMockPrompt(),
    ]);

    const res = await request(makeApp(user)).get("/api/prompts");

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
  });

  // ---------- GET BY ID ----------
  test("GET /:id returns prompt", async () => {
    (prisma.prompt.findUnique as jest.Mock).mockImplementation(async () =>
      makeMockPrompt(),
    );

    const res = await request(makeApp(user)).get(
      `/api/prompts/${mockPrompt.id}`,
    );

    expect(res.status).toBe(200);
    expect(res.body.id).toBe(mockPrompt.id);
  });

  test("GET /:id returns 404 when not found", async () => {
    (prisma.prompt.findUnique as jest.Mock).mockResolvedValue(null);

    const res = await request(makeApp(user)).get("/api/prompts/999");

    expect(res.status).toBe(404);
  });

  // ---------- UPDATE ----------
  test("PATCH /:id updates prompt", async () => {
    const updated = {
      ...mockPrompt,
      prompt_text: "Updated valid prompt text",
    };

    (prisma.prompt.findUnique as jest.Mock).mockImplementation(async () =>
      makeMockPrompt(),
    );

    (prisma.prompt.update as jest.Mock).mockImplementation(async () =>
      ({
        ...updated,
        createdAt: new Date("2024-01-01T00:00:00.000Z"),
        updatedAt: new Date("2024-01-02T00:00:00.000Z"),
      }),
    );

    const res = await request(makeApp(user))
      .patch(`/api/prompts/${mockPrompt.id}`)
      .send({
        prompt_text: "Updated valid prompt text",
        category: "Shampoo",
      });

    expect(res.status).toBe(200);
    expect(res.body.prompt_text).toBe("Updated valid prompt text");
  });

  // ---------- DELETE ----------
  test("DELETE /:id deletes prompt", async () => {
    (prisma.prompt.findUnique as jest.Mock).mockImplementation(async () =>
      makeMockPrompt(),
    );

    (prisma.prompt.delete as jest.Mock).mockImplementation(async () =>
      makeMockPrompt(),
    );

    const res = await request(makeApp(user)).delete(
      `/api/prompts/${mockPrompt.id}`,
    );

    expect(res.status).toBe(200);
    expect(res.body.message).toContain("deleted successfully");
  });
});
