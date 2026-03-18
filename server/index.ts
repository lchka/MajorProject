import express, { Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/auth.routes.js";
import userRoutes from "./routes/user.routes.js";
import preferenceRoutes from "./routes/preference.routes.js";
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

app.get("/", (req: Request, res: Response) => {
  res.send("API running");
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/preferences", preferenceRoutes);

// Error handling middleware (must be last)
app.use(errorHandler);

const PORT = Number(process.env.PORT || 3000);

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Local: http://localhost:${PORT}`);
  console.log(`Network: http://127.0.0.1:${PORT}`);
});
