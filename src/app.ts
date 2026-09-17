import express from "express";
import { pool } from "./config/database";
import { asyncHandler } from "./middleware/asyncHandler";
import { errorHandler } from "./middleware/errorHandler";
import { notFound } from "./middleware/notFound";
import { requestLogger } from "./middleware/requestLogger";
import { router } from "./routes";

export const app = express();

app.use(express.json());
app.use(requestLogger);

app.get(
  "/health",
  asyncHandler(async (_req, res) => {
    await pool.query("SELECT 1");
    res.json({ status: "ok" });
  })
);

app.use("/api", router);

app.use(notFound);
app.use(errorHandler);
