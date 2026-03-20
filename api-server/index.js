import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import itemsRouter from "./routes/items.js";
import tagsRouter from "./routes/tags.js";
import tagMappingRouter from "./routes/tagMapping.js";
import presetsRouter from "./routes/presets.js";
import authRouter from "./routes/auth.js";
import { requireAuth } from "./middleware/auth.js";

const app = express();

app.use(cors({
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    credentials: true, // required for cookies
}));
app.use(express.json());
app.use(cookieParser());

// Public routes
app.use("/api/auth", authRouter);

// Protected routes
app.use("/api/items", requireAuth, itemsRouter);
app.use("/api/tags", requireAuth, tagsRouter);
app.use("/api/tagMapping", requireAuth, tagMappingRouter);
app.use("/api/presets", requireAuth, presetsRouter);

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
    console.log(`API server running on port ${PORT}`);
});