import express from "express";
import prisma from "../lib/prisma.js";
import jwt from "jsonwebtoken";
import UserSecurity from "../utils/UserSecurity.js";
import { validate } from "../middleware/validateRequest.js";
import { registerSchema } from "../utils/validators/authValidator.js";

const router = express.Router();

router.post("/register", validate(registerSchema), async (req, res) => {
  try {
    const { first_name, last_name, email, password } = req.body;

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(400).json({
        message: "User already exists",
      });
    }

    const hashedPassword = await UserSecurity.hashPassword(password);

    // Get the 'user' role
    const userRole = await prisma.role.findUnique({
      where: { name: "user" },
    });

    if (!userRole) {
      return res.status(500).json({
        message: "Default user role not found. Please run role seeder.",
      });
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

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, {
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
    res.status(500).json({ error: error.message });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required",
      });
    }

    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        profile: true,
        role: true,
      },
    });

    if (!user) {
      return res.status(401).json({
        message: "Invalid credentials",
      });
    }

    const isPasswordValid = await UserSecurity.comparePassword(
      password,
      user.password,
    );

    if (!isPasswordValid) {
      return res.status(401).json({
        message: "Invalid credentials",
      });
    }

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, {
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
    res.status(500).json({ error: error.message });
  }
});

router.post("/logout", async (req, res) => {
  try {
    // Since we're using JWT, logout is handled client-side by removing the token
    // This endpoint can be used for logging/analytics purposes
    res.status(200).json({
      message: "Logout successful",
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
