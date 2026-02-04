import express, { Request, Response, Router } from "express";
import prisma from "../lib/prisma.js";
import jwt from "jsonwebtoken";
import UserSecurity from "../utils/UserSecurity.js";
import { validate } from "../middleware/validateRequest.js";
import { registerSchema, loginSchema, RegisterInput, LoginInput } from "../utils/validators/authValidator.js";

const router: Router = express.Router();

router.post("/register", validate(registerSchema), async (req: Request<{}, {}, RegisterInput>, res: Response): Promise<void> => {
  try {
    const { first_name, last_name, email, password } = req.body;

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      res.status(400).json({
        message: "User already exists",
      });
      return;
    }

    const hashedPassword = await UserSecurity.hashPassword(password);

    // Get the 'user' role
    const userRole = await prisma.role.findUnique({
      where: { name: "user" },
    });

    if (!userRole) {
      res.status(500).json({
        message: "Default user role not found. Please run role seeder.",
      });
      return;
    }

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        profile: {
          create: {
            first_name,
            last_name,
          },
        },
        roleId: userRole.id,
      },
      include: {
        role: true,
      },
    });

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET as string, {
      expiresIn: "7d",
    });

    res.status(201).json({
      message: "Registration successful",
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role.name,
      },
    });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post("/login", validate(loginSchema), async (req: Request<{}, {}, LoginInput>, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({
        message: "Email and password are required",
      });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        profile: true,
        role: true,
      },
    });

    if (!user) {
      res.status(401).json({
        message: "Invalid credentials",
      });
      return;
    }

    const isPasswordValid = await UserSecurity.comparePassword(
      password,
      user.password,
    );

    if (!isPasswordValid) {
      res.status(401).json({
        message: "Invalid credentials",
      });
      return;
    }

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET as string, {
      expiresIn: "7d",
    });

    res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: user.id,
        email: user.email,
        profile: user.profile,
        role: user.role.name,
      },
    });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post("/logout", async (_req: Request, res: Response): Promise<void> => {
  try {
    // Since we're using JWT, logout is handled client-side by removing the token
    // This endpoint can be used for logging/analytics purposes
    res.status(200).json({
      message: "Logout successful",
    });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

export default router;
