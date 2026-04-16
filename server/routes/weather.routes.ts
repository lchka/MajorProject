import express, { Router } from "express";
import weatherController from "../controllers/weather.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

const router: Router = express.Router();

router.get("/uv", authMiddleware, weatherController.getCurrentUv.bind(weatherController));

export default router;
