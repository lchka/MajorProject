import express, { Request, Response } from "express";
import dotenv from "dotenv";
import authRoutes from "./routes/auth.routes.js";
import userRoutes from "./routes/user.routes.js";
import { errorHandler } from "./middleware/error.middleware.js";

dotenv.config();

const app = express();

app.use(express.json());

app.get("/", (req: Request, res: Response) => {
  res.send("API running");
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);

// Error handling middleware (must be last)
app.use(errorHandler);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
