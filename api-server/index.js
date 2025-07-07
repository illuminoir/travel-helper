import express from "express";
import cors from "cors";
import itemsRouter from "./routes/items.js";

const app = express();

app.use(cors()); // allow frontend to connect
app.use(express.json()); // parse JSON
app.use("/api/items", itemsRouter); // ✅ this is the mounting

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
    console.log(`API server running on port ${PORT}`);
});