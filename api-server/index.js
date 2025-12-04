import express from "express";
import cors from "cors";
import itemsRouter from "./routes/items.js";
import tagsRouter from "./routes/tags.js";
import tagMappingRouter from "./routes/tagMapping.js";

const app = express();

app.use(cors()); // allow frontend to connect
app.use(express.json()); // parse JSON
app.use("/api/items", itemsRouter);
app.use("/api/tags", tagsRouter);
app.use("/api/tagMapping", tagMappingRouter);

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
    console.log(`API server running on port ${PORT}`);
});