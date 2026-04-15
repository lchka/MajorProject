import express, { Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "node:path";
import authRoutes from "./routes/auth.routes.js";
import userRoutes from "./routes/user.routes.js";
import preferenceRoutes from "./routes/preference.routes.js";
import conditionRoutes from "./routes/condition.routes.js"
import allegernRoutes from "./routes/allergen.routes.js"
import profileRoutes from "./routes/profile.routes.js"
import promptRoutes from "./routes/prompt.routes.js"
import productRoutes from "./routes/product.routes.js"
import evaluationContextRoutes from "./routes/evaluationContext.routes.js"
import { errorHandler } from "./middleware/error.middleware.js";

dotenv.config();

const app = express();

// CORS configuration - Allow all origins in development
app.use(
  cors({
    origin: true, // Allow all origins in development
    credentials: true,
  }),
);

app.use(express.json());
app.use("/uploads", express.static(path.resolve(process.cwd(), "uploads")));

app.get("/", (req: Request, res: Response) => {
  res.send("API running");
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/preferences", preferenceRoutes);
app.use("/api/allergens", allegernRoutes )
app.use("/api/conditions", conditionRoutes)
app.use("/api/profiles", profileRoutes)
app.use("/api/prompts", promptRoutes)
app.use("/api/products", productRoutes)
app.use("/api/evaluation-contexts", evaluationContextRoutes)

// Error handling middleware (must be last)
app.use(errorHandler);

const PORT = Number(process.env.PORT || 3000);

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Local: http://localhost:${PORT}`);
  console.log(`Network: http://127.0.0.1:${PORT}`);
});
