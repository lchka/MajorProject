/// <reference types="jest" />
import request from "supertest";
import express, { Request, Response, NextFunction } from "express";
import type { ZodSchema } from "zod";

// ---------- local test-only user type ----------
// Deliberately NOT extending Express.Request to avoid conflicts with the
// global user type declared in your auth typings.
interface FakeUser {
  _id: string;
  permissions: string[];
}

// Helper to read/write the fake user stored under a private key on req,
// completely bypassing the typed req.user property.
const getFakeUser = (req: Request): FakeUser | null =>
  ((req as unknown as Record<string, unknown>)._fakeUser as FakeUser | null) ?? null;

// ---------- fake middleware ----------

const fakeAuthMiddleware = (req: Request, res: Response, next: NextFunction): void => {
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

const fakeCanAccessProfileByProfileId =
  () =>
  (req: Request, res: Response, next: NextFunction): void => {
    if (!getFakeUser(req)) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }
    next();
  };

// ---------- prisma mock ----------
// jest.mock is hoisted by Babel/ts-jest so this runs before any imports below.
jest.mock("../../lib/prisma.js", () => ({
  __esModule: true,
  default: {
    allergen: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    profile: {
      findUnique: jest.fn(),
    },
  },
}));

import prisma from "../../lib/prisma.js";
import allergenController from "../../controllers/allergen.controller.js";
import { HttpError } from "../../utils/HttpError.js";
import { createAllergenSchema, updateAllergenSchema } from "../../types/allergen.dto.js";

// ---------- validation middleware ----------

const validate =
  <T>(schema: ZodSchema<T>) =>
  (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const message = result.error.issues[0]?.message ?? "Validation failed";
      res.status(400).json({ error: message });
      return;
    }
    next();
  };

// ---------- error handler ----------

const testErrorHandler = (
  err: unknown,
  _req: Request,
  res: Response,
   // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
): void => {
  if (typeof err === "object" && err !== null && "statusCode" in err) {
    const httpError = err as HttpError;
    res.status(httpError.statusCode).json({ error: httpError.message });
    return;
  }
  res.status(500).json({ error: "Internal Server Error" });
};

// ---------- async wrapper ----------
// Generic so callers can pass handlers typed with specific Params/Body shapes
// without hitting a ParamsDictionary incompatibility.

const asyncHandler =
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  <P = any, ResBody = any, ReqBody = any, ReqQuery = any>(
    fn: (
      req: Request<P, ResBody, ReqBody, ReqQuery>,
      res: Response,
      next: NextFunction
    ) => Promise<void>
  ) =>
  (req: Request, res: Response, next: NextFunction) =>
    fn(req as Request<P, ResBody, ReqBody, ReqQuery>, res, next).catch(next);

// ---------- request cast helper ----------

const castReq = <P = Record<string, never>, T = Record<string, never>>(req: Request) =>
  req as unknown as Request<P, Record<string, never>, T>;

// ---------- app factory ----------

const makeApp = (user: FakeUser | null = null) => {
  const app = express();
  app.use(express.json());

  // Attach the fake user under a private key so it never touches req.user.
  app.use((req: Request, _res: Response, next: NextFunction) => {
    (req as unknown as Record<string, unknown>)._fakeUser = user;
    next();
  });

  const router = express.Router();

  router.post(
    "/",
    fakeAuthMiddleware,
    fakeCan("ALLERGEN_CREATE"),
    validate(createAllergenSchema),
    asyncHandler((req, res, next) =>
      allergenController.createAllergen(
        castReq<Record<string, never>, { name: string; description: string }>(req),
        res,
        next
      )
    )
  );

  router.get(
    "/",
    fakeAuthMiddleware,
    fakeCan("ALLERGEN_VIEW"),
    asyncHandler(allergenController.getAllAllergens.bind(allergenController))
  );

 
  router.get(
    "/profile/:profileId",
    fakeAuthMiddleware,
    fakeCan("ALLERGEN_VIEW"),
    fakeCanAccessProfileByProfileId(),
    asyncHandler(allergenController.getProfileAllergens.bind(allergenController))
  );

  router.get(
    "/:id",
    fakeAuthMiddleware,
    fakeCan("ALLERGEN_VIEW"),
    asyncHandler(allergenController.getAllergenById.bind(allergenController))
  );

  router.patch(
    "/:id",
    fakeAuthMiddleware,
    fakeCan("ALLERGEN_UPDATE"),
    validate(updateAllergenSchema),
    asyncHandler((req, res, next) =>
      allergenController.updateAllergen(
        castReq<{ id: string }, { name?: string; description?: string }>(req),
        res,
        next
      )
    )
  );

  router.delete(
    "/:id",
    fakeAuthMiddleware,
    fakeCan("ALLERGEN_DELETE"),
    asyncHandler(allergenController.deleteAllergen.bind(allergenController))
  );

  app.use("/api/allergens", router);
  app.use(testErrorHandler);

  return app;
};

// ==================== TESTS ====================

