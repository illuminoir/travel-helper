import express from "express";
import pool from "../db.js";

const router = express.Router();

router.get("/", async (req, res) => {
    try {
        const [tags] = await pool.query("SELECT * FROM tags WHERE user_id = ?", [req.userId]);
        return res.json(tags);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Database error when getting all tags" });
    }
});

router.put("/", async (req, res) => {
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: "Missing or invalid 'name'" });

    try {
        const [result] = await pool.query(
            "INSERT INTO tags (name, user_id) VALUES (?, ?)",
            [name, req.userId]
        );
        res.status(201).json({ message: "Tag created", id: result.insertId, name });
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: "Database error" });
    }
});

router.delete("/:id", async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query("DELETE FROM tags WHERE id = ? AND user_id = ?", [id, req.userId]);
        res.json({ success: true, message: "Tag deleted." });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Database error" });
    }
});

router.delete("/", async (req, res) => {
    try {
        await pool.query("DELETE FROM tags WHERE user_id = ?", [req.userId]);
        res.json({ success: true, message: "Tags deleted." });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Database error" });
    }
});

export default router;