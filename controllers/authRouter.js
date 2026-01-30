import express from "express";
import prisma from "../lib/prisma.js";
import jwt from "jsonwebtoken";
import UserSecurity from "../models/User.js";
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

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
      },
    });

    await prisma.profile.create({
      data: {
        first_name,
        last_name,
        userId: user.id,
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
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