describe("INTEGRATION — allergenRouter", () => {
  beforeEach(() => jest.clearAllMocks());

  const user: FakeUser = {
    _id: "user123",
    permissions: [
      "ALLERGEN_CREATE",
      "ALLERGEN_VIEW",
      "ALLERGEN_UPDATE",
      "ALLERGEN_DELETE",
    ],
  };

  const mockAllergen = {
    id: "1",
    name: "Peanuts",
    description: "Allergy",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // ---------- auth / permission guards ----------

  test("POST / returns 401 when unauthenticated", async () => {
    const res = await request(makeApp(null))
      .post("/api/allergens")
      .send({ name: "Peanuts", description: "Allergy" });

    expect(res.status).toBe(401);
  });

  test("POST / returns 403 when permission missing", async () => {
    const limited: FakeUser = { _id: "u1", permissions: ["ALLERGEN_VIEW"] };
    const res = await request(makeApp(limited))
      .post("/api/allergens")
      .send({ name: "Peanuts", description: "Allergy" });

    expect(res.status).toBe(403);
  });

  // ---------- validation ----------

  test("POST / returns 400 when body is invalid", async () => {
    const res = await request(makeApp(user))
      .post("/api/allergens")
      .send({});

    expect(res.status).toBe(400);
  });

  // ---------- happy paths ----------

  test("POST / creates allergen and returns 201", async () => {
    (prisma.allergen.create as jest.Mock).mockResolvedValue(mockAllergen);

    const res = await request(makeApp(user))
      .post("/api/allergens")
      .send({ name: "Peanuts", description: "Allergy" });

    expect(res.status).toBe(201);
    expect(res.body.id).toBe("1");
    expect(res.body.name).toBe("Peanuts");
    expect(prisma.allergen.create).toHaveBeenCalledTimes(1);
  });

  test("GET / returns all allergens", async () => {
    (prisma.allergen.findMany as jest.Mock).mockResolvedValue([mockAllergen]);

    const res = await request(makeApp(user)).get("/api/allergens");

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].id).toBe("1");
  });

  test("GET /:id returns allergen when found", async () => {
    (prisma.allergen.findUnique as jest.Mock).mockResolvedValue(mockAllergen);

    const res = await request(makeApp(user)).get("/api/allergens/1");

    expect(res.status).toBe(200);
    expect(res.body.id).toBe("1");
  });

  test("GET /:id returns 404 when not found", async () => {
    (prisma.allergen.findUnique as jest.Mock).mockResolvedValue(null);

    const res = await request(makeApp(user)).get("/api/allergens/999");

    expect(res.status).toBe(404);
    expect(res.body.error).toBeDefined();
  });

  test("PATCH /:id updates allergen", async () => {
    const updated = { ...mockAllergen, name: "Tree Nuts" };
    // Service does findUnique guard before update — both mocks needed.
    (prisma.allergen.findUnique as jest.Mock).mockResolvedValue(mockAllergen);
    (prisma.allergen.update as jest.Mock).mockResolvedValue(updated);

    const res = await request(makeApp(user))
      .patch("/api/allergens/1")
      .send({ name: "Tree Nuts" });

    expect(res.status).toBe(200);
    expect(res.body.name).toBe("Tree Nuts");
  });

  test("PATCH /:id returns 404 when allergen does not exist", async () => {
    (prisma.allergen.findUnique as jest.Mock).mockResolvedValue(null);

    const res = await request(makeApp(user))
      .patch("/api/allergens/999")
      .send({ name: "Tree Nuts" });

    expect(res.status).toBe(404);
  });

  test("DELETE /:id deletes allergen and returns 200", async () => {
    // Service calls findUnique BEFORE delete — both mocks are required.
    (prisma.allergen.findUnique as jest.Mock).mockResolvedValue(mockAllergen);
    (prisma.allergen.delete as jest.Mock).mockResolvedValue(mockAllergen);

    const res = await request(makeApp(user)).delete("/api/allergens/1");

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("Allergen deleted successfully");
    expect(prisma.allergen.delete).toHaveBeenCalledWith({ where: { id: "1" } });
  });

  test("DELETE /:id returns 404 when allergen does not exist", async () => {
    (prisma.allergen.findUnique as jest.Mock).mockResolvedValue(null);

    const res = await request(makeApp(user)).delete("/api/allergens/999");

    expect(res.status).toBe(404);
  });

  // ---------- profile allergens ----------

  test("GET /profile/:profileId returns allergens for a profile", async () => {
    (prisma.profile.findUnique as jest.Mock).mockResolvedValue({
      allergens: [mockAllergen],
    });

    const res = await request(makeApp(user)).get(
      "/api/allergens/profile/profile123"
    );

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].id).toBe("1");
  });

  test("GET /profile/:profileId returns 404 when profile does not exist", async () => {
    (prisma.profile.findUnique as jest.Mock).mockResolvedValue(null);

    const res = await request(makeApp(user)).get(
      "/api/allergens/profile/nonexistent"
    );

    expect(res.status).toBe(404);
  });
});
