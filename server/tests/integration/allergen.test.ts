/// <reference types="jest" />
import request from "supertest";
import express, { Request, Response, NextFunction } from "express";

interface TestRequest extends Request {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  user?: any;
}

// Fake Auth Middleware
const fakeAuthMiddleware = (req: TestRequest, res: Response, next: NextFunction): void => {
  if (!req.user) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }
  next();
};

// Fake Permission Middleware (can)
const fakeCan =
  (permission: string) => (req: TestRequest, res: Response, next: NextFunction): void => {
    if (!req.user || !req.user.permissions?.includes(permission)) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }
    next();
  };

// Fake canAccessProfileByProfileId Middleware
const fakeCanAccessProfileByProfileId =
  () => (req: TestRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }
    next();
  };

// MOCK — Prisma (must be before import)
jest.mock("../../lib/prisma", () => ({
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

// Import after mock
import prisma from "../../lib/prisma";
import allergenController from "../../controllers/allergen.controller";
import { HttpError } from "../../utils/HttpError";
import { createAllergenSchema, updateAllergenSchema } from "../../types/allergen.dto";

// Validation middleware that uses Zod schemas
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const validate = (schema: any) => (req: TestRequest, res: Response, next: NextFunction): void => {
  try {
    schema.parse(req.body);
    next();
  } catch (err: unknown) {
    // Handle Zod validation errors
    const error = err as {
      errors?: Array<{ message?: string }>;
      message?: string;
    };
    if (error?.errors && Array.isArray(error.errors)) {
      const message = error.errors[0]?.message || "Validation failed";
      res.status(400).json({ error: message });
    } else {
      res.status(400).json({ error: error?.message || "Validation failed" });
    }
  }
};

// Test error handler that returns error instead of message
const testErrorHandler = (
  err: Error | HttpError,
  _req: Request,
  res: Response,
): void => {
  if (err instanceof HttpError) {
    res.status(err.statusCode).json({ error: err.message });
    return;
  }
  res.status(500).json({ error: err.message || "Internal Server Error" });
};

// Wrapper to catch async errors
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const asyncHandler = (fn: any) => (req: any, res: any, next: any) => {
  return Promise.resolve(fn(req, res, next)).catch(next);
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const makeApp = ({ user = null }: { user?: any } = {}) => {
  const app = express();
  app.use(express.json());

  // Inject user
  app.use((req: TestRequest, _res, next) => {
    req.user = user;
    next();
  });

  // Setup routes with fake middleware
  const router = express.Router();

  router.post(
    "/",
    fakeAuthMiddleware,
    fakeCan("ALLERGEN_CREATE"),
    validate(createAllergenSchema),
    asyncHandler(allergenController.createAllergen.bind(allergenController))
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
    asyncHandler(allergenController.updateAllergen.bind(allergenController))
  );

  router.delete(
    "/:id",
    fakeAuthMiddleware,
    fakeCan("ALLERGEN_DELETE"),
    asyncHandler(allergenController.deleteAllergen.bind(allergenController))
  );

  app.use("/api/allergens", router);

  // Test error handler
  app.use(testErrorHandler);

  return app;
};

// ---- ALLERGEN TESTS ----

describe("INTEGRATION — allergenRouter", () => {
  beforeEach(() => jest.clearAllMocks());

  const userWithAllPermissions = {
    _id: "user123",
    permissions: [
      "ALLERGEN_CREATE",
      "ALLERGEN_VIEW",
      "ALLERGEN_UPDATE",
      "ALLERGEN_DELETE",
    ],
  };

  const userWithViewOnly = {
    _id: "user456",
    permissions: ["ALLERGEN_VIEW"],
  };

  const unauthenticatedUser = null;

  const mockAllergen = {
    id: "550e8400-e29b-41d4-a716-446655440000",
    name: "Peanuts",
    description: "Tree nut allergen",
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  // ---- AUTH TESTS ----

  test("POST / without authentication returns 401", async () => {
    const app = makeApp({ user: unauthenticatedUser });

    const res = await request(app)
      .post("/api/allergens")
      .send({ name: "Peanuts", description: "Tree nut allergen" });

    expect(res.status).toBe(401);
    expect(res.body.error).toBe("Authentication required");
  });

  test("POST / without ALLERGEN_CREATE permission returns 403", async () => {
    const app = makeApp({ user: userWithViewOnly });

    const res = await request(app)
      .post("/api/allergens")
      .send({ name: "Peanuts", description: "Tree nut allergen" });

    expect(res.status).toBe(403);
    expect(res.body.error).toBe("Forbidden");
  });

  test("GET / without authentication returns 401", async () => {
    const app = makeApp({ user: unauthenticatedUser });

    const res = await request(app).get("/api/allergens");

    expect(res.status).toBe(401);
    expect(res.body.error).toBe("Authentication required");
  });

  test("GET / without ALLERGEN_VIEW permission returns 403", async () => {
    const app = makeApp({
      user: { _id: "user123", permissions: ["ALLERGEN_CREATE"] },
    });

    const res = await request(app).get("/api/allergens");

    expect(res.status).toBe(403);
    expect(res.body.error).toBe("Forbidden");
  });

  test("PATCH /:id without ALLERGEN_UPDATE permission returns 403", async () => {
    const app = makeApp({ user: userWithViewOnly });

    const res = await request(app)
      .patch(`/api/allergens/550e8400-e29b-41d4-a716-446655440000`)
      .send({ name: "Updated Name" });

    expect(res.status).toBe(403);
    expect(res.body.error).toBe("Forbidden");
  });

  test("DELETE /:id without ALLERGEN_DELETE permission returns 403", async () => {
    const app = makeApp({ user: userWithViewOnly });

    const res = await request(app).delete(
      `/api/allergens/550e8400-e29b-41d4-a716-446655440000`
    );

    expect(res.status).toBe(403);
    expect(res.body.error).toBe("Forbidden");
  });

  // ---- CREATE ALLERGEN TESTS ----

  test("POST / creates allergen successfully", async () => {
    const app = makeApp({ user: userWithAllPermissions });

    (prisma.allergen.create as jest.Mock).mockResolvedValue(mockAllergen);

    const res = await request(app)
      .post("/api/allergens")
      .send({ name: "Peanuts", description: "Tree nut allergen" });

    expect(res.status).toBe(201);
    expect(res.body.id).toBe(mockAllergen.id);
    expect(res.body.name).toBe("Peanuts");
    expect(prisma.allergen.create).toHaveBeenCalledWith({
      data: {
        name: "Peanuts",
        description: "Tree nut allergen",
      },
    });
  });

  test("POST / returns BAD_REQUEST for name too short", async () => {
    const app = makeApp({ user: userWithAllPermissions });

    const res = await request(app)
      .post("/api/allergens")
      .send({ name: "P", description: "Tree nut allergen" });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain("at least 2 characters");
  });

  test("POST / returns BAD_REQUEST for name too long", async () => {
    const app = makeApp({ user: userWithAllPermissions });

    const longName = "A".repeat(101);
    const res = await request(app)
      .post("/api/allergens")
      .send({ name: longName, description: "Tree nut allergen" });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain("at most 100 characters");
  });

  test("POST / returns BAD_REQUEST for description too short", async () => {
    const app = makeApp({ user: userWithAllPermissions });

    const res = await request(app)
      .post("/api/allergens")
      .send({ name: "Peanuts", description: "A" });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain("at least 2 characters");
  });

  test("POST / returns BAD_REQUEST for description too long", async () => {
    const app = makeApp({ user: userWithAllPermissions });

    const longDescription = "A".repeat(501);
    const res = await request(app)
      .post("/api/allergens")
      .send({ name: "Peanuts", description: longDescription });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain("at most 500 characters");
  });

  test("POST / returns BAD_REQUEST for missing name", async () => {
    const app = makeApp({ user: userWithAllPermissions });

    const res = await request(app)
      .post("/api/allergens")
      .send({ description: "Tree nut allergen" });

    expect(res.status).toBe(400);
  });

  test("POST / returns BAD_REQUEST for missing description", async () => {
    const app = makeApp({ user: userWithAllPermissions });

    const res = await request(app).post("/api/allergens").send({ name: "Peanuts" });

    expect(res.status).toBe(400);
  });

  // ---- GET ALL ALLERGENS TESTS ----

  test("GET / returns all allergens successfully", async () => {
    const app = makeApp({ user: userWithAllPermissions });

    const mockAllergens = [
      mockAllergen,
      {
        id: "550e8400-e29b-41d4-a716-446655440001",
        name: "Tree Nuts",
        description: "Various tree nuts",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    (prisma.allergen.findMany as jest.Mock).mockResolvedValue(mockAllergens);

    const res = await request(app).get("/api/allergens");

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
    expect(res.body[0].name).toBe("Peanuts");
    expect(res.body[1].name).toBe("Tree Nuts");
  });

  test("GET / returns empty array when no allergens exist", async () => {
    const app = makeApp({ user: userWithAllPermissions });

    (prisma.allergen.findMany as jest.Mock).mockResolvedValue([]);

    const res = await request(app).get("/api/allergens");

    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  // ---- GET SINGLE ALLERGEN TESTS ----

  test("GET /:id returns allergen successfully", async () => {
    const app = makeApp({ user: userWithAllPermissions });

    (prisma.allergen.findUnique as jest.Mock).mockResolvedValue(mockAllergen);

    const res = await request(app).get(
      `/api/allergens/550e8400-e29b-41d4-a716-446655440000`
    );

    expect(res.status).toBe(200);
    expect(res.body.id).toBe(mockAllergen.id);
    expect(res.body.name).toBe("Peanuts");
  });

  test("GET /:id returns NOT_FOUND for non-existing allergen", async () => {
    const app = makeApp({ user: userWithAllPermissions });

    (prisma.allergen.findUnique as jest.Mock).mockResolvedValue(null);

    const res = await request(app).get(
      `/api/allergens/550e8400-e29b-41d4-a716-446655440002`
    );

    expect(res.status).toBe(404);
    expect(res.body.error).toBe("Allergen not found");
  });

  // ---- UPDATE ALLERGEN TESTS ----

  test("PATCH /:id updates allergen successfully", async () => {
    const app = makeApp({ user: userWithAllPermissions });

    const updatedAllergen = {
      ...mockAllergen,
      name: "Updated Peanuts",
      updatedAt: new Date(),
    };

    (prisma.allergen.findUnique as jest.Mock).mockResolvedValue(mockAllergen);
    (prisma.allergen.update as jest.Mock).mockResolvedValue(updatedAllergen);

    const res = await request(app)
      .patch(`/api/allergens/550e8400-e29b-41d4-a716-446655440000`)
      .send({ name: "Updated Peanuts" });

    expect(res.status).toBe(200);
    expect(res.body.name).toBe("Updated Peanuts");
    expect(prisma.allergen.update).toHaveBeenCalledWith({
      where: { id: "550e8400-e29b-41d4-a716-446655440000" },
      data: { name: "Updated Peanuts" },
    });
  });

  test("PATCH /:id updates only description", async () => {
    const app = makeApp({ user: userWithAllPermissions });

    const updatedAllergen = {
      ...mockAllergen,
      description: "Updated description",
      updatedAt: new Date(),
    };

    (prisma.allergen.findUnique as jest.Mock).mockResolvedValue(mockAllergen);
    (prisma.allergen.update as jest.Mock).mockResolvedValue(updatedAllergen);

    const res = await request(app)
      .patch(`/api/allergens/550e8400-e29b-41d4-a716-446655440000`)
      .send({ description: "Updated description" });

    expect(res.status).toBe(200);
    expect(res.body.description).toBe("Updated description");
  });

  test("PATCH /:id returns BAD_REQUEST for empty update", async () => {
    const app = makeApp({ user: userWithAllPermissions });

    const res = await request(app)
      .patch(`/api/allergens/550e8400-e29b-41d4-a716-446655440000`)
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.error).toContain("At least one field must be provided");
  });

  test("PATCH /:id returns BAD_REQUEST for invalid name length", async () => {
    const app = makeApp({ user: userWithAllPermissions });

    const res = await request(app)
      .patch(`/api/allergens/550e8400-e29b-41d4-a716-446655440000`)
      .send({ name: "A" });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain("at least 2 characters");
  });

  test("PATCH /:id returns NOT_FOUND for non-existing allergen", async () => {
    const app = makeApp({ user: userWithAllPermissions });

    (prisma.allergen.findUnique as jest.Mock).mockResolvedValue(null);

    const res = await request(app)
      .patch(`/api/allergens/550e8400-e29b-41d4-a716-446655440003`)
      .send({ name: "Updated" });

    expect(res.status).toBe(404);
    expect(res.body.error).toBe("Allergen Not Found");
  });

  // ---- DELETE ALLERGEN TESTS ----

  test("DELETE /:id deletes allergen successfully", async () => {
    const app = makeApp({ user: userWithAllPermissions });

    (prisma.allergen.findUnique as jest.Mock).mockResolvedValue(mockAllergen);
    (prisma.allergen.delete as jest.Mock).mockResolvedValue(mockAllergen);

    const res = await request(app).delete(
      `/api/allergens/550e8400-e29b-41d4-a716-446655440000`
    );

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("Allergen deleted successfully");
    expect(prisma.allergen.delete).toHaveBeenCalledWith({
      where: { id: "550e8400-e29b-41d4-a716-446655440000" },
    });
  });

  test("DELETE /:id returns NOT_FOUND for non-existing allergen", async () => {
    const app = makeApp({ user: userWithAllPermissions });

    (prisma.allergen.findUnique as jest.Mock).mockResolvedValue(null);

    const res = await request(app).delete(
      `/api/allergens/550e8400-e29b-41d4-a716-446655440004`
    );

    expect(res.status).toBe(404);
    expect(res.body.error).toBe("Allergen not found");
  });

  // ---- GET PROFILE ALLERGENS TESTS ----

  test("GET /profile/:profileId returns profile allergens successfully", async () => {
    const app = makeApp({ user: userWithAllPermissions });
    const profileId = "550e8400-e29b-41d4-a716-446655440005";

    const mockProfile = {
      id: profileId,
      allergens: [
        mockAllergen,
        {
          id: "550e8400-e29b-41d4-a716-446655440006",
          name: "Shellfish",
          description: "Shellfish allergen",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
    };

    (prisma.profile.findUnique as jest.Mock).mockResolvedValue(mockProfile);

    const res = await request(app).get(`/api/allergens/profile/${profileId}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
    expect(res.body[0].name).toBe("Peanuts");
  });

  test("GET /profile/:profileId returns empty array for profile with no allergens", async () => {
    const app = makeApp({ user: userWithAllPermissions });
    const profileId = "550e8400-e29b-41d4-a716-446655440005";

    const mockProfile = {
      id: profileId,
      allergens: [],
    };

    (prisma.profile.findUnique as jest.Mock).mockResolvedValue(mockProfile);

    const res = await request(app).get(`/api/allergens/profile/${profileId}`);

    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  test("GET /profile/:profileId returns NOT_FOUND for non-existing profile", async () => {
    const app = makeApp({ user: userWithAllPermissions });

    (prisma.profile.findUnique as jest.Mock).mockResolvedValue(null);

    const res = await request(app).get(
      `/api/allergens/profile/550e8400-e29b-41d4-a716-446655440007`
    );

    expect(res.status).toBe(404);
    expect(res.body.error).toBe("Profile not found");
  });
});
