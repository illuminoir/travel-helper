import express from "express";
import pool from "../db.js";

const router = express.Router();

router.get("/", async (req, res) => {
    try {
        const [rows] = await pool.query("SELECT * FROM travel_items");
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: "Database error" });
    }
});

router.put("/", async (req, res) => {
    const { name, weight } = req.body;

    if (!name || typeof weight !== "number") {
        return res.status(400).json({ error: "Missing or invalid 'name' or 'weight'" });
    }

    try {
        const [result] = await pool.query(
            "INSERT INTO travel_items (name, weight) VALUES (?, ?)",
            [name, weight]
        );

        res.status(201).json({ message: "Item inserted", inserted: { name, weight } });
    } catch (err) {
        if (err.code === "ER_DUP_ENTRY") {
            res.status(409).json({ error: `Item with name '${name}' already exists` });
        } else {
            console.log(err);
            res.status(500).json({ error: "Database error" });
        }
    }
});

export default router;